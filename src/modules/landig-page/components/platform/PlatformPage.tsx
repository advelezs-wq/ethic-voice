"use client";

import Link from "next/link";
import Image from "next/image";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

const pillars = [
  {
    icon: "icon-[lucide--megaphone]",
    title: "Recepción multicanal segura",
    desc: "Web, email, chatbot y teléfono en una sola vista, con captura estructurada y trazable.",
  },
  {
    icon: "icon-[lucide--clipboard-list]",
    title: "Investigaciones con control",
    desc: "SLA, responsables, evidencias y comunicaciones en cada caso para operar con rigor.",
  },
  {
    icon: "icon-[lucide--sparkles]",
    title: "Analítica e IA aplicada",
    desc: "Priorización, resúmenes y señales de riesgo para acelerar decisiones de compliance.",
  },
];

const modules = [
  {
    title: "Analitica avanzada e IA",
    desc: "Extrae entidades clave, clasifica severidad y sugiere prioridades para reducir tiempos de respuesta.",
    bullets: [
      "Deteccion de patrones y terminos sensibles",
      "Resumen ejecutivo por caso",
      "Priorizacion por impacto y urgencia",
    ],
    image: "/platform/ai-analysis.jpeg",
    imageAlt: "Panel de analitica e IA de EthicVoice",
  },
  {
    title: "Seguridad y privacidad por diseno",
    desc: "Anonimato configurable, cifrado y control de acceso granular para contextos regulados.",
    bullets: [
      "Flujos anonimos y confidenciales",
      "Control por roles y trazabilidad completa",
      "Registro de auditoria y gobierno del dato",
    ],
    image: "/platform/advanced-security.jpeg",
    imageAlt: "Controles de seguridad de la plataforma",
  },
  {
    title: "Operacion global multidioma",
    desc: "Experiencia localizada para denunciantes e investigadores en operaciones distribuidas.",
    bullets: [
      "Interfaz y formularios localizados",
      "Comunicacion bidireccional traducida",
      "Soporte para equipos multisede",
    ],
    image: "/platform/multidioma-platform.jpeg",
    imageAlt: "Vista multidioma de EthicVoice",
  },
  {
    title: "Backoffice colaborativo",
    desc: "Tableros por estado, asignaciones y seguimiento compartido entre compliance, legal y RRHH.",
    bullets: [
      "Flujos por etapa y propietario",
      "Notas internas y evidencias centralizadas",
      "Visibilidad para comites y liderazgo",
    ],
    image: "/platform/workspace-organizational.jpeg",
    imageAlt: "Backoffice colaborativo para gestion de casos",
  },
];

export const PlatformPage = () => {
  const { openCalendly } = useCalendlyGate();

  return (
    <>
      <section className="relative overflow-hidden border-t border-slate-200 bg-white px-5 pb-14 pt-10 md:px-8 md:pb-20 md:pt-14">
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          {[25, 50, 75].map((left) => (
            <div
              key={left}
              className="absolute bottom-0 top-0 w-px bg-black/[0.07]"
              style={{ left: `${left}%`, transform: "translateX(-50%)" }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(94,210,156,0.16),transparent_45%)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">Producto</p>
              <h1 className="mt-3 text-4xl font-semibold leading-[1.03] tracking-tight text-[#051a24] md:text-6xl">
                Plataforma <span className="text-lime-700">EthicVoice</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#273c46]">
                Reportes confiables, gestion de casos, analiticas avanzadas e IA para transformar cumplimiento en una
                operacion medible y trazable.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={(e) => openCalendly(e)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-7 py-3 text-sm font-semibold text-[#052b24] transition-colors hover:bg-lime-500"
                >
                  Agendar demo de plataforma
                  <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
                </button>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#051a24] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_4px_24px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-80"
                >
                  Ver planes
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-emerald-900/15">
                <Image
                  src="/platform/preview-1.jpg"
                  alt="Vista general de la plataforma EthicVoice"
                  width={2340}
                  height={1368}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingSectionV2
        id="overview"
        eyebrow="Capacidades clave"
        title="La operacion que necesita un equipo de cumplimiento moderno"
        subtitle="Diseñada para integrar recepcion, investigacion y decision en un mismo flujo."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-lime-100 text-lime-700">
                <i className={`${item.icon} h-5 w-5`} aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-[#0d212c]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#273c46]">{item.desc}</p>
            </article>
          ))}
        </div>
      </MarketingSectionV2>

      <MarketingSectionV2
        id="features"
        surface
        eyebrow="Modulos de plataforma"
        title="Todo el flujo de denuncias y cumplimiento en un solo lugar"
        subtitle="Una experiencia clara para denunciantes, investigadores y equipos de liderazgo."
      >
        <div className="space-y-7">
          {modules.map((module, idx) => (
            <article
              key={module.title}
              className="grid items-center gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] md:p-6 lg:grid-cols-12"
            >
              <div className={`lg:col-span-6 ${idx % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#0d212c]">{module.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#273c46] md:text-base">{module.desc}</p>
                <ul className="mt-4 space-y-2.5">
                  {module.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-[#273c46]">
                      <i className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-lime-600" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-6 ${idx % 2 === 0 ? "lg:order-2" : "lg:order-1"}`}>
                <Image
                  src={module.image}
                  alt={module.imageAlt}
                  width={1400}
                  height={980}
                  className="h-[250px] w-full object-cover md:h-[320px]"
                />
              </div>
            </article>
          ))}
        </div>
      </MarketingSectionV2>

      <MarketingSectionV2
        id="security"
        eyebrow="Gobierno y confianza"
        title="Seguridad, trazabilidad y control para contextos regulados"
        subtitle="Arquitectura pensada para compliance, legal y auditoria."
      >
        <section className="rounded-[28px] border border-emerald-700/30 bg-gradient-to-br from-[#06251f] via-[#07352b] to-[#052b24] p-6 text-white shadow-[0_28px_80px_-36px_rgba(6,37,31,0.85)] md:p-9">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              "Bitacora integral de eventos y acciones por caso",
              "Permisos granulares por rol, area y sensibilidad",
              "Tiempos de respuesta y SLA con seguimiento continuo",
              "Evidencias y comunicacion centralizadas por expediente",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <div className="flex items-start gap-2">
                  <i className="icon-[lucide--shield-check] mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                  <p className="text-sm leading-relaxed text-white/90">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </MarketingSectionV2>

      <MarketingSectionV2 className="!py-20" guides={[{ percent: 15, accent: true }, { percent: 85, accent: true }]}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0d212c] md:text-5xl">
            Lleva tu canal de denuncias a estandar enterprise
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#273c46] md:text-lg">
            Agenda una demo y diseña un flujo de cumplimiento alineado con tu estructura, riesgos y objetivos.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={(e) => openCalendly(e)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-8 py-4 text-sm font-bold text-[#070b0a] transition-colors hover:bg-lime-500"
            >
              Solicitar demo personalizada
              <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
            </button>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-[#0d212c] transition-colors hover:border-lime-500 hover:text-lime-700"
            >
              Explorar servicios complementarios
            </Link>
          </div>
        </div>
      </MarketingSectionV2>
    </>
  );
};