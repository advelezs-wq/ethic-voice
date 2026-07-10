"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { StickyCalendlyToast } from "@/modules/landig-page/components/StickyCalendlyToast";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { trackGA4Event } from "@/lib/google-analytics";
import {
  BillingCycle,
  PLAN_CONFIGS,
  PlanType,
} from "@/types/subscription.types";
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
import { VideoModal } from "@/modules/landig-page/components/VideoModal";
import { motion, useReducedMotion, type Variants } from "framer-motion";

const HERO_BG_VIDEO_SRC = "/video_1778585500522.mp4";
/** Qué fracción del alto del hero recorre el scroll para pasar de escala 1 → máxima */
const HERO_BG_SCROLL_ZOOM_RANGE = 0.48;
/** Escala máxima = 1 + este valor (zoom-in al bajar; zoom-out al subir, misma curva) */
const HERO_BG_SCROLL_ZOOM_EXTRA = 0.14;

const DEMO_PRODUCT_VIDEO_SRC = "/demo-video.mp4";
const DEMO_PRODUCT_VIDEO_POSTER = "/platform/ethicvoice-hero-frame.jpg";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const BRANDS = [
  { name: "LaBrutal", src: "/ethic-brands/la_brutal.png" },
  { name: "Progress Consulting Group", src: "/ethic-brands/progress.png" },
  { name: "Valor Estratégico", src: "/ethic-brands/valor_estrategico.webp" },
  { name: "Norvik Tech", src: "/ethic-brands/norvik_logo.webp" },
  { name: "Universal Emerald", src: "/ethic-brands/universal_emerald.png" },
] as const;

type StatTickerSpec =
  | { kind: "24_7" }
  | { kind: "plusInt"; max: number }
  | { kind: "decimal"; max: number; decimals: number };

const STATS_BAND: ReadonlyArray<{ label: string; ticker: StatTickerSpec }> = [
  { label: "Canal disponible siempre", ticker: { kind: "24_7" } },
  { label: "Organizaciones confían", ticker: { kind: "plusInt", max: 100 } },
  {
    label: "Satisfacción de clientes",
    ticker: { kind: "decimal", max: 4.9, decimals: 1 },
  },
];

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function formatStatTicker(spec: StatTickerSpec, linear01: number) {
  const p = easeOutCubic(Math.min(1, Math.max(0, linear01)));
  switch (spec.kind) {
    case "24_7":
      return `${Math.round(24 * p)}/${Math.round(7 * p)}`;
    case "plusInt":
      return `+${Math.round(spec.max * p)}`;
    case "decimal":
      return (spec.max * p).toFixed(spec.decimals);
    default:
      return "";
  }
}

function StatsTickerValue({
  spec,
  active,
  delayMs,
  reduceMotion,
}: {
  spec: StatTickerSpec;
  active: boolean;
  delayMs: number;
  reduceMotion: boolean;
}) {
  const [text, setText] = useState(() =>
    formatStatTicker(spec, reduceMotion ? 1 : 0),
  );

  useEffect(() => {
    if (reduceMotion) {
      setText(formatStatTicker(spec, active ? 1 : 0));
      return;
    }
    if (!active) return;

    const durationMs = 1150;
    const startWall = performance.now() + delayMs;
    let raf = 0;

    const tick = (now: number) => {
      if (now < startWall) {
        setText(formatStatTicker(spec, 0));
        raf = requestAnimationFrame(tick);
        return;
      }
      const linear = Math.min(1, (now - startWall) / durationMs);
      setText(formatStatTicker(spec, linear));
      if (linear < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setText(formatStatTicker(spec, 1));
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, delayMs, reduceMotion, spec]);

  return <span className="tabular-nums">{text}</span>;
}

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

export const FAQS = [
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
  {
    q: "¿Hay permanencia mínima o contratos forzosos?",
    a: "No. Los planes funcionan por suscripción y puedes cambiar de plan o cancelar la renovación desde tu panel de facturación en cualquier momento.",
  },
  {
    q: "¿Qué diferencia a EthicVoice de gestionar denuncias por correo interno?",
    a: "El correo no garantiza anonimato, trazabilidad ni tiempos de respuesta. EthicVoice centraliza cada caso con historial auditable, comunicación confidencial con el denunciante, alertas de vencimiento y reportes ejecutivos para el comité.",
  },
] as const;

const PAIN_POINTS = [
  {
    icon: "icon-[lucide--mail-x]",
    title: "Casos que se pierden",
    desc: "Correos sueltos y hojas de cálculo sin trazabilidad: denuncias sin respuesta, sin responsable asignado y sin evidencia del proceso.",
  },
  {
    icon: "icon-[lucide--eye-off]",
    title: "Colaboradores que callan",
    desc: "Sin anonimato garantizado, la mayoría prefiere no reportar. Los problemas se conocen cuando ya son una crisis.",
  },
  {
    icon: "icon-[lucide--scale]",
    title: "Riesgo legal y reputacional",
    desc: "Sanciones, litigios y daño de marca por no atender denuncias a tiempo ni poder demostrar debida diligencia.",
  },
] as const;

const COMPARISON_ROWS = [
  "Anonimato real garantizado",
  "Trazabilidad y auditoría completa de cada caso",
  "Comunicación bidireccional confidencial",
  "Alertas de vencimiento y control de SLA",
  "Reportes ejecutivos para el comité de ética",
] as const;

const PLAN_ORDER = [
  PlanType.STARTER,
  PlanType.GROW,
  PlanType.GROW_PRO,
] as const;

const LANDING_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const LANDING_STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.065, delayChildren: 0.08 },
  },
};

const LANDING_STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: LANDING_EASE },
  },
};

const LANDING_VIEWPORT = {
  once: true,
  amount: 0.14 as const,
  margin: "-56px 0px -12% 0px" as const,
};

function useInViewReveal(delay = 0) {
  const reduced = useReducedMotion();
  if (reduced === true) {
    return { initial: false as const };
  }
  return {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: LANDING_VIEWPORT,
    transition: { duration: 0.62, ease: LANDING_EASE, delay },
  };
}

function useHeroReveal() {
  const reduced = useReducedMotion();
  if (reduced === true) {
    return { initial: false as const };
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.72, ease: LANDING_EASE },
  };
}

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

function HeroSection({ variant }: { variant: LandingVariant }) {
  const { openCalendly } = useCalendlyGate();
  const heroSectionRef = useRef<HTMLElement>(null);
  const bgVideoZoomRef = useRef<HTMLDivElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  const headlineLines =
    variant === "trust"
      ? (["CUMPLIMIENTO PROACTIVO,", "CULTURA ÉTICA REAL"] as const)
      : (["GESTIONA DENUNCIAS", "ACTÚA CON INTEGRIDAD"] as const);

  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video) return;
    void video.play().catch(() => {});
    return () => {
      video.pause();
    };
  }, []);

  useEffect(() => {
    const section = heroSectionRef.current;
    const zoomWrap = bgVideoZoomRef.current;
    if (!section || !zoomWrap) return;

    let rafId = 0;
    let scheduled = false;

    const applyZoom = () => {
      scheduled = false;
      const rect = section.getBoundingClientRect();
      const h = Math.max(rect.height, 1);
      const scrolled = Math.max(0, -rect.top);
      const t = Math.min(1, scrolled / (h * HERO_BG_SCROLL_ZOOM_RANGE));
      const scale = 1 + t * HERO_BG_SCROLL_ZOOM_EXTRA;
      zoomWrap.style.transform = `scale(${scale})`;
    };

    const onScrollOrResize = () => {
      if (scheduled) return;
      scheduled = true;
      rafId = requestAnimationFrame(applyZoom);
    };

    applyZoom();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const heroReveal = useHeroReveal();

  return (
    <section
      ref={heroSectionRef}
      className="relative min-h-min overflow-hidden bg-[#0b1620] sm:min-h-screen"
    >
      {/* Background video — zoom según scroll (solo video; overlays fijos) */}
      <div
        ref={bgVideoZoomRef}
        className="pointer-events-none absolute inset-0 z-0 will-change-transform"
        style={{
          transformOrigin: "50% 42%",
          transform: "scale(1)",
        }}
      >
        <video
          ref={bgVideoRef}
          src={HERO_BG_VIDEO_SRC}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          style={{
            opacity: 0.52,
            filter:
              "brightness(0.52) contrast(1.08) saturate(0.72) hue-rotate(12deg)",
          }}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[#061f17]/50 mix-blend-multiply"
        aria-hidden
      />

      {/* Left gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(90deg, rgba(11,22,32,0.94) 0%, rgba(11,22,32,0.58) 50%, rgba(11,22,32,0.12) 100%)",
        }}
        aria-hidden
      />

      {/* Bottom gradient overlay */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-3/4"
        style={{
          background:
            "linear-gradient(to top, rgba(11,22,32,0.96) 0%, rgba(11,22,32,0.52) 42%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Vertical grid lines — desktop only */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] hidden md:block"
        aria-hidden
      >
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
        className="pointer-events-none absolute left-1/2 top-0 z-[3] w-[min(140%,1100px)] -translate-x-1/2"
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
              <stop offset="0%" stopColor="rgba(163,230,53,0.20)" />
              <stop offset="45%" stopColor="rgba(45,212,191,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="550" cy="80" rx="480" ry="120" fill="url(#heroGlowV3)" />
        </svg>
      </div>

      {/* Content — desktop: bloque centrado en altura; móvil: flujo natural + scroll pegado a badges */}
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-5xl min-h-0 flex-col items-center px-5 pb-16 pt-28 max-sm:pb-[max(4.25rem,env(safe-area-inset-bottom,0px))] sm:min-h-[100dvh] sm:min-h-screen sm:justify-center sm:px-6 sm:pb-24 sm:pt-32 md:pb-20 lg:px-8"
        {...heroReveal}
      >
        <div className="flex w-full flex-col items-center text-center sm:flex-1 sm:justify-center">
          {/* Eyebrow */}
          <p className="mb-4 max-w-[min(100%,26rem)] text-pretty text-[11px] font-bold uppercase leading-snug tracking-[0.2em] text-emerald-300/90 sm:mb-5 sm:text-xs sm:tracking-[0.22em] md:mb-6 md:text-[0.8125rem]">
            Plataforma de Línea Ética · LATAM
          </p>

          {/* H1 — fluid type + líneas cortas en desktop */}
          <h1 className="mx-auto w-full max-w-[min(100%,20rem)] text-balance px-0 text-[clamp(1.75rem,5.5vw+0.35rem,2.65rem)] font-extrabold uppercase leading-[1.08] tracking-[-0.02em] text-white min-[400px]:max-w-[min(100%,24rem)] sm:max-w-4xl sm:text-[clamp(2.35rem,4.2vw+0.75rem,3.45rem)] sm:leading-[1.05] sm:tracking-[-0.025em] md:text-[clamp(2.85rem,3.8vw+1.1rem,4.1rem)] md:leading-[1.02] lg:max-w-5xl lg:text-[clamp(3.15rem,3.2vw+1.35rem,4.65rem)] lg:leading-[0.98] lg:tracking-[-0.03em]">
            {headlineLines.map((line, idx) => {
              const isLast = idx === headlineLines.length - 1;
              const firstLineSingleRowDesktop =
                variant !== "trust" && idx === 0 ? "md:whitespace-nowrap" : "";
              return (
                <span
                  key={line}
                  className={`block ${firstLineSingleRowDesktop}`}
                >
                  {line}
                  {isLast ? <span className="text-emerald-300">.</span> : null}
                </span>
              );
            })}
          </h1>

          <p className="mx-auto mt-5 max-w-[min(100%,32rem)] text-pretty text-sm font-normal leading-relaxed text-white/60 sm:mt-7 sm:max-w-xl sm:text-base sm:leading-[1.65] md:mt-8 md:max-w-2xl md:text-lg md:leading-[1.7]">
            Canal de denuncias seguro, anónimo y auditable. Actívalo en días,
            centraliza cada caso y demuestra debida diligencia ante tu comité —
            sin fricción para tu equipo ni para quien denuncia.
          </p>

          {/* CTAs — full width on phone; horizontal from sm; allow wrap on md if needed */}
          <div className="mt-8 flex w-full max-w-xl flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 sm:gap-y-3 md:mt-12">
            <button
              type="button"
              onClick={(e) => {
                trackGA4Event("landing_cta_click", {
                  cta_name: "hero_demo",
                  placement: "hero",
                });
                openCalendly(e);
              }}
              className="inline-flex w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-full bg-lime-400 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#052b24] shadow-[0_8px_28px_rgba(163,230,53,0.38)] transition hover:bg-lime-300 sm:w-auto sm:px-8 sm:text-sm sm:tracking-wide md:px-9 md:py-4 md:text-[0.9375rem]"
            >
              Agendar demo gratis
              <i
                className="icon-[lucide--arrow-right] h-4 w-4 shrink-0 sm:h-[1.05rem] sm:w-[1.05rem]"
                aria-hidden
              />
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
                trackGA4Event("landing_cta_click", {
                  cta_name: "hero_report",
                  placement: "hero",
                })
              }
              className="inline-flex w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold leading-snug text-[#0b1620] shadow-[0_4px_14px_rgba(255,255,255,0.25)] transition hover:bg-emerald-50 sm:w-auto sm:px-8 sm:text-[0.9375rem] md:px-9 md:py-4 md:text-base"
            >
              <i
                className="icon-[lucide--megaphone] h-4 w-4 shrink-0 sm:h-[1.05rem] sm:w-[1.05rem]"
                aria-hidden
              />
              Denunciar ahora
            </Link>
          </div>

          {/* Microcopy de confianza — reduce fricción del CTA principal */}
          <p className="mt-4 text-pretty text-xs font-medium text-white/45 sm:text-[13px]">
            Demo de 30 minutos · Sin compromiso · Acompañamiento en español
          </p>

          {/* Seguimiento de denuncia existente — visible bajo los CTAs */}
          <Link
            href="/track"
            onClick={() =>
              trackGA4Event("landing_cta_click", {
                cta_name: "hero_track",
                placement: "hero",
              })
            }
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/70 hover:bg-emerald-300/20 sm:mt-6"
          >
            <i className="icon-[lucide--search] h-4 w-4 shrink-0" aria-hidden />
            ¿Ya denunciaste? Haz seguimiento con tu código
            <i
              className="icon-[lucide--arrow-right] h-4 w-4 shrink-0"
              aria-hidden
            />
          </Link>

          {/* Social proof badges */}
          <div className="mt-7 flex w-full max-w-md flex-wrap items-center justify-center gap-2 sm:mt-9 sm:max-w-none sm:gap-3 md:mt-10">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 sm:px-3.5 md:py-2">
              <i
                className="icon-[lucide--shield-check] h-3.5 w-3.5 shrink-0 text-lime-300 sm:h-4 sm:w-4"
                aria-hidden
              />
              <span className="text-pretty text-[11px] font-medium leading-tight text-white/65 sm:text-xs md:text-[13px]">
                Anonimato garantizado
              </span>
            </div>
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 sm:px-3.5 md:py-2">
              <i
                className="icon-[lucide--zap] h-3.5 w-3.5 shrink-0 text-lime-300 sm:h-4 sm:w-4"
                aria-hidden
              />
              <span className="text-pretty text-[11px] font-medium leading-tight text-white/65 sm:text-xs md:text-[13px]">
                Implementación en días
              </span>
            </div>
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 sm:px-3.5 md:py-2">
              <i
                className="icon-[lucide--lock-keyhole] h-3.5 w-3.5 shrink-0 text-lime-300 sm:h-4 sm:w-4"
                aria-hidden
              />
              <span className="text-pretty text-[11px] font-medium leading-tight text-white/65 sm:text-xs md:text-[13px]">
                Trazabilidad auditable
              </span>
            </div>
          </div>
        </div>

        {/* Scroll cue — móvil: en flujo bajo badges; sm+: fijo abajo del hero */}
        <div className="mt-5 flex w-full flex-col items-center gap-1 opacity-40 sm:absolute sm:inset-x-0 sm:bottom-10 sm:mt-0 sm:opacity-35 md:bottom-8">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70 sm:text-[11px] md:text-xs">
            Scroll
          </span>
          <i
            className="icon-[lucide--chevrons-down] h-4 w-4 animate-bounce text-white sm:h-[1.125rem] sm:w-[1.125rem]"
            aria-hidden
          />
        </div>
      </motion.div>
    </section>
  );
}

function HeroDemoVideoStrip() {
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="relative z-[1] scroll-mt-24 border-t border-white/[0.07] bg-[#0b1620]"
      aria-labelledby="hero-demo-video-heading"
      {...reveal}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto max-w-5xl px-5 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/90 sm:text-xs sm:tracking-[0.22em]">
            Recorrido en vídeo
          </p>
          <h2
            id="hero-demo-video-heading"
            className="text-balance text-lg font-bold leading-snug text-white sm:text-xl md:text-2xl"
          >
            Así se ve EthicVoice en el día a día de compliance
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-white/55 sm:mt-2.5 sm:text-[0.9375rem]">
            Mira cómo un caso entra, se investiga y se cierra dentro de la
            plataforma: el mismo panel que usará tu equipo desde el día uno.
          </p>
        </div>
        <VideoModal
          videoSrc={DEMO_PRODUCT_VIDEO_SRC}
          posterSrc={DEMO_PRODUCT_VIDEO_POSTER}
          className="mx-auto aspect-video h-auto min-h-[11.5rem] w-full max-w-3xl rounded-2xl shadow-[0_28px_90px_rgba(0,0,0,0.42)] ring-1 ring-inset ring-white/[0.09] sm:min-h-[13.5rem] md:max-w-4xl md:min-h-[15.5rem] lg:max-w-5xl lg:min-h-[17rem]"
        />
      </div>
    </motion.section>
  );
}

function StatsBand() {
  const statsRootRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = statsRootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStatsVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = useInViewReveal();

  return (
    <motion.section
      className="relative z-[1] scroll-mt-24 bg-[#0b1620] sm:mt-0"
      {...reveal}
    >
      <div
        ref={statsRootRef}
        className="mx-auto max-w-5xl px-5 pt-2 pb-8 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="grid grid-cols-1 divide-y divide-white/[0.08] sm:grid-cols-3 sm:items-stretch sm:divide-x sm:divide-y-0">
          {STATS_BAND.map((stat, index) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center px-4 py-5 text-center max-sm:first:pt-0 max-sm:last:pb-0 sm:min-h-[9.5rem] sm:px-6 sm:py-6 md:min-h-[10.5rem] md:px-8"
            >
              <div className="text-3xl font-black tabular-nums leading-none tracking-tight text-white sm:text-4xl md:text-5xl">
                <StatsTickerValue
                  spec={stat.ticker}
                  active={statsVisible}
                  delayMs={index * 95}
                  reduceMotion={reduceMotion}
                />
              </div>
              <div className="mx-auto mt-3 max-w-[16rem] text-pretty text-[10px] font-medium uppercase leading-snug tracking-widest text-white/40 sm:mt-3.5 sm:max-w-none sm:text-xs sm:leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function LogoProofSection() {
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="scroll-mt-24 border-b border-slate-100 bg-white py-10 sm:py-14"
      {...reveal}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:mb-8">
          Equipos que ya confían en EthicVoice
        </p>
        {reduced === true ? (
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
        ) : (
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-8 sm:gap-x-12 sm:gap-y-10 md:gap-x-16"
            initial="hidden"
            whileInView="visible"
            viewport={LANDING_VIEWPORT}
            variants={LANDING_STAGGER_CONTAINER}
          >
            {BRANDS.map((brand) => (
              <motion.div
                key={brand.name}
                variants={LANDING_STAGGER_ITEM}
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

export function PainComparisonSection() {
  const { openCalendly } = useCalendlyGate();
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-24"
      id="problema"
      {...reveal}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-rose-600">
            El costo de no actuar
          </p>
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0d212c] sm:text-4xl md:text-5xl">
            Gestionar denuncias por correo te está costando más de lo que crees
          </h2>
          <p className="mx-auto mt-4 max-w-xl px-1 text-base leading-relaxed text-slate-500 sm:text-lg">
            Cuando no existe un canal formal, los casos no desaparecen: se
            acumulan en silencio hasta convertirse en pérdidas.
          </p>
        </div>

        {/* Pain cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {PAIN_POINTS.map((pain) => (
            <article
              key={pain.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
                <i
                  className={`${pain.icon} h-5 w-5 text-rose-600`}
                  aria-hidden
                />
              </div>
              <h3 className="mb-2 text-base font-bold text-[#0d212c]">
                {pain.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {pain.desc}
              </p>
            </article>
          ))}
        </div>

        {/* Industry stats */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:w-auto">
              <span className="text-2xl font-black text-[#0d212c] sm:text-3xl">
                ~5%
              </span>
              <span className="text-pretty text-sm leading-snug text-slate-500">
                de los ingresos anuales se pierden por fraude en las
                organizaciones
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:w-auto">
              <span className="text-2xl font-black text-[#0d212c] sm:text-3xl">
                43%
              </span>
              <span className="text-pretty text-sm leading-snug text-slate-500">
                de los fraudes se detecta gracias a una denuncia interna
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Fuente: ACFE, Report to the Nations.
          </p>
        </div>

        {/* Comparison split card */}
        <div className="mt-10 grid overflow-hidden rounded-3xl border border-slate-200 shadow-[0_20px_60px_rgba(13,33,44,0.08)] md:grid-cols-2">
          {/* Sin canal */}
          <div className="bg-slate-50 p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Hoy
            </p>
            <h3 className="mt-2 text-lg font-extrabold text-[#0d212c] sm:text-xl">
              Correo interno y planillas
            </h3>
            <ul className="mt-5 space-y-3.5">
              {COMPARISON_ROWS.map((row) => (
                <li
                  key={`sin-${row}`}
                  className="flex items-start gap-2.5 text-sm text-slate-500"
                >
                  <i
                    className="icon-[lucide--x] mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                    aria-hidden
                  />
                  {row}
                </li>
              ))}
            </ul>
          </div>
          {/* Con EthicVoice */}
          <div className="relative overflow-hidden bg-[#0b1620] p-6 sm:p-8">
            <div
              className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-25 blur-3xl"
              style={{ background: "rgba(163,230,53,0.35)" }}
              aria-hidden
            />
            <p className="text-[11px] font-bold uppercase tracking-widest text-lime-300">
              Con EthicVoice
            </p>
            <h3 className="mt-2 text-lg font-extrabold text-white sm:text-xl">
              Un canal ético que trabaja por ti
            </h3>
            <ul className="mt-5 space-y-3.5">
              {COMPARISON_ROWS.map((row) => (
                <li
                  key={`con-${row}`}
                  className="flex items-start gap-2.5 text-sm text-white/80"
                >
                  <i
                    className="icon-[lucide--check] mt-0.5 h-4 w-4 shrink-0 text-lime-300"
                    aria-hidden
                  />
                  {row}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={(e) => {
                trackGA4Event("landing_cta_click", {
                  cta_name: "comparison_demo",
                  placement: "comparison",
                });
                openCalendly(e);
              }}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-[#052b24] shadow-[0_6px_20px_rgba(163,230,53,0.3)] transition hover:bg-lime-300"
            >
              Agendar demo gratis
              <i
                className="icon-[lucide--arrow-right] h-4 w-4"
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function FeaturesSection() {
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="scroll-mt-24 bg-slate-50 py-16 sm:py-20 md:py-24"
      id="solucion"
      {...reveal}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 grid gap-6 sm:mb-12 md:mb-14 lg:grid-cols-2 lg:items-end lg:gap-10">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
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
              Recepción, investigación, seguimiento y analítica en un flujo
              continuo para que tu equipo de compliance opere sin fricciones.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              {[
                "Confidencialidad y anonimato real",
                "SLA y vencimientos legales",
                "Tableros gerenciales",
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700"
                >
                  <i className="icon-[lucide--check] h-3 w-3" aria-hidden />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 6 feature cards */}
        {reduced === true ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => {
              const isLime = feat.color === "lime";
              return (
                <article
                  key={feat.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl sm:p-6"
                >
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${
                      isLime ? "bg-emerald-50/70" : "bg-slate-100"
                    }`}
                  >
                    <i
                      className={`${feat.icon} h-5 w-5 ${isLime ? "text-emerald-700" : "text-slate-700"}`}
                      aria-hidden
                    />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-[#0d212c]">
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {feat.desc}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={LANDING_VIEWPORT}
            variants={LANDING_STAGGER_CONTAINER}
          >
            {FEATURES.map((feat) => {
              const isLime = feat.color === "lime";
              return (
                <motion.article
                  key={feat.title}
                  variants={LANDING_STAGGER_ITEM}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl sm:p-6"
                >
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${
                      isLime ? "bg-emerald-50/70" : "bg-slate-100"
                    }`}
                  >
                    <i
                      className={`${feat.icon} h-5 w-5 ${isLime ? "text-emerald-700" : "text-slate-700"}`}
                      aria-hidden
                    />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-[#0d212c]">
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {feat.desc}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        )}

        {/* KPI strip — stack on very narrow screens */}
        {reduced === true ? (
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
                <p className="mt-1 text-sm font-extrabold text-[#0d212c] sm:text-base">
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={LANDING_VIEWPORT}
            variants={LANDING_STAGGER_CONTAINER}
          >
            {[
              { label: "Canal activo", value: "24/7" },
              { label: "Modelo de operación", value: "Multicanal" },
              { label: "Enfoque", value: "Cumplimiento + Cultura" },
            ].map((kpi) => (
              <motion.div
                key={kpi.label}
                variants={LANDING_STAGGER_ITEM}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {kpi.label}
                </p>
                <p className="mt-1 text-sm font-extrabold text-[#0d212c] sm:text-base">
                  {kpi.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

function HowItWorksSection() {
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-24"
      id="como-funciona"
      {...reveal}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
            Cómo funciona
          </p>
          <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0d212c] sm:text-4xl md:text-5xl">
            De denuncia a cierre
            <br />
            en 4 pasos claros
          </h2>
          <p className="mx-auto mt-4 max-w-lg px-1 text-base leading-relaxed text-slate-500 sm:text-lg">
            Proceso estructurado para que ningún caso se pierda y todo quede
            documentado.
          </p>
        </div>

        {/* Steps grid */}
        {reduced === true ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {STEPS.map((step, idx) => (
              <article
                key={step.title}
                className="group relative flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-xl sm:p-6"
              >
                {idx < STEPS.length - 1 && (
                  <div
                    className="absolute right-0 top-10 hidden h-px w-5 translate-x-full bg-gradient-to-r from-emerald-300/70 to-transparent lg:block"
                    aria-hidden
                  />
                )}
                <div
                  className="absolute right-4 top-3 select-none text-5xl font-black text-slate-100 transition-colors group-hover:text-emerald-100"
                  aria-hidden
                >
                  {step.num}
                </div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#051a24]">
                  <i
                    className={`${step.icon} h-5 w-5 text-emerald-400`}
                    aria-hidden
                  />
                </div>
                <h3 className="mb-2 text-sm font-bold leading-snug text-[#0d212c] sm:text-base">
                  {step.title}
                </h3>
                <p className="flex-1 text-xs leading-relaxed text-slate-500">
                  {step.desc}
                </p>
                <div className="mt-4 rounded-xl bg-emerald-50/70 px-3 py-2">
                  <p className="text-[11px] font-semibold text-emerald-800">
                    <i
                      className="icon-[lucide--circle-check] mr-1 inline h-3.5 w-3.5 text-emerald-600"
                      aria-hidden
                    />
                    {step.outcome}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={LANDING_VIEWPORT}
            variants={LANDING_STAGGER_CONTAINER}
          >
            {STEPS.map((step, idx) => (
              <motion.article
                key={step.title}
                variants={LANDING_STAGGER_ITEM}
                className="group relative flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-xl sm:p-6"
              >
                {idx < STEPS.length - 1 && (
                  <div
                    className="absolute right-0 top-10 hidden h-px w-5 translate-x-full bg-gradient-to-r from-emerald-300/70 to-transparent lg:block"
                    aria-hidden
                  />
                )}
                <div
                  className="absolute right-4 top-3 select-none text-5xl font-black text-slate-100 transition-colors group-hover:text-emerald-100"
                  aria-hidden
                >
                  {step.num}
                </div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#051a24]">
                  <i
                    className={`${step.icon} h-5 w-5 text-emerald-400`}
                    aria-hidden
                  />
                </div>
                <h3 className="mb-2 text-sm font-bold leading-snug text-[#0d212c] sm:text-base">
                  {step.title}
                </h3>
                <p className="flex-1 text-xs leading-relaxed text-slate-500">
                  {step.desc}
                </p>
                <div className="mt-4 rounded-xl bg-emerald-50/70 px-3 py-2">
                  <p className="text-[11px] font-semibold text-emerald-800">
                    <i
                      className="icon-[lucide--circle-check] mr-1 inline h-3.5 w-3.5 text-emerald-600"
                      aria-hidden
                    />
                    {step.outcome}
                  </p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

function SecuritySection() {
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="scroll-mt-24 relative overflow-hidden bg-[#0f172a] py-16 sm:py-20 md:py-24"
      id="seguridad"
      {...reveal}
    >
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      {/* Right glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] opacity-20 blur-[100px]"
        style={{ background: "rgba(45,212,191,0.28)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          {/* Left text */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-300">
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
            <div className="mt-6 inline-flex max-w-full flex-wrap items-center gap-2.5 rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-2.5 sm:mt-8 sm:px-5">
              <i
                className="icon-[lucide--shield-check] h-5 w-5 shrink-0 text-emerald-300"
                aria-hidden
              />
              <span className="text-left text-sm font-semibold text-emerald-200">
                Seguridad orientada a compliance
              </span>
            </div>

            {/* Metrics */}
            {reduced === true ? (
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
                    <p className="mt-1 text-sm font-bold text-white sm:text-base">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3"
                initial="hidden"
                whileInView="visible"
                viewport={LANDING_VIEWPORT}
                variants={LANDING_STAGGER_CONTAINER}
              >
                {[
                  { label: "Acceso", value: "Por roles" },
                  { label: "Visibilidad", value: "Trazable" },
                  { label: "Canal", value: "Bidireccional" },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    variants={LANDING_STAGGER_ITEM}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3.5 text-center sm:px-4"
                  >
                    <p className="text-pretty text-[10px] font-bold uppercase tracking-widest text-white/35">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white sm:text-base">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right cards grid */}
          {reduced === true ? (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {SECURITY_FEATURES.map((feat) => (
                <article
                  key={feat.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.07] sm:p-5"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/[0.12]">
                    <i
                      className={`${feat.icon} h-5 w-5 text-emerald-300`}
                      aria-hidden
                    />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-white/50">
                    {feat.desc}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid gap-3 sm:grid-cols-2 sm:gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={LANDING_VIEWPORT}
              variants={LANDING_STAGGER_CONTAINER}
            >
              {SECURITY_FEATURES.map((feat) => (
                <motion.article
                  key={feat.title}
                  variants={LANDING_STAGGER_ITEM}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.07] sm:p-5"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/[0.12]">
                    <i
                      className={`${feat.icon} h-5 w-5 text-emerald-300`}
                      aria-hidden
                    />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-white/50">
                    {feat.desc}
                  </p>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function TestimonialsSection() {
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="scroll-mt-24 bg-[#0f172a] py-16 sm:py-20 md:py-24"
      {...reveal}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-300">
            Testimonios
          </p>
          <h2 className="text-balance text-3xl font-extrabold text-white sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          {reduced === true ? (
            <>
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 ring-1 ring-emerald-300/20 sm:p-8 md:p-10 lg:col-span-7">
                <div
                  className="pointer-events-none absolute right-0 top-0 h-48 w-48 opacity-15 blur-3xl"
                  style={{ background: "rgba(45,212,191,0.35)" }}
                  aria-hidden
                />
                <div className="relative z-10">
                  <div className="mb-6 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i
                        key={i}
                        className="icon-[lucide--star] h-5 w-5 fill-current text-amber-300"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <blockquote className="text-pretty text-lg font-semibold leading-snug text-white sm:text-xl md:text-2xl lg:text-3xl">
                    "{TESTIMONIALS[0].quote}"
                  </blockquote>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-sm font-black text-[#0f172a]">
                      {TESTIMONIALS[0].initials}
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {TESTIMONIALS[0].author}
                      </p>
                      <p className="text-sm text-white/45">
                        {TESTIMONIALS[0].company}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
              <div className="flex flex-col gap-4 lg:col-span-5">
                {TESTIMONIALS.slice(1).map((t) => (
                  <article
                    key={t.quote}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className="icon-[lucide--star] h-3.5 w-3.5 fill-current text-amber-300"
                          aria-hidden
                        />
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
                        <p className="text-sm font-semibold text-white">
                          {t.author}
                        </p>
                        <p className="text-xs text-white/35">{t.company}</p>
                      </div>
                    </div>
                  </article>
                ))}
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-4 sm:px-5">
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
                        <p className="mt-0.5 text-sm font-extrabold text-emerald-200">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <motion.article
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 ring-1 ring-emerald-300/20 sm:p-8 md:p-10 lg:col-span-7"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={LANDING_VIEWPORT}
                transition={{ duration: 0.58, ease: LANDING_EASE }}
              >
                <div
                  className="pointer-events-none absolute right-0 top-0 h-48 w-48 opacity-15 blur-3xl"
                  style={{ background: "rgba(45,212,191,0.35)" }}
                  aria-hidden
                />
                <div className="relative z-10">
                  <div className="mb-6 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i
                        key={i}
                        className="icon-[lucide--star] h-5 w-5 fill-current text-amber-300"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <blockquote className="text-pretty text-lg font-semibold leading-snug text-white sm:text-xl md:text-2xl lg:text-3xl">
                    "{TESTIMONIALS[0].quote}"
                  </blockquote>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-sm font-black text-[#0f172a]">
                      {TESTIMONIALS[0].initials}
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {TESTIMONIALS[0].author}
                      </p>
                      <p className="text-sm text-white/45">
                        {TESTIMONIALS[0].company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.article>

              <motion.div
                className="flex flex-col gap-4 lg:col-span-5"
                initial="hidden"
                whileInView="visible"
                viewport={LANDING_VIEWPORT}
                variants={LANDING_STAGGER_CONTAINER}
              >
                {TESTIMONIALS.slice(1).map((t) => (
                  <motion.article
                    key={t.quote}
                    variants={LANDING_STAGGER_ITEM}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className="icon-[lucide--star] h-3.5 w-3.5 fill-current text-amber-300"
                          aria-hidden
                        />
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
                        <p className="text-sm font-semibold text-white">
                          {t.author}
                        </p>
                        <p className="text-xs text-white/35">{t.company}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
                <motion.div
                  variants={LANDING_STAGGER_ITEM}
                  className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-4 sm:px-5"
                >
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
                        <p className="mt-0.5 text-sm font-extrabold text-emerald-200">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export function PricingSection() {
  const { openCalendly } = useCalendlyGate();
  const enterprise = PLAN_CONFIGS[PlanType.PREMIUM];
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();
  const goToCheckoutFlow = (planType: PlanType) => {
    if (planType === PlanType.PREMIUM) {
      openCalendly();
      return;
    }
    const target = `/pricing?plan=${planType}&billing=${BillingCycle.MONTHLY}`;
    window.location.href = target;
  };

  return (
    <motion.section
      className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-24"
      id="planes"
      {...reveal}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12 md:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
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
        {reduced === true ? (
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
                      ? "bg-[#0f172a] shadow-[0_24px_60px_rgba(15,23,42,0.38)] ring-2 ring-lime-400"
                      : "border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-xl"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-lime-400 px-4 py-1 text-[11px] font-black uppercase tracking-wide text-[#052b24]">
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
                            isPopular ? "text-emerald-300" : "text-emerald-600"
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
                      e.preventDefault();
                      goToCheckoutFlow(planType);
                    }}
                    className={`mt-8 w-full rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 ${
                      isPopular
                        ? "bg-lime-400 text-[#052b24] shadow-[0_6px_20px_rgba(163,230,53,0.3)] hover:bg-lime-300"
                        : "border-2 border-[#0a1e14] text-[#0a1e14] hover:bg-[#0a1e14] hover:text-white"
                    }`}
                  >
                    Comenzar ahora
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <motion.div
            className="grid gap-6 sm:grid-cols-3 sm:gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={LANDING_VIEWPORT}
            variants={LANDING_STAGGER_CONTAINER}
          >
            {PLAN_ORDER.map((planType) => {
              const plan = PLAN_CONFIGS[planType];
              const isPopular = !!plan.isPopular;
              const employees =
                plan.features.maxEmployees === -1
                  ? "Colaboradores ilimitados"
                  : `Hasta ${plan.features.maxEmployees} colaboradores`;

              return (
                <motion.article
                  key={planType}
                  variants={LANDING_STAGGER_ITEM}
                  className={`relative flex min-h-0 flex-col rounded-2xl p-5 transition-all duration-300 sm:p-7 ${
                    isPopular
                      ? "bg-[#0f172a] shadow-[0_24px_60px_rgba(15,23,42,0.38)] ring-2 ring-lime-400"
                      : "border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-xl"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-lime-400 px-4 py-1 text-[11px] font-black uppercase tracking-wide text-[#052b24]">
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
                            isPopular ? "text-emerald-300" : "text-emerald-600"
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
                      e.preventDefault();
                      goToCheckoutFlow(planType);
                    }}
                    className={`mt-8 w-full rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 ${
                      isPopular
                        ? "bg-lime-400 text-[#052b24] shadow-[0_6px_20px_rgba(163,230,53,0.3)] hover:bg-lime-300"
                        : "border-2 border-[#0a1e14] text-[#0a1e14] hover:bg-[#0a1e14] hover:text-white"
                    }`}
                  >
                    Comenzar ahora
                  </button>
                </motion.article>
              );
            })}
          </motion.div>
        )}

        {/* Enterprise card */}
        {reduced === true ? (
          <article className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 sm:mt-5 sm:p-8 md:p-10">
            <div
              className="pointer-events-none absolute right-0 top-0 h-64 w-64 opacity-20 blur-[80px]"
              style={{ background: "rgba(45,212,191,0.3)" }}
              aria-hidden
            />
            <div className="relative grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-8">
              <div>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-200 sm:px-4 sm:text-[11px]">
                  Plan empresarial
                </span>
                <h3 className="mt-3 text-2xl font-extrabold text-white sm:mt-4 sm:text-3xl">
                  {enterprise.displayName}
                </h3>
                <p className="mt-3 leading-relaxed text-white/60">
                  {enterprise.description}
                </p>
                <div className="mt-5 inline-block rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Precio
                  </p>
                  <p className="mt-0.5 text-2xl font-black text-white">
                    Bajo consulta
                  </p>
                  <p className="text-xs text-white/40">
                    Implementación según alcance
                  </p>
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
                    className="mt-6 rounded-xl bg-lime-400 px-8 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_6px_20px_rgba(163,230,53,0.3)] transition hover:bg-lime-300"
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
                    <i
                      className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                      aria-hidden
                    />
                    <p className="text-sm leading-snug text-white/75">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ) : (
          <motion.article
            className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 sm:mt-5 sm:p-8 md:p-10"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={LANDING_VIEWPORT}
            transition={{ duration: 0.58, ease: LANDING_EASE, delay: 0.08 }}
          >
            <div
              className="pointer-events-none absolute right-0 top-0 h-64 w-64 opacity-20 blur-[80px]"
              style={{ background: "rgba(45,212,191,0.3)" }}
              aria-hidden
            />
            <div className="relative grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-8">
              <div>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-200 sm:px-4 sm:text-[11px]">
                  Plan empresarial
                </span>
                <h3 className="mt-3 text-2xl font-extrabold text-white sm:mt-4 sm:text-3xl">
                  {enterprise.displayName}
                </h3>
                <p className="mt-3 leading-relaxed text-white/60">
                  {enterprise.description}
                </p>
                <div className="mt-5 inline-block rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Precio
                  </p>
                  <p className="mt-0.5 text-2xl font-black text-white">
                    Bajo consulta
                  </p>
                  <p className="text-xs text-white/40">
                    Implementación según alcance
                  </p>
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
                    className="mt-6 rounded-xl bg-lime-400 px-8 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_6px_20px_rgba(163,230,53,0.3)] transition hover:bg-lime-300"
                  >
                    Hablar con un consultor
                  </button>
                </div>
              </div>
              <motion.div
                className="grid gap-3 sm:grid-cols-2"
                initial="hidden"
                whileInView="visible"
                viewport={LANDING_VIEWPORT}
                variants={LANDING_STAGGER_CONTAINER}
              >
                {enterprise.features.highlights.slice(0, 6).map((feature) => (
                  <motion.div
                    key={feature}
                    variants={LANDING_STAGGER_ITEM}
                    className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4"
                  >
                    <i
                      className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                      aria-hidden
                    />
                    <p className="text-sm leading-snug text-white/75">
                      {feature}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.article>
        )}

        {/* Reaseguro — reduce fricción de compra */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {[
            { icon: "icon-[lucide--calendar-x]", label: "Sin permanencia" },
            { icon: "icon-[lucide--rocket]", label: "Activación en días" },
            {
              icon: "icon-[lucide--graduation-cap]",
              label: "Onboarding y acompañamiento incluidos",
            },
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-800"
            >
              <i className={`${item.icon} h-3.5 w-3.5 shrink-0`} aria-hidden />
              {item.label}
            </span>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          * Precios en USD. La configuración final depende del alcance de
          implementación.
        </p>
      </div>
    </motion.section>
  );
}

export function FAQSection() {
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="scroll-mt-24 bg-slate-50 py-16 sm:py-20 md:py-24"
      id="faq"
      {...reveal}
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
            FAQ
          </p>
          <h2 className="text-balance text-3xl font-extrabold text-[#0d212c] sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="mx-auto mt-3 max-w-md px-1 text-base text-slate-500">
            Todo lo que necesitas saber antes de implementar tu canal ético.
          </p>
        </div>
        {reduced === true ? (
          <div className="space-y-3">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left text-sm font-bold leading-snug text-[#0d212c] transition-colors hover:bg-slate-50 sm:gap-4 sm:px-6 sm:py-5 sm:text-base">
                  {item.q}
                  <i
                    className="icon-[lucide--plus] h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:hidden"
                    aria-hidden
                  />
                  <i
                    className="icon-[lucide--minus] hidden h-4 w-4 shrink-0 text-emerald-600 group-open:block"
                    aria-hidden
                  />
                </summary>
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4">
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={LANDING_VIEWPORT}
            variants={LANDING_STAGGER_CONTAINER}
          >
            {FAQS.map((item) => (
              <motion.div key={item.q} variants={LANDING_STAGGER_ITEM}>
                <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left text-sm font-bold leading-snug text-[#0d212c] transition-colors hover:bg-slate-50 sm:gap-4 sm:px-6 sm:py-5 sm:text-base">
                    {item.q}
                    <i
                      className="icon-[lucide--plus] h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:hidden"
                      aria-hidden
                    />
                    <i
                      className="icon-[lucide--minus] hidden h-4 w-4 shrink-0 text-emerald-600 group-open:block"
                      aria-hidden
                    />
                  </summary>
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4">
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      {item.a}
                    </p>
                  </div>
                </details>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

export function LeadMagnetBandSection() {
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="scroll-mt-24 border-t border-slate-100 bg-white py-14 sm:py-16 md:py-20"
      aria-labelledby="lead-magnet-heading"
      {...reveal}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 sm:p-10 md:p-12">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-40 blur-3xl"
            style={{ background: "rgba(163,230,53,0.3)" }}
            aria-hidden
          />
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
                Recurso gratuito
              </p>
              <h2
                id="lead-magnet-heading"
                className="max-w-xl text-balance text-2xl font-extrabold leading-tight tracking-tight text-[#0d212c] sm:text-3xl"
              >
                ¿Aún no estás listo para una demo? Empieza por la guía.
              </h2>
              <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
                Descarga la guía para implementar un canal de denuncias
                exitoso: pasos, errores comunes y checklist de lanzamiento
                interno para tu organización.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Checklist de implementación",
                  "Errores comunes a evitar",
                  "Plan de comunicación interna",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800"
                  >
                    <i
                      className="icon-[lucide--check] h-3 w-3 shrink-0"
                      aria-hidden
                    />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-center">
              <Link
                href="/guia-canal-denuncias"
                onClick={() =>
                  trackGA4Event("landing_cta_click", {
                    cta_name: "lead_magnet_guide",
                    placement: "lead_magnet",
                  })
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#0a1e14] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#123527]"
              >
                <i
                  className="icon-[lucide--download] h-4 w-4 shrink-0"
                  aria-hidden
                />
                Descargar guía gratis
              </Link>
              <p className="text-xs text-slate-400">
                Sin costo · Descarga inmediata
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function LandingClosingCtaSection() {
  const reveal = useInViewReveal();
  return (
    <motion.section
      className="border-t border-slate-200"
      aria-label="Siguiente paso"
      {...reveal}
    >
      <FooterDemoCtaBand ctaName="closing_demo" placement="closing" />
    </motion.section>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function LandingV3() {
  const phone = process.env.NEXT_PUBLIC_WPP_NUMBER || "";
  const cookie = useCookieConsentOptional();
  const allowFunctional =
    cookie?.hydrated &&
    !!cookie.consent?.functional &&
    !cookie.needsInteraction;
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
        <HeroDemoVideoStrip />
        <StatsBand />
        <LogoProofSection />
        <PainComparisonSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <LeadMagnetBandSection />
      </main>

      <LandingClosingCtaSection />
      <LandingMinimalFooter />
    </div>
  );
}
