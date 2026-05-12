"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { StickyCalendlyToast } from "@/modules/landig-page/components/StickyCalendlyToast";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { trackGA4Event } from "@/lib/google-analytics";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import {
  useLandingVariant,
  useLandingViewEvent,
  useUtmCapture,
  type LandingVariant,
} from "@/modules/landig-page/lib/landingConversion";
import {
  LandingNav,
  scrollToId,
} from "@/modules/landig-page/components/LandingNavBar";
import { FooterDemoCtaBand } from "@/modules/landig-page/components/FooterDemoCtaBand";
import { LandingMinimalFooter } from "@/modules/landig-page/components/LandingMinimalFooter";

const HERO_BG_HLS_SRC =
  "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const BRANDS = [
  { name: "LaBrutal", src: "/ethic-brands/la_brutal.png" },
  { name: "Progress Consulting Group", src: "/ethic-brands/progress.png" },
  { name: "Valor Estratégico", src: "/ethic-brands/valor_estrategico.webp" },
  { name: "Norvik Tech", src: "/ethic-brands/norvik_logo.webp" },
  { name: "Universal Emerald", src: "/ethic-brands/universal_emerald.png" },
] as const;

const STATS = [
  { value: "24/7", label: "Canal disponible siempre" },
  { value: "+100", label: "Organizaciones confían" },
  { value: "4.9", label: "Satisfacción de clientes" },
] as const;

const FEATURES = [
  {
    icon: "icon-[lucide--file-warning]",
    title: "Recepción multicanal",
    desc: "Web 24/7, formularios configurables y registro centralizado por tipología y severidad.",
    color: "lime",
  },
  {
    icon: "icon-[lucide--users-round]",
    title: "Backoffice de investigaciones",
    desc: "Asignación por roles, tareas, comentarios, evidencias y línea de tiempo del caso.",
    color: "emerald",
  },
  {
    icon: "icon-[lucide--badge-check]",
    title: "Seguimiento de cumplimiento",
    desc: "Estados, hitos y respuestas para que cada caso avance sin perder gobernanza.",
    color: "lime",
  },
  {
    icon: "icon-[lucide--bar-chart-3]",
    title: "Reportes ejecutivos",
    desc: "Métricas por área, tiempo de cierre, tendencias y visión para comité de ética.",
    color: "emerald",
  },
  {
    icon: "icon-[lucide--languages]",
    title: "Soporte multiidioma",
    desc: "Adaptación del canal según contexto organizacional y diversidad de equipos.",
    color: "lime",
  },
  {
    icon: "icon-[lucide--graduation-cap]",
    title: "Onboarding y adopción",
    desc: "Acompañamiento de implementación, lanzamiento interno y buenas prácticas.",
    color: "emerald",
  },
] as const;

const STEPS = [
  {
    num: "01",
    icon: "icon-[lucide--send]",
    title: "Recibe reportes de forma segura",
    desc: "El denunciante envía información y evidencia sin exponer su identidad cuando aplica.",
    outcome: "Registro estructurado e inmediato.",
  },
  {
    num: "02",
    icon: "icon-[lucide--list-checks]",
    title: "Prioriza y asigna investigación",
    desc: "Clasificación por riesgo, asignación a responsables y plan de acción con fechas.",
    outcome: "Equipo investigador activado rápido.",
  },
  {
    num: "03",
    icon: "icon-[lucide--messages-square]",
    title: "Da seguimiento y solicita contexto",
    desc: "Comunicación bidireccional para completar información y sostener trazabilidad.",
    outcome: "Caso rico en evidencia y contexto.",
  },
  {
    num: "04",
    icon: "icon-[lucide--check-check]",
    title: "Cierra con evidencia y aprendizajes",
    desc: "Documentación final, decisiones, lecciones y reportes para prevención futura.",
    outcome: "Auditoría y mejora continua.",
  },
] as const;

const SECURITY_FEATURES = [
  {
    icon: "icon-[lucide--user-x]",
    title: "Anonimato real",
    desc: "El canal puede configurarse para que el denunciante nunca revele su identidad.",
  },
  {
    icon: "icon-[lucide--key-round]",
    title: "Permisos por rol",
    desc: "Accesos segmentados para el equipo investigador, comité y administración.",
  },
  {
    icon: "icon-[lucide--history]",
    title: "Historial de actividad",
    desc: "Registro completo de todas las acciones del caso para auditoría interna.",
  },
  {
    icon: "icon-[lucide--message-circle-heart]",
    title: "Canal bidireccional seguro",
    desc: "Comunicación con el denunciante sin comprometer su identidad en ningún paso.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "La implementación fue rápida y el comité ganó visibilidad real del estado de cada caso.",
    author: "Gerencia de Cumplimiento",
    company: "Empresa de servicios regional",
    initials: "GC",
  },
  {
    quote:
      "Pasamos de correos sueltos a un proceso auditable con seguimiento claro y menos fricción.",
    author: "Dirección de Auditoría Interna",
    company: "Grupo corporativo",
    initials: "DA",
  },
  {
    quote:
      "La comunicación confidencial con denunciantes mejoró la calidad de las investigaciones.",
    author: "Responsable de Ética",
    company: "Compañía multisitio",
    initials: "RE",
  },
] as const;

const FAQS = [
  {
    q: "¿Quién está obligado a implementar un canal de denuncias?",
    a: "Depende de la legislación aplicable por país, tamaño y sector. EthicVoice facilita la implementación operativa, pero cada organización debe validar su obligación legal con su equipo jurídico.",
  },
  {
    q: "¿Se puede reportar de forma anónima?",
    a: "Sí. El canal puede configurarse para permitir anonimato y también reportes confidenciales, según tu política interna.",
  },
  {
    q: "¿Cuánto tarda la implementación?",
    a: "La configuración inicial suele completarse en días, y el despliegue completo depende de aprobaciones internas, políticas y capacitación del equipo.",
  },
  {
    q: "¿Puedo conversar con la persona denunciante sin revelar su identidad?",
    a: "Sí. El flujo contempla comunicación bidireccional dentro del caso para pedir contexto adicional y dar seguimiento.",
  },
  {
    q: "¿Incluye analítica para comité o compliance?",
    a: "Sí. Puedes revisar estado de casos, tiempos de atención, tipologías y tendencias para tomar decisiones con evidencia.",
  },
] as const;

const PLAN_ORDER = [PlanType.STARTER, PlanType.GROW, PlanType.GROW_PRO] as const;

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

function HeroSection({ variant }: { variant: LandingVariant }) {
  const { openCalendly } = useCalendlyGate();
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  const headlineLines =
    variant === "trust"
      ? (["CUMPLIMIENTO PROACTIVO,", "CULTURA ÉTICA REAL"] as const)
      : (["GESTIONA DENUNCIAS", "ACTÚA CON INTEGRIDAD"] as const);

  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video) return;
    let cancelled = false;
    let hlsInstance: { destroy: () => void } | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HERO_BG_HLS_SRC;
      void video.play().catch(() => {});
      return () => {
        video.pause();
      };
    }

    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !bgVideoRef.current || !Hls.isSupported()) return;
      const hls = new Hls({ enableWorker: false });
      hlsInstance = hls;
      hls.loadSource(HERO_BG_HLS_SRC);
      hls.attachMedia(bgVideoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!cancelled) void bgVideoRef.current?.play().catch(() => {});
      });
    });

    return () => {
      cancelled = true;
      hlsInstance?.destroy();
      if (video) video.pause();
    };
  }, []);

  return (
    <section className="relative min-h-min overflow-hidden bg-[#051a24] sm:min-h-screen">
      {/* Background video */}
      <video
        ref={bgVideoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.6, filter: "brightness(0.65) saturate(0.8)" }}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      />

      {/* Left gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(7,11,10,0.92) 0%, rgba(7,11,10,0.55) 50%, rgba(7,11,10,0.10) 100%)",
        }}
        aria-hidden
      />

      {/* Bottom gradient overlay */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4"
        style={{
          background:
            "linear-gradient(to top, rgba(5,26,36,0.97) 0%, rgba(5,26,36,0.5) 40%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Vertical grid lines — desktop only */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        {[25, 50, 75].map((left) => (
          <div
            key={left}
            className="absolute bottom-0 top-0 w-px"
            style={{
              left: `${left}%`,
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.07)",
            }}
          />
        ))}
      </div>

      {/* Central glow SVG ellipse */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-[1] w-[min(140%,1100px)] -translate-x-1/2"
        aria-hidden
      >
        <svg
          viewBox="0 0 1100 200"
          className="w-full"
          style={{ filter: "blur(25px)" }}
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="heroGlowV3" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="rgba(94,210,156,0.32)" />
              <stop offset="45%" stopColor="rgba(45,212,191,0.16)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="550" cy="80" rx="480" ry="120" fill="url(#heroGlowV3)" />
        </svg>
      </div>

      {/* Content — desktop: bloque centrado en altura; móvil: flujo natural + scroll pegado a badges */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl min-h-0 flex-col items-center px-5 pb-16 pt-28 max-sm:pb-[max(4.25rem,env(safe-area-inset-bottom,0px))] sm:min-h-[100dvh] sm:min-h-screen sm:justify-center sm:px-6 sm:pb-24 sm:pt-32 md:pb-20 lg:px-8">
        <div className="flex w-full flex-col items-center text-center sm:flex-1 sm:justify-center">
          {/* Eyebrow */}
          <p className="mb-4 max-w-[min(100%,26rem)] text-pretty text-[11px] font-bold uppercase leading-snug tracking-[0.2em] text-lime-400 sm:mb-5 sm:text-xs sm:tracking-[0.22em] md:mb-6 md:text-[0.8125rem]">
            Plataforma de Línea Ética · LATAM
          </p>

          {/* H1 — fluid type + líneas cortas en desktop */}
          <h1 className="mx-auto w-full max-w-[min(100%,20rem)] text-balance px-0 text-[clamp(1.75rem,5.5vw+0.35rem,2.65rem)] font-extrabold uppercase leading-[1.08] tracking-[-0.02em] text-white min-[400px]:max-w-[min(100%,24rem)] sm:max-w-4xl sm:text-[clamp(2.35rem,4.2vw+0.75rem,3.45rem)] sm:leading-[1.05] sm:tracking-[-0.025em] md:text-[clamp(2.85rem,3.8vw+1.1rem,4.1rem)] md:leading-[1.02] lg:max-w-5xl lg:text-[clamp(3.15rem,3.2vw+1.35rem,4.65rem)] lg:leading-[0.98] lg:tracking-[-0.03em]">
            {headlineLines.map((line, idx) => {
              const isLast = idx === headlineLines.length - 1;
              const firstLineSingleRowDesktop =
                variant !== "trust" && idx === 0 ? "md:whitespace-nowrap" : "";
              return (
                <span key={line} className={`block ${firstLineSingleRowDesktop}`}>
                  {line}
                  {isLast ? <span className="text-lime-400">.</span> : null}
                </span>
              );
            })}
          </h1>

          <p className="mx-auto mt-5 max-w-[min(100%,32rem)] text-pretty text-sm font-normal leading-relaxed text-white/60 sm:mt-7 sm:max-w-xl sm:text-base sm:leading-[1.65] md:mt-8 md:max-w-2xl md:text-lg md:leading-[1.7]">
            Cumplimiento proactivo sin fricciones. Tu equipo de compliance al centro
            con datos claros y decisiones más rápidas.
          </p>

          {/* CTAs — full width on phone; horizontal from sm; allow wrap on md if needed */}
          <div className="mt-8 flex w-full max-w-xl flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 sm:gap-y-3 md:mt-12">
            <button
              type="button"
              onClick={(e) => {
                trackGA4Event("landing_cta_click", { cta_name: "hero_demo", placement: "hero" });
                openCalendly(e);
              }}
              className="inline-flex w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] transition hover:opacity-90 sm:w-auto sm:px-8 sm:text-sm sm:tracking-wide md:px-9 md:py-4 md:text-[0.9375rem]"
              style={{ background: "#a3e635", color: "#070b0a" }}
            >
              Agendar demo
              <i className="icon-[lucide--arrow-right] h-4 w-4 shrink-0 sm:h-[1.05rem] sm:w-[1.05rem]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollToId("#como-funciona")}
              className="inline-flex w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold leading-snug text-white transition hover:bg-white/[0.10] sm:w-auto sm:px-8 sm:text-[0.9375rem] md:px-9 md:py-4 md:text-base"
            >
              Ver cómo funciona
            </button>
            <Link
              href="/submit"
              onClick={() =>
                trackGA4Event("landing_cta_click", { cta_name: "hero_report", placement: "hero" })
              }
              className="inline-flex w-full min-w-0 shrink-0 items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold leading-snug transition hover:border-white/30 sm:w-auto sm:px-8 sm:text-[0.9375rem] md:px-9 md:py-4 md:text-base"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              Denunciar ahora
            </Link>
          </div>

          {/* Social proof badges */}
          <div className="mt-7 flex w-full max-w-md flex-wrap items-center justify-center gap-2 sm:mt-9 sm:max-w-none sm:gap-3 md:mt-10">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 sm:px-3.5 md:py-2">
              <i
                className="icon-[lucide--shield-check] h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                style={{ color: "#a3e635" }}
                aria-hidden
              />
              <span className="text-pretty text-[11px] font-medium leading-tight text-white/65 sm:text-xs md:text-[13px]">
                Anonimato garantizado
              </span>
            </div>
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 sm:px-3.5 md:py-2">
              <i
                className="icon-[lucide--zap] h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                style={{ color: "#a3e635" }}
                aria-hidden
              />
              <span className="text-pretty text-[11px] font-medium leading-tight text-white/65 sm:text-xs md:text-[13px]">
                Implementación en días
              </span>
            </div>
          </div>
        </div>

        {/* Scroll cue — móvil: en flujo bajo badges; sm+: fijo abajo del hero */}
        <div className="mt-5 flex w-full flex-col items-center gap-1 opacity-40 sm:absolute sm:inset-x-0 sm:bottom-10 sm:mt-0 sm:opacity-35 md:bottom-8">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70 sm:text-[11px] md:text-xs">
            Scroll
          </span>
          <i className="icon-[lucide--chevrons-down] h-4 w-4 animate-bounce text-white sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="relative z-[1] -mt-2 scroll-mt-24 bg-[#061f17] sm:mt-0">
      <div className="mx-auto max-w-5xl px-5 pt-2 pb-8 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-1 divide-y divide-white/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-5 text-center first:pt-0 last:pb-0 sm:px-6 sm:py-6 md:px-8">
              <div className="text-3xl font-black tabular-nums text-lime-400 sm:text-4xl md:text-5xl">
                {stat.value}
              </div>
              <div className="mx-auto mt-1.5 max-w-[16rem] text-pretty text-[10px] font-medium uppercase tracking-widest text-white/40 sm:max-w-none sm:text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoProofSection() {
  return (
    <section className="scroll-mt-24 border-b border-slate-100 bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:mb-8">
          Equipos que ya confían en EthicVoice
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-8 sm:gap-x-12 sm:gap-y-10 md:gap-x-16">
          {BRANDS.map((brand) => (
            <div
              key={brand.name}
              className="opacity-45 grayscale transition-all duration-300 hover:opacity-70 hover:grayscale-0"
            >
              <Image
                src={brand.src}
                alt={brand.name}
                width={120}
                height={36}
                className="h-6 w-auto max-w-[100px] object-contain sm:h-8 sm:max-w-[120px]"
                sizes="120px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="scroll-mt-24 bg-slate-50 py-16 sm:py-20 md:py-24" id="solucion">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 grid gap-6 sm:mb-12 md:mb-14 lg:grid-cols-2 lg:items-end lg:gap-10">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-700">
              Plataforma completa
            </p>
            <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0d212c] sm:text-4xl md:text-5xl">
              Todo lo que necesita
              <br />
              tu canal ético
            </h2>
          </div>
          <div>
            <p className="text-base leading-relaxed text-slate-500 sm:text-lg">
              Recepción, investigación, seguimiento y analítica en un flujo continuo
              para que tu equipo de compliance opere sin fricciones.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              {["Confidencialidad y anonimato real", "SLA y vencimientos legales", "Tableros gerenciales"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-lime-200 bg-lime-50 px-3 py-1.5 text-left text-xs font-medium text-lime-800"
                  >
                    <i className="icon-[lucide--check] h-3 w-3" aria-hidden />
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        {/* 6 feature cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => {
            const isLime = feat.color === "lime";
            return (
              <article
                key={feat.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-lime-200 hover:shadow-xl sm:p-6"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${
                    isLime ? "bg-lime-50" : "bg-emerald-50"
                  }`}
                >
                  <i
                    className={`${feat.icon} h-5 w-5 ${isLime ? "text-lime-700" : "text-emerald-700"}`}
                    aria-hidden
                  />
                </div>
                <h3 className="mb-2 text-base font-bold text-[#0d212c]">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{feat.desc}</p>
              </article>
            );
          })}
        </div>

        {/* KPI strip — stack on very narrow screens */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Canal activo", value: "24/7" },
            { label: "Modelo de operación", value: "Multicanal" },
            { label: "Enfoque", value: "Cumplimiento + Cultura" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {kpi.label}
              </p>
              <p className="mt-1 text-sm font-extrabold text-[#0d212c] sm:text-base">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-24" id="como-funciona">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-700">
            Cómo funciona
          </p>
          <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0d212c] sm:text-4xl md:text-5xl">
            De denuncia a cierre
            <br />
            en 4 pasos claros
          </h2>
          <p className="mx-auto mt-4 max-w-lg px-1 text-base leading-relaxed text-slate-500 sm:text-lg">
            Proceso estructurado para que ningún caso se pierda y todo quede documentado.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {STEPS.map((step, idx) => (
            <article
              key={step.title}
              className="group relative flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-lime-200 hover:shadow-xl sm:p-6"
            >
              {/* Connector dot — desktop only, except last */}
              {idx < STEPS.length - 1 && (
                <div
                  className="absolute right-0 top-10 hidden h-px w-5 translate-x-full bg-gradient-to-r from-lime-300/70 to-transparent lg:block"
                  aria-hidden
                />
              )}

              {/* Big faded number */}
              <div
                className="absolute right-4 top-3 select-none text-5xl font-black text-slate-100 transition-colors group-hover:text-lime-100"
                aria-hidden
              >
                {step.num}
              </div>

              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#051a24]">
                <i className={`${step.icon} h-5 w-5 text-lime-400`} aria-hidden />
              </div>

              <h3 className="mb-2 text-sm font-bold leading-snug text-[#0d212c] sm:text-base">
                {step.title}
              </h3>
              <p className="flex-1 text-xs leading-relaxed text-slate-500">{step.desc}</p>

              <div className="mt-4 rounded-xl bg-lime-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-lime-800">
                  <i className="icon-[lucide--circle-check] mr-1 inline h-3.5 w-3.5 text-lime-600" aria-hidden />
                  {step.outcome}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section className="scroll-mt-24 relative overflow-hidden bg-[#051a24] py-16 sm:py-20 md:py-24" id="seguridad">
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      {/* Right glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] opacity-20 blur-[100px]"
        style={{ background: "rgba(163,230,53,0.4)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          {/* Left text */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-400">
              Seguridad y privacidad
            </p>
            <h2 className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
              Canal seguro,
              <br />
              anónimo y auditable.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
              Estructura orientada a confidencialidad, gobernanza y comunicación
              segura entre todas las partes involucradas.
            </p>

            {/* Compliance badge */}
            <div className="mt-6 inline-flex max-w-full flex-wrap items-center gap-2.5 rounded-full border border-lime-400/25 bg-lime-400/[0.08] px-4 py-2.5 sm:mt-8 sm:px-5">
              <i className="icon-[lucide--shield-check] h-5 w-5 shrink-0 text-lime-400" aria-hidden />
              <span className="text-left text-sm font-semibold text-lime-300">
                Seguridad orientada a compliance
              </span>
            </div>

            {/* Metrics */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3">
              {[
                { label: "Acceso", value: "Por roles" },
                { label: "Visibilidad", value: "Trazable" },
                { label: "Canal", value: "Bidireccional" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3.5 text-center sm:px-4"
                >
                  <p className="text-pretty text-[10px] font-bold uppercase tracking-widest text-white/35">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-white sm:text-base">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right cards grid */}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {SECURITY_FEATURES.map((feat) => (
              <article
                key={feat.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.07] sm:p-5"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/[0.12]">
                  <i className={`${feat.icon} h-5 w-5 text-lime-400`} aria-hidden />
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-white">{feat.title}</h3>
                <p className="text-xs leading-relaxed text-white/50">{feat.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="scroll-mt-24 bg-[#0a1e14] py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-400">
            Testimonios
          </p>
          <h2 className="text-balance text-3xl font-extrabold text-white sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Featured testimonial */}
          <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#051a24] to-[#0d2d1e] p-6 ring-1 ring-lime-400/20 sm:p-8 md:p-10 lg:col-span-7">
            <div
              className="pointer-events-none absolute right-0 top-0 h-48 w-48 opacity-15 blur-3xl"
              style={{ background: "rgba(163,230,53,0.6)" }}
              aria-hidden
            />
            <div className="relative z-10">
              <div className="mb-6 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className="icon-[lucide--star] h-5 w-5 fill-current text-lime-400" aria-hidden />
                ))}
              </div>
              <blockquote className="text-pretty text-lg font-semibold leading-snug text-white sm:text-xl md:text-2xl lg:text-3xl">
                "{TESTIMONIALS[0].quote}"
              </blockquote>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime-400 text-sm font-black text-[#051a24]">
                  {TESTIMONIALS[0].initials}
                </div>
                <div>
                  <p className="font-bold text-white">{TESTIMONIALS[0].author}</p>
                  <p className="text-sm text-white/45">{TESTIMONIALS[0].company}</p>
                </div>
              </div>
            </div>
          </article>

          {/* Smaller testimonials */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            {TESTIMONIALS.slice(1).map((t) => (
              <article
                key={t.quote}
                className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i key={i} className="icon-[lucide--star] h-3.5 w-3.5 fill-current text-lime-400" aria-hidden />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-white/75">
                  "{t.quote}"
                </blockquote>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold text-white/60">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.author}</p>
                    <p className="text-xs text-white/35">{t.company}</p>
                  </div>
                </div>
              </article>
            ))}

            {/* Summary card */}
            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.06] px-4 py-4 sm:px-5">
              <div className="grid grid-cols-1 gap-4 text-center min-[380px]:grid-cols-3 min-[380px]:gap-2 sm:gap-3">
                {[
                  { label: "Implementación", value: "Rápida" },
                  { label: "Control", value: "+Visibilidad" },
                  { label: "Resultado", value: "Trazable" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-lime-300">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { openCalendly } = useCalendlyGate();
  const enterprise = PLAN_CONFIGS[PlanType.PREMIUM];

  return (
    <section className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-24" id="planes">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12 md:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-700">
            Planes y precios
          </p>
          <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0d212c] sm:text-4xl md:text-5xl">
            Precios para cada
            <br />
            etapa de tu empresa
          </h2>
          <p className="mx-auto mt-4 max-w-lg px-1 text-base leading-relaxed text-slate-500 sm:text-lg">
            Desde startups hasta grandes corporaciones con múltiples sedes.
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-5">
          {PLAN_ORDER.map((planType) => {
            const plan = PLAN_CONFIGS[planType];
            const isPopular = !!plan.isPopular;
            const employees =
              plan.features.maxEmployees === -1
                ? "Colaboradores ilimitados"
                : `Hasta ${plan.features.maxEmployees} colaboradores`;

            return (
              <article
                key={planType}
                className={`relative flex min-h-0 flex-col rounded-2xl p-5 transition-all duration-300 sm:p-7 ${
                  isPopular
                    ? "bg-[#051a24] shadow-[0_24px_60px_rgba(5,26,36,0.35)] ring-2 ring-lime-400"
                    : "border border-slate-200 bg-white hover:border-lime-200 hover:shadow-xl"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-lime-400 px-4 py-1 text-[11px] font-black uppercase tracking-wide text-[#051a24]">
                      Más popular
                    </span>
                  </div>
                )}

                <h3
                  className={`text-xl font-extrabold ${isPopular ? "text-white" : "text-[#0d212c]"}`}
                >
                  {plan.displayName}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${isPopular ? "text-white/55" : "text-slate-500"}`}
                >
                  {plan.description}
                </p>

                <div
                  className={`mt-6 rounded-xl p-4 ${
                    isPopular
                      ? "bg-white/[0.08] ring-1 ring-white/10"
                      : "border border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-black ${isPopular ? "text-white" : "text-[#0d212c]"}`}
                    >
                      ${plan.price.monthly}
                    </span>
                    <span
                      className={`text-sm font-medium ${isPopular ? "text-white/50" : "text-slate-400"}`}
                    >
                      USD / mes
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs ${isPopular ? "text-white/40" : "text-slate-400"}`}
                  >
                    {employees}
                  </p>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.highlights.slice(0, 5).map((item) => (
                    <li
                      key={`${planType}-${item}`}
                      className={`flex items-start gap-2 text-sm ${
                        isPopular ? "text-white/75" : "text-slate-600"
                      }`}
                    >
                      <i
                        className={`icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 ${
                          isPopular ? "text-lime-400" : "text-lime-600"
                        }`}
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={(e) => {
                    trackGA4Event("landing_cta_click", {
                      cta_name: `pricing_${planType.toLowerCase()}`,
                      placement: "pricing",
                    });
                    openCalendly(e);
                  }}
                  className={`mt-8 w-full rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 ${
                    isPopular
                      ? "bg-lime-400 text-[#051a24] hover:bg-lime-300"
                      : "border-2 border-[#051a24] text-[#051a24] hover:bg-[#051a24] hover:text-white"
                  }`}
                >
                  Comenzar ahora
                </button>
              </article>
            );
          })}
        </div>

        {/* Enterprise card */}
        <article className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#051a24] via-[#0a1e14] to-[#0d212c] p-6 sm:mt-5 sm:p-8 md:p-10">
          <div
            className="pointer-events-none absolute right-0 top-0 h-64 w-64 opacity-20 blur-[80px]"
            style={{ background: "rgba(163,230,53,0.5)" }}
            aria-hidden
          />
          <div className="relative grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-8">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-lime-300 sm:px-4 sm:text-[11px]">
                Plan empresarial
              </span>
              <h3 className="mt-3 text-2xl font-extrabold text-white sm:mt-4 sm:text-3xl">{enterprise.displayName}</h3>
              <p className="mt-3 leading-relaxed text-white/60">{enterprise.description}</p>
              <div className="mt-5 inline-block rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Precio</p>
                <p className="mt-0.5 text-2xl font-black text-white">Bajo consulta</p>
                <p className="text-xs text-white/40">Implementación según alcance</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    trackGA4Event("landing_cta_click", {
                      cta_name: "pricing_enterprise",
                      placement: "pricing",
                    });
                    openCalendly(e);
                  }}
                  className="mt-6 rounded-xl bg-lime-400 px-8 py-3.5 text-sm font-bold text-[#051a24] transition hover:bg-lime-300"
                >
                  Hablar con un consultor
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {enterprise.features.highlights.slice(0, 6).map((feature) => (
                <div
                  key={feature}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <i className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-lime-400" aria-hidden />
                  <p className="text-sm leading-snug text-white/75">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <p className="mt-5 text-center text-xs text-slate-400">
          * Precios en USD. La configuración final depende del alcance de implementación.
        </p>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="scroll-mt-24 bg-slate-50 py-16 sm:py-20 md:py-24" id="faq">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-700">FAQ</p>
          <h2 className="text-balance text-3xl font-extrabold text-[#0d212c] sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="mx-auto mt-3 max-w-md px-1 text-base text-slate-500">
            Todo lo que necesitas saber antes de implementar tu canal ético.
          </p>
        </div>
        <div className="space-y-3">
          {FAQS.map((item) => (
            <details key={item.q} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left text-sm font-bold leading-snug text-[#0d212c] transition-colors hover:bg-slate-50 sm:gap-4 sm:px-6 sm:py-5 sm:text-base">
                {item.q}
                <i
                  className="icon-[lucide--plus] h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:hidden"
                  aria-hidden
                />
                <i
                  className="icon-[lucide--minus] hidden h-4 w-4 shrink-0 text-lime-600 group-open:block"
                  aria-hidden
                />
              </summary>
              <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4">
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function LandingV3() {
  const phone = process.env.NEXT_PUBLIC_WPP_NUMBER || "";
  const cookie = useCookieConsentOptional();
  const allowFunctional =
    cookie?.hydrated && !!cookie.consent?.functional && !cookie.needsInteraction;
  const variant = useLandingVariant();
  useUtmCapture();
  useLandingViewEvent(variant);

  return (
    <div className="min-h-screen">
      <Script
        id="ethicvoice-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      <LandingNav />

      {phone && allowFunctional && (
        <FloatingWhatsApp
          phoneNumber={phone}
          accountName="Ethic Voice"
          avatar="/brand/wpp_logo.png"
          chatMessage="Hola! ¿Cómo puedo ayudarte con tu canal de denuncias?"
          className="floating-whatsapp ev-floating-whatsapp"
        />
      )}

      <StickyCalendlyToast />

      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(4rem+env(safe-area-inset-top,0px))] sm:pb-12 sm:pt-[calc(4.5rem+env(safe-area-inset-top,0px))] md:pb-10">
        <HeroSection variant={variant} />
        <StatsBand />
        <LogoProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </main>

      <section className="border-t border-slate-200" aria-label="Siguiente paso">
        <FooterDemoCtaBand ctaName="closing_demo" placement="closing" />
      </section>
      <LandingMinimalFooter />
    </div>
  );
}
