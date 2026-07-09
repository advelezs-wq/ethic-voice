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
  "w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-emerald-600";

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
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40">
      {/* Barra superior */}
      <header className="border-b border-slate-200/70 bg-[#0b1620] px-5 py-4 text-center">
        <p className="text-sm font-semibold text-emerald-300">
          Recurso gratuito · EthicVoice
        </p>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-14 lg:py-16">
        {/* Columna izquierda: título + descripción + portada */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Recurso gratuito · Descargable
          </p>
          <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0d212c] sm:text-4xl lg:text-[2.6rem]">
            {resource.title}
          </h1>
          {resource.description ? (
            <p className="mt-4 max-w-xl whitespace-pre-line text-base leading-relaxed text-slate-600">
              {resource.description}
            </p>
          ) : null}

          {resource.coverImageUrl ? (
            <div className="relative mt-8 aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.35)]">
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

          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
            100% privacidad. No hacemos spam.
          </p>
        </div>

        {/* Columna derecha: formulario */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)] sm:p-8">
          <h2 className="text-xl font-bold text-[#0d212c]">
            Descarga <span className="text-emerald-700">gratuita</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Completa el formulario y accede al recurso al instante.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
              />
              <span>
                Acepto la{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="font-semibold text-emerald-700 underline underline-offset-2"
                >
                  Política de Tratamiento de Datos Personales
                </Link>
                *
              </span>
            </label>

            <EbookLeadCaptcha ref={captchaRef} onToken={setHcaptchaToken} />

            {status === "error" && errorMsg ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMsg}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(5,150,105,0.6)] transition hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {status === "loading" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enviando…
                </>
              ) : (
                <>
                  <i className="icon-[lucide--download] h-4 w-4" aria-hidden />
                  {resource.ctaLabel || "Quiero descargar el recurso"}
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <i className="icon-[lucide--lock] h-3.5 w-3.5" aria-hidden />
              Tu información está segura. No enviamos spam.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
