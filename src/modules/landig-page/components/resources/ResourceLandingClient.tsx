"use client";

/**
 * Landing pública dinámica para recursos descargables (lead magnets).
 * El contenido (título, descripción, portada, campos del formulario, campaña)
 * se administra desde Super Admin → Recursos descargables.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  EbookLeadCaptcha,
  type EbookLeadCaptchaHandle,
} from "@/modules/landig-page/components/ebook/EbookLeadCaptcha";
import { trackGA4Event } from "@/lib/google-analytics";
import { Logo } from "@/modules/brand/components/Logo";
import { Button, Container } from "@/modules/brand/components/primitives";
import { RevealController } from "@/modules/brand/components/RevealController";

export interface ResourceLandingData {
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  ctaLabel: string | null;
  formFields: { phone: boolean; company: boolean; role: boolean };
}

interface Props {
  resource: ResourceLandingData;
  utm: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}

const inputClass =
  "h-12 w-full rounded-xl border border-ev-line bg-white px-4 text-[0.9375rem] text-ev-night outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ev-haze focus:border-ev-night/50 focus:shadow-[0_0_0_4px_rgba(152,208,80,0.3)]";

export function ResourceLandingClient({ resource, utm }: Props) {
  const router = useRouter();
  const captchaRef = useRef<EbookLeadCaptchaHandle>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const siteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);
  const fields = resource.formFields;

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!acceptedPrivacy) {
        setErrorMsg("Debes aceptar la política de tratamiento de datos.");
        setStatus("error");
        return;
      }
      if (siteKeyConfigured && !hcaptchaToken) {
        setErrorMsg("Completa la verificación de seguridad.");
        setStatus("error");
        return;
      }
      setStatus("loading");
      setErrorMsg("");
      try {
        const res = await fetch("/api/public/resource-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: resource.slug,
            fullName,
            email,
            phone: fields.phone ? phone : undefined,
            company: fields.company ? company : undefined,
            role: fields.role ? role : undefined,
            sourcePath: `/recursos/${resource.slug}`,
            hcaptchaToken: hcaptchaToken ?? undefined,
            ...utm,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          thankYouUrl?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "No pudimos registrar tu solicitud.");
        }
        trackGA4Event("resource_lead_submitted", {
          resource_slug: resource.slug,
        });
        router.push(data.thankYouUrl || `/recursos/${resource.slug}/gracias`);
      } catch (err) {
        captchaRef.current?.reset();
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Inténtalo nuevamente."
        );
      }
    },
    [
      acceptedPrivacy,
      company,
      email,
      fields,
      fullName,
      hcaptchaToken,
      phone,
      resource.slug,
      role,
      router,
      siteKeyConfigured,
      utm,
    ]
  );

  return (
    <main className="ev-site min-h-screen">
      <RevealController />
      <header className="border-b border-ev-line">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="EthicVoice — inicio">
            <Logo markClassName="h-7 w-auto" />
          </Link>
          <span className="ev-label text-ev-mute">Recurso gratuito</span>
        </Container>
      </header>

      <Container className="grid gap-14 py-14 sm:py-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <p className="ev-label text-ev-moss">(PDF) Recurso descargable</p>
          <h1 className="mt-6 text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-ev-night">
            {resource.title}
          </h1>
          {resource.description ? (
            <p className="ev-lead mt-6 max-w-xl whitespace-pre-line">{resource.description}</p>
          ) : null}
          {resource.coverImageUrl ? (
            <div className="relative mt-10 aspect-[4/3] w-full max-w-md overflow-hidden rounded-[1.25rem] bg-ev-bone">
              <Image
                src={resource.coverImageUrl}
                alt={resource.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="rounded-[1.75rem] border border-ev-night/10 bg-white p-6 shadow-[0_50px_100px_-50px_rgba(11,29,33,0.45)] sm:p-9">
          <p className="ev-label text-ev-moss">Acceso inmediato</p>
          <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-ev-night">
            Descarga gratuita
          </h2>
          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre completo*"
              className={inputClass}
              autoComplete="name"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo corporativo*"
              className={inputClass}
              autoComplete="email"
            />
            {fields.phone && (
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono*"
                className={inputClass}
                autoComplete="tel"
              />
            )}
            {fields.company && (
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Empresa*"
                className={inputClass}
                autoComplete="organization"
              />
            )}
            {fields.role && (
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Cargo*"
                className={inputClass}
                autoComplete="organization-title"
              />
            )}

            <label className="flex items-start gap-2.5 text-sm leading-relaxed text-ev-mute">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B1D21]"
              />
              <span>
                Acepto la{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="text-ev-night underline decoration-ev-signal decoration-2 underline-offset-4"
                >
                  Política de Tratamiento de Datos Personales
                </Link>
                *
              </span>
            </label>

            <EbookLeadCaptcha ref={captchaRef} onToken={setHcaptchaToken} />

            {status === "error" && errorMsg ? (
              <p role="alert" className="rounded-xl border border-ev-coral/40 bg-[#FBE6E1] px-4 py-3 text-sm text-[#7A2415]">
                {errorMsg}
              </p>
            ) : null}

            <Button type="submit" variant="signal" size="lg" arrow className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Enviando…" : resource.ctaLabel || "Descargar el recurso"}
            </Button>
            <p className="ev-label text-center text-ev-haze">Sin costo · Sin spam · Acceso inmediato</p>
          </form>
          </div>
        </div>
      </Container>
    </main>
  );
}
