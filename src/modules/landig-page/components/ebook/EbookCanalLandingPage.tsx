"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { trackGA4Event } from "@/lib/google-analytics";
import {
  EbookLeadCaptcha,
  type EbookLeadCaptchaHandle,
} from "@/modules/landig-page/components/ebook/EbookLeadCaptcha";
import { resolvePublicEbookPdfUrl } from "@/lib/ebook-public-pdf";
import { Logo } from "@/modules/brand/components/Logo";
import {
  Button,
  Container,
  Eyebrow,
  RevealHeading,
  Voice,
  reveal,
} from "@/modules/brand/components/primitives";
import { IndexList } from "@/modules/brand/components/sections";
import { SiteFooter } from "@/modules/brand/components/SiteFooter";
import { RevealController } from "@/modules/brand/components/RevealController";

export type EbookUtm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

type Props = { utm: EbookUtm };

const siteKeyConfigured =
  typeof process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY === "string" &&
  process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY.length > 0;

const GOODBYE_ITEMS = [
  "Enterarte del problema cuando ya es demasiado tarde",
  "Un buzón de sugerencias que nadie usa ni gestiona",
  "Perder reputación, dinero y talento por lo que pudo prevenirse",
  "Cumplir la norma “de papel” sin un sistema que funcione",
] as const;

const DISCOVER_ITEMS = [
  {
    title: "Por qué la mayoría de los fraudes se detectan por denuncia",
    body: "Y no por auditoría: cómo aprovechar eso a tu favor.",
  },
  {
    title: "El ciclo completo de una denuncia",
    body: "Desde la recepción hasta el cierre, con acciones correctivas documentadas.",
  },
  {
    title: "Canal básico vs. canal que protege",
    body: "Qué los diferencia y por qué un correo electrónico no es suficiente.",
  },
  {
    title: "Cómo proteger al denunciante",
    body: "El pilar que define si las personas usan o ignoran tu canal.",
  },
  {
    title: "El marco regulatorio que ya te aplica",
    body: "SARLAFT, SAGRILAFT y Ley 2195 de 2022 en Colombia; México, Brasil, Argentina, Chile y Perú.",
  },
  {
    title: "El rol de la Alta Dirección",
    body: "Sin compromiso desde arriba, el sistema no funciona.",
  },
] as const;

const REGIONS = ["Colombia", "México", "Brasil", "Argentina", "Chile", "Perú"] as const;

const FIELDS = [
  { id: "fullName", label: "Nombre completo", type: "text", auto: "name", placeholder: "Tu nombre", span: false },
  { id: "phone", label: "Teléfono", type: "tel", auto: "tel", placeholder: "+57 …", span: false },
  { id: "email", label: "Correo corporativo", type: "email", auto: "email", placeholder: "nombre@empresa.com", span: true },
  { id: "company", label: "Empresa", type: "text", auto: "organization", placeholder: "Razón social", span: false },
  { id: "role", label: "Cargo", type: "text", auto: "organization-title", placeholder: "Ej. Oficial de cumplimiento", span: false },
] as const;

type FieldId = (typeof FIELDS)[number]["id"];

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-ev-line bg-white px-4 text-[0.9375rem] text-ev-night outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ev-haze focus:border-ev-night/50 focus:shadow-[0_0_0_4px_rgba(152,208,80,0.3)]";

function LeadForm({ utm }: { utm: EbookUtm }) {
  const router = useRouter();
  const captchaRef = useRef<EbookLeadCaptchaHandle>(null);
  const [values, setValues] = useState<Record<FieldId, string>>({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    role: "",
  });
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState(resolvePublicEbookPdfUrl);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg("");
      if (siteKeyConfigured && !hcaptchaToken) {
        setErrorMsg("Completa la verificación de seguridad.");
        setStatus("error");
        return;
      }
      setStatus("loading");
      try {
        const res = await fetch("/api/public/ebook-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: values.fullName.trim(),
            phone: values.phone.trim(),
            email: values.email.trim().toLowerCase(),
            company: values.company.trim(),
            role: values.role.trim(),
            hcaptchaToken: hcaptchaToken ?? undefined,
            campaign: "guia_canal_denuncias",
            sourcePath: window.location.pathname,
            ...utm,
          }),
        });
        const data = (await res.json()) as { error?: string; pdfUrl?: string };
        if (!res.ok) {
          setErrorMsg(data.error || "Algo salió mal. Inténtalo de nuevo.");
          setStatus("error");
          captchaRef.current?.reset();
          return;
        }
        if (typeof data.pdfUrl === "string" && data.pdfUrl.length > 0) {
          setPdfUrl(data.pdfUrl);
        }
        trackGA4Event("generate_lead", {
          cta_name: "ebook_guia_canal_denuncias",
          placement: "ebook_landing",
        });
        setStatus("success");
        // Página de gracias para medir la conversión (descarga + visitas)
        router.push("/guia-canal-denuncias/gracias");
      } catch {
        setErrorMsg("Error de red. Revisa tu conexión e inténtalo de nuevo.");
        setStatus("error");
        captchaRef.current?.reset();
      }
    },
    [hcaptchaToken, router, utm, values],
  );

  if (status === "success") {
    return (
      <div className="py-6">
        <p className="ev-label text-ev-moss">Listo</p>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ev-night">
          Gracias. Tu guía está en camino.
        </p>
        <p className="mt-2 text-ev-mute">Revisa tu correo; si no lo ves, busca en spam o promociones.</p>
        {pdfUrl ? (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex text-ev-night underline decoration-ev-signal decoration-2 underline-offset-4">
            Abrir la guía (PDF)
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.id} className={f.span ? "sm:col-span-2" : ""}>
            <label htmlFor={`ev-${f.id}`} className="ev-label text-ev-mute">
              {f.label}
            </label>
            <input
              id={`ev-${f.id}`}
              name={f.id}
              type={f.type}
              autoComplete={f.auto}
              required
              maxLength={f.id === "phone" ? 40 : f.id === "email" ? 320 : 200}
              inputMode={f.id === "phone" ? "tel" : undefined}
              value={values[f.id]}
              onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
              placeholder={f.placeholder}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <EbookLeadCaptcha ref={captchaRef} theme="light" onToken={setHcaptchaToken} />

      {status === "error" && errorMsg ? (
        <p role="alert" className="rounded-xl border border-ev-coral/40 bg-[#FBE6E1] px-4 py-3 text-sm text-[#7A2415]">
          {errorMsg}
        </p>
      ) : null}

      <Button type="submit" variant="signal" size="lg" arrow className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Enviando…" : "Descargar la guía gratis"}
      </Button>
      <p className="ev-label text-center text-ev-haze">Sin costo · Sin spam · Acceso inmediato</p>
    </form>
  );
}

export function EbookCanalLandingPage({ utm }: Props) {
  const scrollToForm = () =>
    document.getElementById("descargar")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="ev-site min-h-screen">
      <RevealController />

      {/* Cabecera mínima: en una landing de captura, sin fugas de navegación */}
      <header className="border-b border-ev-line bg-ev-paper">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="EthicVoice — inicio">
            <Logo markClassName="h-7 w-auto" />
          </Link>
          <span className="ev-label hidden text-ev-mute sm:block">EthicVoice × Valor Estratégico</span>
          <Button variant="ink" className="h-10 px-4 text-sm" onClick={scrollToForm}>
            Descargar gratis
          </Button>
        </Container>
      </header>

      {/* Hero con el formulario en la primera pantalla */}
      <section className="ev-grain relative overflow-hidden bg-ev-paper">
        <Container className="pb-24 pt-12 sm:pt-16 lg:pb-32">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <Eyebrow index="PDF">Guía práctica gratuita</Eyebrow>
              <RevealHeading
                as="h1"
                className="ev-display mt-8 text-ev-night"
                lines={["Detecta el fraude", <>antes de que sea <Voice>crisis.</Voice></>]}
              />
              <p {...reveal(250)} className="ev-lead mt-8 max-w-lg">
                Cómo implementar un canal de denuncias efectivo: la ruta paso a
                paso, el marco legal de Colombia y Latinoamérica y los errores
                que debes evitar.
              </p>

              <div {...reveal(350)} className="mt-12 hidden items-end gap-8 sm:flex">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="group relative w-36 shrink-0 [perspective:1000px] sm:w-44"
                  aria-label="Ir al formulario de descarga"
                >
                  <span className="relative block aspect-[1275/1650] rounded-r-lg rounded-l-sm shadow-[20px_30px_60px_-20px_rgba(11,29,33,0.55)] transition-transform duration-700 ease-ev-out [transform:rotateY(-18deg)] group-hover:[transform:rotateY(-6deg)]">
                    <Image
                      src="/ebook/guia-portada.jpg"
                      alt="Portada de la guía"
                      fill
                      sizes="176px"
                      priority
                      className="rounded-r-lg rounded-l-sm object-cover"
                    />
                  </span>
                </button>
                <dl className="grid grid-cols-3 gap-6 border-t border-ev-line pt-4">
                  {[
                    { v: "18", l: "Páginas" },
                    { v: "03", l: "Herramientas" },
                    { v: "06", l: "Países" },
                  ].map((m) => (
                    <div key={m.l} className="flex flex-col-reverse">
                      <dt className="ev-label mt-1 text-ev-mute">{m.l}</dt>
                      <dd className="ev-num text-3xl font-semibold text-ev-night">{m.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div id="descargar" className="scroll-mt-8 lg:col-span-5 lg:col-start-8">
              <div {...reveal(200)} className="rounded-[1.75rem] border border-ev-night/10 bg-white p-6 shadow-[0_50px_100px_-50px_rgba(11,29,33,0.45)] sm:p-9">
                <p className="ev-label text-ev-moss">Acceso inmediato</p>
                <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-ev-night">
                  Recibe la guía en tu correo
                </h2>
                <div className="mt-7">
                  <LeadForm utm={utm} />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Di adiós a… — tachado a mano alzada */}
      <section className="bg-white py-24 sm:py-32">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Eyebrow index="01">Di adiós a</Eyebrow>
            </div>
            <ul className="border-t border-ev-night lg:col-span-9">
              {GOODBYE_ITEMS.map((item, i) => (
                <li
                  key={item}
                  data-inview
                  className="border-b border-ev-line py-6 text-[clamp(1.35rem,2.8vw,2.4rem)] font-medium leading-tight tracking-[-0.04em] text-ev-mute"
                >
                  <span className="ev-strike" style={{ "--d": 250 + i * 150 } as CSSProperties}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Lo que vas a descubrir */}
      <section className="bg-ev-paper py-24 sm:py-32">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Eyebrow index="02">Dentro de la guía</Eyebrow>
            </div>
            <RevealHeading
              className="ev-h2 text-ev-night lg:col-span-9"
              lines={["Lo que vas a", <><Voice>descubrir.</Voice></>]}
            />
          </div>
          <div className="mt-16">
            <IndexList items={DISCOVER_ITEMS} columns={2} />
          </div>
        </Container>
      </section>

      {/* Credibilidad */}
      <section className="ev-grain ev-grain-dark relative overflow-hidden bg-ev-night py-28 text-white sm:py-40">
        <Container>
          <p className="ev-label text-white/45">
            <span className="text-ev-signal">(03)</span> Actuar, no aparentar
          </p>
          <p {...reveal(0)} className="mt-10 max-w-5xl text-[clamp(2rem,4.6vw,4.25rem)] font-medium leading-[1.04] tracking-[-0.045em]">
            Las organizaciones que lideran no son las que nunca enfrentan
            problemas. Son las que los <em className="ev-serif text-ev-signal">detectan a tiempo.</em>
          </p>
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-white/60">
            En Latinoamérica, un canal de denuncias efectivo ya no es opcional:
            estos países exigen mecanismos formales de reporte en sus programas
            de compliance.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <li key={r} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80">
                {r}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Cierre */}
      <section className="bg-ev-signal py-24 text-ev-night sm:py-32">
        <Container className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="ev-display max-w-3xl">
            Obtén gratis lo que te costaría <Voice>millones</Voice> ignorar.
          </h2>
          <Button variant="ink" size="lg" arrow onClick={scrollToForm}>
            Quiero la guía
          </Button>
        </Container>
      </section>

      <SiteFooter />
    </div>
  );
}
