"use client";

import Image from "next/image";
import type { ComponentType } from "react";
import {
  Button,
  ButtonLink,
  Container,
  Voice,
  reveal,
} from "@/modules/brand/components/primitives";
import {
  BrowserFrame,
  IndexList,
  PageHero,
  Section,
} from "@/modules/brand/components/sections";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import {
  PanelClasifica,
  PanelInvestiga,
  PanelRecibe,
  PanelReporta,
} from "@/modules/landig-page/components/v5/HowItWorks";

const PILLARS = [
  {
    title: "Recepción multicanal segura",
    body: "Web, correo, WhatsApp y teléfono en una sola vista, con captura estructurada y trazable.",
  },
  {
    title: "Investigaciones con control",
    body: "SLA, responsables, evidencias y comunicaciones en cada caso para operar con rigor.",
  },
  {
    title: "Analítica e IA aplicada",
    body: "Priorización, resúmenes y señales de riesgo para acelerar las decisiones de compliance.",
  },
] as const;

/** Vista de chat traducido — construida en código. */
function PanelMultilang() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-ev-night/10 bg-white p-6 shadow-[0_50px_100px_-40px_rgba(11,29,33,0.35)] sm:p-7">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ev-night">Chat del caso EV-2026-0160</span>
        <span className="ev-label rounded-full border border-ev-line px-2.5 py-1 text-ev-mute">ES · EN · PT</span>
      </div>
      <div className="mt-6 space-y-4">
        <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-ev-paper px-4 py-3">
          <p className="text-sm leading-relaxed text-ev-ink">I saw inventory leaving the warehouse without a slip.</p>
          <p className="mt-2 border-t border-ev-line pt-2 text-sm leading-relaxed text-ev-mute">
            <span className="ev-label mr-2 text-ev-moss">ES</span>
            Vi inventario saliendo de bodega sin remisión.
          </p>
        </div>
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-ev-night px-4 py-3 text-white">
          <p className="text-sm leading-relaxed">¿Recuerdas la fecha aproximada?</p>
          <p className="mt-2 border-t border-white/10 pt-2 text-sm leading-relaxed text-white/55">
            <span className="ev-label mr-2 text-ev-signal">EN</span>
            Do you remember the approximate date?
          </p>
        </div>
      </div>
    </div>
  );
}

const MODULES: ReadonlyArray<{
  kicker: string;
  title: string;
  body: string;
  bullets: readonly string[];
  Panel: ComponentType;
}> = [
  {
    kicker: "Recepción",
    title: "Formularios que la gente sí completa",
    body: "Formularios a la medida de tu organización, anónimos o identificados, con adjuntos cifrados y confirmación con clave de seguimiento.",
    bullets: ["Constructor de formularios", "Clave única de seguimiento", "Evidencia protegida"],
    Panel: PanelRecibe,
  },
  {
    kicker: "Analítica e IA",
    title: "Cada denuncia, leída al instante",
    body: "La IA extrae entidades clave, clasifica severidad y sugiere prioridades para reducir los tiempos de respuesta.",
    bullets: ["Detección de patrones y términos sensibles", "Resumen ejecutivo por caso", "Priorización por impacto y urgencia"],
    Panel: PanelClasifica,
  },
  {
    kicker: "Backoffice colaborativo",
    title: "Compliance, legal y RR. HH. en el mismo expediente",
    body: "Tableros por estado, asignaciones y seguimiento compartido, con conversación confidencial con quien reporta.",
    bullets: ["Flujos por etapa y responsable", "Notas internas y evidencias centralizadas", "Bitácora auditable"],
    Panel: PanelInvestiga,
  },
  {
    kicker: "Operación multidioma",
    title: "El idioma deja de ser una barrera",
    body: "Experiencia localizada para denunciantes e investigadores en operaciones distribuidas entre países.",
    bullets: ["Interfaz y formularios localizados", "Comunicación bidireccional traducida", "Soporte para equipos multisede"],
    Panel: PanelMultilang,
  },
  {
    kicker: "Reportes",
    title: "Evidencia para el comité, en un clic",
    body: "Indicadores de tiempos de cierre, tipologías y cumplimiento de SLA, listos para comité, auditoría y reguladores.",
    bullets: ["Tableros en tiempo real", "Alertas de vencimiento", "Exportación a PDF"],
    Panel: PanelReporta,
  },
];

export const PlatformPage = () => {
  const demo = useDemoCta();

  return (
    <>
      <PageHero
        index="EV"
        kicker="Plataforma"
        title={[
          "Todo el ciclo de una denuncia,",
          <>
            en un solo <Voice>lugar.</Voice>
          </>,
        ]}
        lead="Recepción, investigación, analítica e IA para convertir el cumplimiento en una operación medible y trazable."
        actions={
          <>
            <Button variant="signal" size="lg" arrow onClick={demo("platform_hero_demo", "platform_hero")}>
              Agendar demo de plataforma
            </Button>
            <ButtonLink href="/pricing" variant="outline" size="lg">
              Ver planes
            </ButtonLink>
          </>
        }
      />

      <section className="bg-ev-paper pb-24 sm:pb-32">
        <Container>
          <div {...reveal(100)}>
            <BrowserFrame>
              <Image
                src="/platform/preview-1.jpg"
                alt="Panel de control de EthicVoice con reportes por estado y tendencias"
                width={2340}
                height={1368}
                className="h-auto w-full"
                priority
              />
            </BrowserFrame>
          </div>
        </Container>
      </section>

      <Section
        index="01"
        kicker="Capacidades clave"
        title={["La operación que necesita", <>un equipo de cumplimiento <Voice>moderno.</Voice></>]}
      >
        <IndexList items={PILLARS} columns={3} />
      </Section>

      <Section surface="paper" index="02" kicker="Módulos" title={["Un módulo para cada", <>momento del <Voice>caso.</Voice></>]}>
        <div className="space-y-24 sm:space-y-32">
          {MODULES.map((m, i) => (
            <article key={m.title} className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
              <div className={`lg:col-span-5 ${i % 2 ? "lg:order-2 lg:col-start-8" : ""}`}>
                <p className="ev-label text-ev-moss">
                  {String(i + 1).padStart(2, "0")} · {m.kicker}
                </p>
                <h3 {...reveal(0)} className="mt-5 text-[clamp(2rem,3.4vw,3rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ev-night">
                  {m.title}
                </h3>
                <p className="ev-lead mt-5">{m.body}</p>
                <ul className="mt-8 border-t border-ev-line">
                  {m.bullets.map((b) => (
                    <li key={b} className="border-b border-ev-line py-3 text-[0.975rem] text-ev-ink">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div {...reveal(120)} className={`lg:col-span-6 ${i % 2 ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"}`}>
                <m.Panel />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        surface="night"
        index="03"
        kicker="Gobierno y confianza"
        title={["Seguridad y control para", <>contextos <em className="ev-serif pr-[0.06em] text-ev-signal">regulados.</em></>]}
        intro="Arquitectura pensada para compliance, legal y auditoría."
      >
        <IndexList
          dark
          columns={2}
          items={[
            { title: "Bitácora integral de eventos y acciones por caso" },
            { title: "Permisos granulares por rol, área y sensibilidad" },
            { title: "Tiempos de respuesta y SLA con seguimiento continuo" },
            { title: "Evidencias y comunicación centralizadas por expediente" },
          ]}
        />
      </Section>
    </>
  );
};
