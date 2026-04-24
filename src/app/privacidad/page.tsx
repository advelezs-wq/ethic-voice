import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FAQSection } from "@/modules/landig-page/components/FAQSection";
import { CalendlyCta } from "@/modules/landig-page/components/CalendlyCta";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

export const metadata: Metadata = {
  title: "Seguridad y Privacidad | EthicVoice",
  description:
    "Protegemos sus datos con los más altos estándares de seguridad y privacidad: ISO, auditorías SOC y cifrado de extremo a extremo.",
};

const ctaLime =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-[#052b24] shadow-[0_4px_20px_rgba(163,230,53,0.35)] transition hover:bg-lime-500";

export default function PrivacyPage() {
  return (
    <MarketingPageShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-5 pb-12 pt-10 md:px-8 md:pb-16 md:pt-14">
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          {[25, 50, 75].map((left) => (
            <div
              key={left}
              className="absolute bottom-0 top-0 w-px bg-black/[0.07]"
              style={{ left: `${left}%`, transform: "translateX(-50%)" }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(94,210,156,0.14),transparent_45%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="space-y-5 text-center lg:col-span-5 lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">
                Confianza
              </p>
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-[#051a24] md:text-5xl lg:text-[2.65rem]">
                Seguridad y <span className="text-lime-700">privacidad</span>
              </h1>
              <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-[#273c46] lg:mx-0 md:text-lg">
                Garantizar la seguridad de sus datos es nuestra máxima prioridad.
                Medidas alineadas con la industria, auditorías externas y
                privacidad por diseño.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="#whistleblowing-security"
                  className="inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_4px_20px_rgba(163,230,53,0.35)] transition hover:bg-lime-500"
                >
                  Leer más
                </Link>
                <CalendlyCta className="group inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-[#0d212c] shadow-sm transition hover:border-slate-400 hover:bg-slate-50">
                  Hablar con expertos
                  <i className="icon-[lucide--arrow-right] size-4 transition-transform group-hover:translate-x-0.5" />
                </CalendlyCta>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-emerald-900/12">
                <Image
                  src="/privacidad/hero.jpeg"
                  alt="Seguridad y privacidad en EthicVoice"
                  width={1536}
                  height={1024}
                  className="block h-auto w-full align-top"
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingSectionV2
        id="whistleblowing-security"
        surface
        eyebrow="Protección de datos"
        title="Tus datos de denuncias están seguros con nosotros"
        subtitle="Auditados y alineados con estándares globales de seguridad y privacidad."
      >
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.12)] md:p-10 lg:p-12">
          <div className="mb-10 hidden flex-wrap items-center justify-center gap-4 md:flex md:gap-6">
            {[
              { icon: "icon-[lucide--lock]", label: "Cifrado" },
              { icon: "icon-[lucide--key-round]", label: "MFA / SSO" },
              { icon: "icon-[lucide--database-backup]", label: "Respaldos" },
              { icon: "icon-[lucide--user-round-lock]", label: "Accesos" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-lime-200/80 bg-lime-50/50 text-center text-[10px] font-semibold uppercase tracking-wide text-[#0d212c]"
              >
                <i className={`${item.icon} mb-1 text-2xl text-lime-700`} aria-hidden />
                {item.label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {[
              {
                icon: "icon-[lucide--shield-check]",
                title: "Buenas prácticas de seguridad",
                body: "Controles técnicos y organizativos: cifrado en tránsito y en reposo, acceso por roles, registro y monitoreo.",
              },
              {
                icon: "icon-[lucide--circle-check]",
                title: "Evaluaciones y pruebas",
                body: "Revisiones periódicas y mejoras continuas con proveedores y asesores. Detalles bajo confidencialidad cuando aplique.",
              },
              {
                icon: "icon-[lucide--lock]",
                title: "Privacidad por diseño",
                body: "Flujos que minimizan datos y retención; anonimato, eliminación y retención configurable por organización.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-[#f7faf9] p-6 text-center transition hover:border-slate-300 hover:shadow-md md:text-left"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-lime-100 md:mx-0">
                  <i className={`${card.icon} text-2xl text-lime-800`} aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-[#0d212c]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#273c46]">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center md:mt-12">
            <CalendlyCta className={ctaLime}>
              Hablar con nuestros expertos
              <i className="icon-[lucide--arrow-right] size-4 transition-transform group-hover:translate-x-0.5" />
            </CalendlyCta>
          </div>
        </div>
      </MarketingSectionV2>

      <MarketingSectionV2
        eyebrow="Equipo"
        title="Compromiso con estándares exigentes"
        subtitle="La seguridad y la privacidad guían cada decisión de producto."
      >
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-700/30 bg-gradient-to-br from-[#06251f] via-[#07352b] to-[#052b24] p-8 shadow-[0_28px_80px_-36px_rgba(6,37,31,0.85)] md:p-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(94,210,156,0.18), transparent 45%)",
            }}
            aria-hidden
          />
          <div className="relative z-10 grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
            <div className="flex justify-center md:order-1">
              <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-xl">
                <Image
                  src="/platform/company.jpg"
                  alt="Equipo de tecnología EthicVoice"
                  width={400}
                  height={400}
                  className="h-64 w-64 object-cover md:h-80 md:w-80"
                />
              </div>
            </div>
            <div className="space-y-5 text-center md:order-2 md:text-left">
              <span className="mx-auto block h-1 w-12 rounded-full bg-lime-400 md:mx-0" aria-hidden />
              <blockquote className="text-xl font-bold leading-snug tracking-tight text-white md:text-2xl lg:text-3xl">
                “La misión de nuestro equipo es construir un sistema líder que cumpla
                con los más altos estándares de seguridad y privacidad, y que al mismo
                tiempo sea sencillo de usar.”
              </blockquote>
              <div>
                <p className="text-lg font-semibold text-white">Dirección de Tecnología</p>
                <p className="text-white/65">EthicVoice</p>
              </div>
            </div>
          </div>
        </div>
      </MarketingSectionV2>

      <MarketingSectionV2
        surface
        eyebrow="Precisión"
        title="Traducciones humanas integradas"
        subtitle="Cuando el contexto es sensible, la precisión humana sigue siendo clave."
      >
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <div className="flex justify-center">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-20px_rgba(15,23,42,0.15)]">
              <Image
                src="/platform/multidioma-platform.jpeg"
                alt="Plataforma multidioma de EthicVoice"
                width={420}
                height={420}
                className="h-auto w-full max-w-md"
              />
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-[#273c46] md:text-lg">
              La traducción automática puede ser impresionante, pero también
              innecesariamente riesgosa cuando tratamos temas muy sensibles. Las
              traducciones humanas siguen siendo indispensables cuando debemos estar
              100% seguros de lo que se reporta.
            </p>
          </div>
        </div>
      </MarketingSectionV2>

      <MarketingSectionV2
        eyebrow="Acceso"
        title="Autenticación multifactor"
        subtitle="MFA y SSO para controlar quién accede a qué información en tu canal de denuncias."
      >
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <div className="space-y-4 md:order-1">
            <p className="text-base leading-relaxed text-[#273c46] md:text-lg">
              MFA y SSO son esenciales para un procesamiento de datos seguro. Mantén
              control total sobre quién accede a qué datos en tu plataforma de
              denuncias.
            </p>
          </div>
          <div className="flex justify-center md:order-2 md:justify-end">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-20px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-200 bg-[#0d212c] px-5 py-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-sm font-bold text-[#052b24]">
                      S
                    </div>
                    <span className="text-sm font-medium">De: EthicVoice</span>
                  </div>
                  <span className="text-xs text-white/60">ahora</span>
                </div>
              </div>
              <div className="space-y-4 px-5 py-6">
                <p className="text-sm text-[#273c46]">
                  Tu código 2FA es:{" "}
                  <span className="font-mono font-semibold text-[#0d212c]">491024</span>
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
                <span className="flex w-full cursor-default items-center justify-center rounded-full bg-lime-400 py-2.5 text-sm font-bold text-[#052b24] opacity-95">
                  Iniciar sesión
                </span>
              </div>
            </div>
          </div>
        </div>
      </MarketingSectionV2>

      <MarketingSectionV2
        surface
        eyebrow="Cumplimiento"
        title="Regulaciones de privacidad"
        subtitle="Alineación con GDPR, directivas de denunciantes y buenas prácticas de retención y localización."
      >
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <div className="order-2 flex justify-center md:order-1">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
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
            <p className="text-base leading-relaxed text-[#273c46] md:text-lg">
              Asegura el cumplimiento con GDPR, la Directiva Europea de Denunciantes y
              más. Gestionamos retención y localización de datos según tu contexto.
            </p>
            <CalendlyCta className={ctaLime}>
              Solicitar demo
              <i className="icon-[lucide--arrow-right] size-4 transition-transform group-hover:translate-x-0.5" />
            </CalendlyCta>
          </div>
        </div>
      </MarketingSectionV2>

      <MarketingSectionV2
        className="!py-16 md:!py-20"
        guides={[]}
        eyebrow="FAQ"
        title="Preguntas frecuentes"
        subtitle="Respuestas sobre la plataforma, anonimato, idiomas e implementación."
      >
        <FAQSection showHeader={false} />
      </MarketingSectionV2>

      <MarketingSectionV2
        className="!pb-24"
        guides={[{ percent: 50, accent: true }]}
        eyebrow="Demo"
        title="Demo de seguridad y privacidad"
        subtitle="Vea cómo EthicVoice protege sus datos y simplifica el cumplimiento normativo."
      >
        <div className="text-center">
          <CalendlyCta className={`${ctaLime} mx-auto`}>
            Solicitar demo
            <i className="icon-[lucide--arrow-right] ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
          </CalendlyCta>
        </div>
      </MarketingSectionV2>
    </MarketingPageShell>
  );
}
