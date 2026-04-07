import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FAQSection } from "@/modules/landig-page/components/FAQSection";
import { CalendlyCta } from "@/modules/landig-page/components/CalendlyCta";
import Script from "next/script";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

export const metadata: Metadata = {
  title: "Seguridad y Privacidad | EthicVoice",
  description:
    "Protegemos sus datos con los más altos estándares de seguridad y privacidad: ISO, auditorías SOC y cifrado de extremo a extremo.",
};

const ctaLime =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-[0_0_24px_rgba(190,242,100,0.35)] transition hover:bg-lime-300";

function PageDecorBeige() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(20,83,45,0.06)_0%,transparent_50%)]" />
      <svg
        className="absolute -right-[10%] top-1/4 h-64 w-96 opacity-[0.12] md:opacity-20"
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#14532d" strokeWidth="1" strokeLinecap="round">
          <path d="M0 240 Q100 120 200 180 T400 100" />
          <path d="M0 200 Q120 80 280 160 T400 60" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <MarketingPageShell>
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />

      {/* Hero — misma línea que home (verde oscuro + lima) */}
      <section className="relative overflow-hidden bg-[#0a1f14] px-4 pb-16 pt-10 md:px-6 md:pb-20 md:pt-14">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_35%,rgba(22,101,52,0.4)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.32fr)] lg:items-center lg:gap-12 xl:gap-16">
            <div className="space-y-6 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90">
                Confianza
              </p>
              <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-[2.65rem]">
                Seguridad y{" "}
                <span className="text-lime-400">Privacidad</span>
              </h1>
              <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-white/80 lg:mx-0 lg:max-w-lg">
                Garantizar la seguridad de sus datos es nuestra máxima
                prioridad. Medidas alineadas con la industria, auditorías
                externas y privacidad por diseño.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="#whistleblowing-security"
                  className="inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-3.5 text-sm font-bold text-gray-950 shadow-[0_0_28px_rgba(190,242,100,0.35)] transition hover:bg-lime-300"
                >
                  Leer más
                </Link>
                <CalendlyCta className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Hablar con expertos
                  <i className="icon-[mdi--arrow-right] size-5 transition-transform group-hover:-rotate-45" />
                </CalendlyCta>
              </div>
            </div>
            <div className="flex w-full justify-center lg:justify-end">
              <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 shadow-[0_0_48px_rgba(0,0,0,0.45)] sm:max-w-2xl lg:max-w-none lg:rounded-3xl">
                <Image
                  src="/privacidad/hero.jpeg"
                  alt="Seguridad y privacidad en EthicVoice"
                  width={1536}
                  height={1024}
                  className="block h-auto w-full align-top"
                  sizes="(min-width: 1280px) 680px, (min-width: 1024px) 58vw, (min-width: 640px) 90vw, 100vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pb-4 md:pb-8">
        {/* Pilares de seguridad */}
        <section
          id="whistleblowing-security"
          className="relative overflow-hidden bg-gradient-to-b from-[#f5f3ee] via-[#faf9f6] to-[#f5f3ee] px-4 py-16 md:px-6 md:py-20"
        >
          <PageDecorBeige />
          <div className="relative z-10 container mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/65">
                Protección de datos
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight text-[#0a1f14] md:text-4xl">
                Tus datos de denuncias están{" "}
                <span className="text-lime-600">seguros</span> con nosotros
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 md:text-base">
                Auditados y alineados con estándares globales de seguridad y
                privacidad.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-6xl rounded-3xl border border-[#0a1f14]/10 bg-white/95 p-6 shadow-lg shadow-[#0a1f14]/05 ring-1 ring-black/[0.04] md:p-10 lg:p-12">
              <div className="mb-10 hidden flex-wrap items-center justify-center gap-6 md:flex">
                {[
                  { icon: "icon-[mdi--lock]", label: "Cifrado" },
                  { icon: "icon-[mdi--shield-key]", label: "MFA / SSO" },
                  { icon: "icon-[mdi--backup-restore]", label: "Respaldos" },
                  { icon: "icon-[mdi--account-lock]", label: "Accesos" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-lime-400/25 bg-[#0a1f14]/5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#0a1f14]"
                  >
                    <i
                      className={`${item.icon} mb-1 text-2xl text-lime-600`}
                      aria-hidden
                    />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                {[
                  {
                    icon: "icon-[mdi--shield-check]",
                    title: "Buenas prácticas de seguridad",
                    body: "Controles técnicos y organizativos: cifrado en tránsito y en reposo, acceso por roles, registro y monitoreo.",
                  },
                  {
                    icon: "icon-[mdi--check-circle]",
                    title: "Evaluaciones y pruebas",
                    body: "Revisiones periódicas y mejoras continuas con proveedores y asesores. Detalles bajo confidencialidad cuando aplique.",
                  },
                  {
                    icon: "icon-[mdi--lock]",
                    title: "Privacidad por diseño",
                    body: "Flujos que minimizan datos y retención; anonimato, eliminación y retención configurable por organización.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-[#0a1f14]/08 bg-[#f5f3ee]/60 p-6 text-center transition hover:border-lime-400/30 hover:shadow-md md:text-left"
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/15 ring-1 ring-lime-400/25 md:mx-0">
                      <i
                        className={`${card.icon} text-3xl text-lime-600`}
                        aria-hidden
                      />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a1f14]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center md:mt-12">
                <CalendlyCta className={ctaLime}>
                  Hablar con nuestros expertos
                  <i className="icon-[mdi--arrow-right] size-5 transition-transform group-hover:-rotate-45" />
                </CalendlyCta>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonio */}
        <section className="relative overflow-hidden bg-[#0a1f14] px-4 py-16 md:px-6 md:py-24">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(163,230,53,0.08)_0%,transparent_50%)]"
            aria-hidden
          />
          <div className="relative z-10 container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
              <div className="flex justify-center md:order-1">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)] ring-1 ring-white/5">
                  <Image
                    src="/platform/company.jpg"
                    alt="Equipo de tecnología EthicVoice"
                    width={400}
                    height={400}
                    className="h-64 w-64 object-cover md:h-80 md:w-80"
                  />
                </div>
              </div>
              <div className="space-y-6 text-center md:order-2 md:text-left">
                <span className="inline-block h-1 w-12 rounded-full bg-lime-400" aria-hidden />
                <blockquote className="text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl">
                  “La misión de nuestro equipo es construir un sistema líder que
                  cumpla con los más altos estándares de seguridad y privacidad,
                  y que al mismo tiempo sea sencillo de usar.”
                </blockquote>
                <div>
                  <p className="text-lg font-semibold text-white">
                    Dirección de Tecnología
                  </p>
                  <p className="text-white/60">EthicVoice</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Traducciones */}
        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
              <div className="flex justify-center">
                <div className="inline-block max-w-full overflow-hidden rounded-3xl border border-[#0a1f14]/10 shadow-xl shadow-gray-200/60 ring-1 ring-black/[0.04]">
                  <Image
                    src="/platform/multidioma-platform.jpeg"
                    alt="Plataforma multidioma de EthicVoice"
                    width={420}
                    height={420}
                    className="h-auto w-full max-w-md"
                  />
                </div>
              </div>
              <div className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/65">
                  Precisión
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-[#0a1f14] md:text-4xl lg:text-5xl">
                  Traducciones humanas{" "}
                  <span className="text-lime-600">integradas</span>
                </h2>
                <p className="text-lg leading-relaxed text-gray-600">
                  La traducción automática puede ser impresionante, pero también
                  innecesariamente riesgosa cuando tratamos temas muy sensibles.
                  Las traducciones humanas siguen siendo indispensables cuando
                  debemos estar 100% seguros de lo que se reporta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MFA */}
        <section className="relative overflow-hidden bg-[#f5f3ee] px-4 py-16 md:px-6 md:py-20">
          <PageDecorBeige />
          <div className="relative z-10 container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
              <div className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/65">
                  Acceso
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-[#0a1f14] md:text-4xl lg:text-5xl">
                  Autenticación{" "}
                  <span className="text-lime-600">multifactor</span>
                </h2>
                <p className="text-lg leading-relaxed text-gray-600">
                  MFA y SSO son esenciales para un procesamiento de datos
                  seguro. Mantén control total sobre quién accede a qué datos en
                  tu plataforma de denuncias.
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#0a1f14]/12 bg-white shadow-xl shadow-[#0a1f14]/10 ring-1 ring-black/[0.04]">
                  <div className="border-b border-[#0a1f14]/10 bg-[#0a1f14] px-5 py-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-sm font-bold text-gray-950">
                          S
                        </div>
                        <span className="text-sm font-medium">
                          De: EthicVoice
                        </span>
                      </div>
                      <span className="text-xs text-white/60">ahora</span>
                    </div>
                  </div>
                  <div className="space-y-4 px-5 py-6">
                    <p className="text-sm text-gray-700">
                      Tu código 2FA es:{" "}
                      <span className="font-mono font-semibold text-[#0a1f14]">
                        491024
                      </span>
                    </p>
                    <div className="flex justify-center gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex h-9 w-9 items-center justify-center text-xl font-bold text-lime-600"
                          aria-hidden
                        >
                          *
                        </div>
                      ))}
                    </div>
                    <span className="flex w-full cursor-default items-center justify-center rounded-full bg-lime-400 py-2.5 text-sm font-bold text-gray-950 opacity-90">
                      Iniciar sesión
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Regulaciones */}
        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
              <div className="order-2 flex justify-center md:order-1">
                <div className="inline-block max-w-full overflow-hidden rounded-3xl border border-[#0a1f14]/10 shadow-lg ring-1 ring-black/[0.04]">
                  <Image
                    src="/platform/advanced-security.jpeg"
                    alt="Cumplimiento y certificaciones"
                    width={640}
                    height={480}
                    className="h-auto w-full max-w-lg"
                  />
                </div>
              </div>
              <div className="order-1 space-y-5 md:order-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/65">
                  Cumplimiento
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-[#0a1f14] md:text-4xl lg:text-5xl">
                  Regulaciones de{" "}
                  <span className="text-lime-600">privacidad</span>
                </h2>
                <p className="text-lg leading-relaxed text-gray-600">
                  Asegura el cumplimiento con GDPR, la Directiva Europea de
                  Denunciantes y más. Gestionamos retención y localización de
                  datos según tu contexto.
                </p>
                <CalendlyCta className={ctaLime}>
                  Solicitar demo
                  <i className="icon-[mdi--arrow-right] size-5 transition-transform group-hover:-rotate-45" />
                </CalendlyCta>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[#f5f3ee] px-4 py-10 md:py-14">
          <FAQSection />
        </div>

        <section className="relative overflow-hidden bg-[#0a1f14] px-4 py-16 md:px-6 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(22,101,52,0.45)_0%,transparent_55%)]"
            aria-hidden
          />
          <div className="relative z-10 container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Demo de seguridad y privacidad
            </h2>
            <p className="mt-3 text-white/75">
              Vea cómo EthicVoice protege sus datos y simplifica el cumplimiento
              normativo.
            </p>
            <CalendlyCta className={`${ctaLime} mt-8`}>
              Solicitar demo
              <i className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45" />
            </CalendlyCta>
          </div>
        </section>
      </div>
    </MarketingPageShell>
  );
}
