"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { StickyCalendlyToast } from "@/modules/landig-page/components/StickyCalendlyToast";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { trackGA4Event } from "@/lib/google-analytics";
import {
  useLandingVariant,
  useLandingViewEvent,
  useUtmCapture,
  type LandingVariant,
} from "@/modules/landig-page/lib/landingConversion";
import { LandingNav } from "@/modules/landig-page/components/LandingNavBar";
import { FooterDemoCtaBand } from "@/modules/landig-page/components/FooterDemoCtaBand";
import { LandingMinimalFooter } from "@/modules/landig-page/components/LandingMinimalFooter";
import { VideoModal } from "@/modules/landig-page/components/VideoModal";
import {
  DotPattern,
  FloatingBlob,
  LineGridPattern,
  SectionEyebrow,
} from "@/modules/landig-page/components/decor";
import {
  handleSpotlightMove,
  SPOTLIGHT_INITIAL_STYLE,
  SpotlightGlow,
} from "@/modules/landig-page/components/SpotlightCard";
import {
  FAQS,
  FAQSection,
  LeadMagnetBandSection,
  PainComparisonSection,
  PricingSection,
} from "@/modules/landig-page/components/LandingV3";

const DEMO_PRODUCT_VIDEO_SRC = "/demo-video.mp4";
const DEMO_PRODUCT_VIDEO_POSTER = "/platform/ethicvoice-hero-frame.jpg";

const LANDING_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const LANDING_VIEWPORT = {
  once: true,
  amount: 0.14 as const,
  margin: "-56px 0px -12% 0px" as const,
};

const STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: LANDING_EASE },
  },
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

// ─── PRODUCT MOCKUPS (código, no screenshots) ─────────────────────────────────

/** Barra de medición animada — se llena al entrar en viewport. */
function MeterBar({
  label,
  pct,
  tone,
  delay = 0,
}: {
  label: string;
  pct: number;
  tone: "rose" | "amber" | "emerald";
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const fill =
    tone === "rose"
      ? "bg-rose-500"
      : tone === "amber"
        ? "bg-amber-400"
        : "bg-emerald-500";
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-500">
          {label}
        </span>
        <span className="text-[10px] font-black tabular-nums text-[#0a1e14]">
          {pct}%
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={`h-full rounded-full ${fill}`}
          initial={reduced === true ? { width: `${pct}%` } : { width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: LANDING_EASE, delay }}
        />
      </div>
    </div>
  );
}

/** Tarjeta principal del hero: detalle de un caso con análisis de IA. */
function CaseCardMock() {
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#0a1e14]/10 bg-white shadow-[0_32px_80px_rgba(10,30,20,0.18)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-[#f7faf9] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a1e14]">
            <i
              className="icon-[lucide--shield-check] h-3.5 w-3.5 text-lime-300"
              aria-hidden
            />
          </span>
          <div>
            <p className="text-[11px] font-black tracking-tight text-[#0a1e14]">
              Caso #DEN-2481
            </p>
            <p className="text-[9px] text-slate-400">Recibido hace 2 min</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-rose-600 ring-1 ring-rose-200">
          <span className="h-1 w-1 rounded-full bg-rose-500" />
          Severidad alta
        </span>
      </div>

      {/* IA panel */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <i
            className="icon-[lucide--sparkles] h-3.5 w-3.5 text-emerald-600"
            aria-hidden
          />
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
            Análisis de IA
          </p>
        </div>
        <div className="mt-3 space-y-2.5">
          <MeterBar label="Nivel de riesgo" pct={82} tone="rose" delay={0.15} />
          <MeterBar label="Prioridad sugerida" pct={90} tone="amber" delay={0.3} />
          <MeterBar
            label="Confianza del análisis"
            pct={96}
            tone="emerald"
            delay={0.45}
          />
        </div>
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
          <p className="text-[10px] leading-relaxed text-emerald-900">
            <span className="font-bold">Categoría:</span> Conflicto de intereses
            · <span className="font-bold">Área:</span> Compras ·{" "}
            <span className="font-bold">Acción:</span> asignar investigador
            senior
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <div className="flex -space-x-1.5">
          {["bg-[#0a1e14]", "bg-emerald-600", "bg-slate-300"].map((bg, i) => (
            <span
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white ${bg}`}
            >
              <i
                className="icon-[lucide--user] h-3 w-3 text-white"
                aria-hidden
              />
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#0a1e14] px-3 py-1.5 text-[9px] font-bold text-white">
          Asignar caso
          <i className="icon-[lucide--arrow-right] h-2.5 w-2.5" aria-hidden />
        </span>
      </div>
    </div>
  );
}

/** Tarjeta secundaria: chat confidencial con el denunciante. */
function ChatCardMock() {
  const reduced = useReducedMotion();
  const bubble = (delay: number) =>
    reduced === true
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.6 },
          transition: { duration: 0.5, ease: LANDING_EASE, delay },
        };
  return (
    <div className="w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white/95 shadow-[0_20px_50px_rgba(10,30,20,0.16)] backdrop-blur">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
          <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <p className="text-[10px] font-bold text-[#0a1e14]">
          Chat confidencial
        </p>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">
          Anónimo
        </span>
      </div>
      <div className="space-y-2 px-4 py-3">
        <motion.div
          className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2"
          {...bubble(0.5)}
        >
          <p className="text-[10px] leading-snug text-slate-600">
            Tengo evidencia adicional del caso…
          </p>
        </motion.div>
        <motion.div
          className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#0a1e14] px-3 py-2"
          {...bubble(0.8)}
        >
          <p className="text-[10px] leading-snug text-white">
            Gracias. Puedes adjuntarla aquí, tu identidad sigue protegida.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/** Mini formulario de denuncia — tile del bento. */
function FormMock() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <div className="h-2 w-16 rounded-full bg-slate-200" />
        <div className="h-8 rounded-lg border border-slate-200 bg-slate-50" />
        <div className="h-2 w-20 rounded-full bg-slate-200" />
        <div className="h-14 rounded-lg border border-slate-200 bg-slate-50" />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
        <span className="text-[10px] font-bold text-emerald-900">
          Mantener anonimato
        </span>
        <span className="flex h-4 w-7 items-center rounded-full bg-emerald-600 px-0.5">
          <span className="ml-auto h-3 w-3 rounded-full bg-white" />
        </span>
      </div>
      <div className="mt-3 flex h-8 items-center justify-center rounded-full bg-lime-400 text-[10px] font-black uppercase tracking-wide text-[#052b24]">
        Enviar denuncia
      </div>
    </div>
  );
}

/** Gráfica de barras CSS animada — tile de analítica. */
function ChartMock() {
  const reduced = useReducedMotion();
  const bars = [34, 58, 42, 72, 55, 88, 64];
  return (
    <div className="flex h-28 items-end justify-between gap-2 px-1">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className={`w-full rounded-t-md ${
            i === 5 ? "bg-lime-400" : "bg-emerald-600/25"
          }`}
          initial={reduced === true ? { height: `${h}%` } : { height: "8%" }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: LANDING_EASE, delay: i * 0.07 }}
        />
      ))}
    </div>
  );
}

/** Pila de alertas SLA — tile de vencimientos. */
function AlertsMock() {
  return (
    <div className="space-y-2">
      {[
        {
          icon: "icon-[lucide--alarm-clock]",
          text: "Caso #2470 vence en 48 h",
          tone: "border-amber-200 bg-amber-50 text-amber-800",
        },
        {
          icon: "icon-[lucide--bell-ring]",
          text: "Nueva denuncia asignada",
          tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
        },
        {
          icon: "icon-[lucide--check-check]",
          text: "Caso #2455 cerrado y auditado",
          tone: "border-slate-200 bg-white text-slate-500",
        },
      ].map((a) => (
        <div
          key={a.text}
          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-sm ${a.tone}`}
        >
          <i className={`${a.icon} h-3.5 w-3.5 shrink-0`} aria-hidden />
          <span className="text-[10px] font-semibold">{a.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

type StatSpec =
  | { kind: "24_7" }
  | { kind: "plusInt"; max: number }
  | { kind: "outOf5"; max: number }
  | { kind: "text"; value: string };

const IMPACT_STATS: ReadonlyArray<{
  spec: StatSpec;
  label: string;
  icon: string;
}> = [
  {
    spec: { kind: "24_7" },
    label: "Canal siempre disponible",
    icon: "icon-[lucide--clock]",
  },
  {
    spec: { kind: "plusInt", max: 100 },
    label: "Organizaciones confían",
    icon: "icon-[lucide--building-2]",
  },
  {
    spec: { kind: "outOf5", max: 4.9 },
    label: "Satisfacción de clientes",
    icon: "icon-[lucide--star]",
  },
  {
    spec: { kind: "text", value: "Días" },
    label: "De contrato a canal activo",
    icon: "icon-[lucide--rocket]",
  },
];

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function formatStat(spec: StatSpec, linear01: number) {
  const p = easeOutCubic(Math.min(1, Math.max(0, linear01)));
  switch (spec.kind) {
    case "24_7":
      return `${Math.round(24 * p)}/${Math.round(7 * p)}`;
    case "plusInt":
      return `+${Math.round(spec.max * p)}`;
    case "outOf5":
      return `${(spec.max * p).toFixed(1)}/5`;
    case "text":
      return spec.value;
    default:
      return "";
  }
}

function StatTicker({
  spec,
  active,
  delayMs,
  reduceMotion,
}: {
  spec: StatSpec;
  active: boolean;
  delayMs: number;
  reduceMotion: boolean;
}) {
  const [text, setText] = useState(() =>
    formatStat(spec, reduceMotion ? 1 : 0),
  );

  useEffect(() => {
    if (reduceMotion || spec.kind === "text") {
      setText(formatStat(spec, 1));
      return;
    }
    if (!active) return;

    const durationMs = 1150;
    const startWall = performance.now() + delayMs;
    let raf = 0;

    const tick = (now: number) => {
      if (now < startWall) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const linear = Math.min(1, (now - startWall) / durationMs);
      setText(formatStat(spec, linear));
      if (linear < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, delayMs, reduceMotion, spec]);

  return <span className="tabular-nums">{text}</span>;
}

const INDUSTRIES_ROW_A = [
  { icon: "icon-[lucide--factory]", label: "Manufactura" },
  { icon: "icon-[lucide--shopping-bag]", label: "Retail y consumo" },
  { icon: "icon-[lucide--cpu]", label: "Tecnología" },
  { icon: "icon-[lucide--heart-pulse]", label: "Salud" },
  { icon: "icon-[lucide--landmark]", label: "Servicios financieros" },
  { icon: "icon-[lucide--zap]", label: "Energía" },
] as const;

const INDUSTRIES_ROW_B = [
  { icon: "icon-[lucide--wheat]", label: "Agroindustria" },
  { icon: "icon-[lucide--truck]", label: "Logística" },
  { icon: "icon-[lucide--graduation-cap]", label: "Educación" },
  { icon: "icon-[lucide--hard-hat]", label: "Construcción" },
  { icon: "icon-[lucide--concierge-bell]", label: "Hotelería y turismo" },
  { icon: "icon-[lucide--building-2]", label: "ONG y sector público" },
] as const;

/**
 * El keyframe `marquee` traslada la fila por -50% de su ancho total, así que
 * el set de chips debe repetirse un número PAR de veces para que el loop siga
 * siendo perfecto. Con solo 2 copias, en pantallas anchas la mitad del recorrido
 * ya no alcanza a cubrir el viewport (queda un tramo en blanco antes de reiniciar);
 * repetir varias veces más garantiza que siempre haya chips de sobra visibles.
 */
const MARQUEE_REPEAT = 6;
function repeatIndustries<T>(row: readonly T[]): T[] {
  return Array.from({ length: MARQUEE_REPEAT }, () => row).flat();
}

const TESTIMONIALS = [
  {
    quote:
      "La implementación fue rápida y el comité ganó visibilidad real del estado de cada caso.",
    author: "Gerencia de Cumplimiento",
    company: "Empresa de servicios regional",
    initials: "GC",
    highlight: "Implementación rápida",
  },
  {
    quote:
      "Pasamos de correos sueltos a un proceso auditable con seguimiento claro y menos fricción.",
    author: "Dirección de Auditoría Interna",
    company: "Grupo corporativo",
    initials: "DA",
    highlight: "Proceso 100% auditable",
  },
  {
    quote:
      "La comunicación confidencial con denunciantes mejoró la calidad de las investigaciones.",
    author: "Responsable de Ética",
    company: "Compañía multisitio",
    initials: "RE",
    highlight: "Mejores investigaciones",
  },
] as const;

const SECURITY_CARDS = [
  {
    icon: "icon-[lucide--user-x]",
    title: "Anonimato real",
    desc: "La identidad del denunciante queda protegida de extremo a extremo.",
  },
  {
    icon: "icon-[lucide--key-round]",
    title: "Permisos por rol",
    desc: "Cada quien ve solo lo suyo: investigadores, comité y administración.",
  },
  {
    icon: "icon-[lucide--history]",
    title: "Auditoría completa",
    desc: "Cada acción queda registrada con fecha y responsable.",
  },
  {
    icon: "icon-[lucide--message-circle-heart]",
    title: "Canal bidireccional",
    desc: "Conversa con el denunciante sin comprometer su identidad.",
  },
] as const;

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

function HeroSection({ variant }: { variant: LandingVariant }) {
  const { openCalendly } = useCalendlyGate();
  const reduced = useReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);

  // Tilt 3D sutil que sigue al cursor — extraído del landing de referencia
  // (laptop parallax) y adaptado a la composición de producto del hero.
  // Muta el estilo directamente vía ref para no re-renderizar en cada
  // pointermove.
  const handleTiltMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced === true || event.pointerType !== "mouse" || !tiltRef.current)
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - bounds.left) / bounds.width - 0.5;
    const py = (event.clientY - bounds.top) / bounds.height - 0.5;
    tiltRef.current.style.transform = `rotateX(${py * -8}deg) rotateY(${px * 10}deg)`;
  };
  const resetTilt = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  };

  const headline =
    variant === "trust"
      ? (["Cumplimiento proactivo,", "cultura ética real."] as const)
      : (["Hacer lo correcto,", "ahora es simple."] as const);

  const container =
    reduced === true
      ? {}
      : {
          initial: "hidden" as const,
          animate: "visible" as const,
          variants: STAGGER_CONTAINER,
        };
  const item = reduced === true ? {} : { variants: STAGGER_ITEM };

  return (
    <section className="relative overflow-hidden bg-[#f7faf9]">
      <LineGridPattern />
      <FloatingBlob
        className="-top-24 left-[8%] h-72 w-72 opacity-50"
        color="radial-gradient(closest-side, rgba(163,230,53,0.35), transparent)"
        duration={9}
      />
      <FloatingBlob
        className="right-[4%] top-40 h-80 w-80 opacity-40"
        color="radial-gradient(closest-side, rgba(16,185,129,0.28), transparent)"
        duration={12}
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-5 pb-24 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-8 lg:pb-32 lg:pt-36">
        {/* Left — copy */}
        <motion.div className="text-center lg:text-left" {...container}>
          <motion.div {...item}>
            <SectionEyebrow>Línea Ética · LATAM</SectionEyebrow>
          </motion.div>

          <motion.h1
            className="mx-auto mt-5 max-w-2xl text-balance text-[clamp(2.2rem,6.2vw,3.2rem)] font-extrabold leading-[1.04] tracking-[-0.028em] text-[#0a1e14] sm:text-[clamp(2.7rem,5vw,3.8rem)] lg:mx-0 lg:text-[clamp(2.9rem,3.7vw,4.3rem)]"
            {...item}
          >
            <span className="block">{headline[0]}</span>
            <span className="block bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 bg-clip-text text-transparent">
              {headline[1]}
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg lg:mx-0"
            {...item}
          >
            Canal de denuncias, investigación y analítica con IA. Una sola
            plataforma, lista en días.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
            {...item}
          >
            <button
              type="button"
              onClick={(e) => {
                trackGA4Event("landing_cta_click", {
                  cta_name: "hero_demo",
                  placement: "hero",
                });
                openCalendly(e);
              }}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#052b24] shadow-[0_10px_30px_rgba(163,230,53,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lime-300 hover:shadow-[0_14px_38px_rgba(163,230,53,0.5)] sm:text-[0.9375rem]"
            >
              Agendar demo gratis
              <i
                className="icon-[lucide--arrow-right] h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => {
                trackGA4Event("landing_cta_click", {
                  cta_name: "hero_product",
                  placement: "hero",
                });
                document
                  .getElementById("como-funciona")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0a1e14]/15 bg-white/80 px-8 py-4 text-sm font-semibold text-[#0a1e14] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0a1e14]/35 sm:text-[0.9375rem]"
            >
              Ver la plataforma
            </button>
          </motion.div>

          <motion.p
            className="mt-4 text-xs font-medium text-slate-400 sm:text-[13px]"
            {...item}
          >
            30 minutos · Sin compromiso · En español
          </motion.p>

          <motion.div
            className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
            {...item}
          >
            <Link
              href="/submit"
              onClick={() =>
                trackGA4Event("landing_cta_click", {
                  cta_name: "hero_report",
                  placement: "hero",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-600/50 hover:bg-emerald-100 sm:text-[13px]"
            >
              <i className="icon-[lucide--megaphone] h-3.5 w-3.5 shrink-0" aria-hidden />
              ¿Necesitas denunciar? Hazlo aquí
            </Link>
            <Link
              href="/track"
              onClick={() =>
                trackGA4Event("landing_cta_click", {
                  cta_name: "hero_track",
                  placement: "hero",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:text-[13px]"
            >
              <i className="icon-[lucide--search] h-3.5 w-3.5 shrink-0" aria-hidden />
              Seguir mi denuncia
            </Link>
          </motion.div>
        </motion.div>

        {/* Right — composición de producto construida en código */}
        <motion.div
          className="relative mx-auto w-full max-w-md lg:max-w-none"
          initial={reduced === true ? false : { opacity: 0, scale: 0.96, y: 24 }}
          animate={reduced === true ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: LANDING_EASE, delay: 0.25 }}
        >
          <div
            className="pointer-events-none absolute -inset-8 rounded-[3rem] opacity-70 blur-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(163,230,53,0.25), rgba(16,185,129,0.14), transparent 70%)",
            }}
            aria-hidden
          />
          <div
            className="relative flex justify-center [perspective:1400px] lg:justify-end"
            onPointerMove={handleTiltMove}
            onPointerLeave={resetTilt}
          >
            <div
              ref={tiltRef}
              className="relative transition-transform duration-300 ease-out [transform-style:preserve-3d] will-change-transform"
            >
              <div className="-rotate-1">
                <CaseCardMock />
              </div>
              {/* Chat flotante superpuesto */}
              <div
                className="absolute -bottom-10 -left-6 rotate-2 motion-safe:animate-float sm:-left-14"
                style={{ animationDuration: "8s" }}
              >
                <ChatCardMock />
              </div>
              {/* Píldora de evento en vivo */}
              <div
                className="absolute -right-3 -top-5 motion-safe:animate-float sm:-right-8"
                style={{ animationDuration: "6s", animationDelay: "0.8s" }}
              >
                <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-white/95 px-3.5 py-2 shadow-[0_14px_36px_rgba(10,30,20,0.16)] backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute h-full w-full rounded-full bg-lime-400 opacity-70 motion-safe:animate-ping" />
                    <span className="relative h-2 w-2 rounded-full bg-lime-500" />
                  </span>
                  <span className="text-[10px] font-bold text-[#0a1e14]">
                    Denuncia recibida
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Franja de métricas — tarjeta flotante que se superpone al hero. */
function ImpactStatsSection() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const reveal = useInViewReveal();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative bg-[#f7faf9]">
      <motion.div
        ref={rootRef}
        className="relative z-10 mx-auto -mt-12 max-w-5xl overflow-hidden rounded-[2rem] bg-[#0a1e14] px-5 py-8 shadow-[0_28px_70px_rgba(10,30,20,0.35)] sm:-mt-14 sm:px-8 sm:py-10 lg:-mt-16"
        style={{ marginLeft: "auto", marginRight: "auto" }}
        {...reveal}
      >
        <LineGridPattern dark />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-[90px]"
          style={{ background: "rgba(163,230,53,0.4)" }}
          aria-hidden
        />
        <div className="relative grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
          {IMPACT_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2.5 px-4 text-center"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-lime-300/[0.12]">
                <i className={`${stat.icon} h-4 w-4 text-lime-300`} aria-hidden />
              </span>
              <span className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
                <StatTicker
                  spec={stat.spec}
                  active={visible}
                  delayMs={index * 100}
                  reduceMotion={reduceMotion}
                />
              </span>
              <span className="max-w-[11rem] text-pretty text-[11px] font-semibold uppercase leading-snug tracking-widest text-white/45 sm:text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
      <div className="h-14 sm:h-16" />
    </section>
  );
}

/** Demo en video — contenedor oscuro flotante, no banda de borde a borde. */
function InteractiveDemoSection() {
  const { openCalendly } = useCalendlyGate();
  const reveal = useInViewReveal();
  return (
    <section className="scroll-mt-24 bg-white px-4 py-8 sm:px-6 sm:py-12" id="como-funciona">
      <motion.div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#0b1620] px-6 py-14 sm:px-10 sm:py-16 md:px-14 md:py-20"
        {...reveal}
      >
        <LineGridPattern dark />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(120%,800px)] -translate-x-1/2 opacity-30 blur-[100px]"
          style={{ background: "rgba(163,230,53,0.25)" }}
          aria-hidden
        />

        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-14">
          <div className="text-center lg:text-left">
            <SectionEyebrow dark>Demo del producto</SectionEyebrow>
            <h2 className="mt-4 text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Míralo en acción
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-relaxed text-white/55 lg:mx-0">
              Un caso entra, la IA lo clasifica, tu equipo lo resuelve. Todo en
              un solo panel.
            </p>
            <ul className="mx-auto mt-6 max-w-md space-y-3 text-left lg:mx-0">
              {[
                "Intuitivo para denunciante e investigador",
                "Multicanal: web, formularios y correo",
                "Clasificación automática con IA",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-white/75"
                >
                  <i
                    className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-lime-300"
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
                  cta_name: "demo_section",
                  placement: "demo",
                });
                openCalendly(e);
              }}
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-lime-400 px-7 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_8px_24px_rgba(163,230,53,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lime-300"
            >
              Agendar demo gratis
              <i
                className="icon-[lucide--arrow-right] h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </div>
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-5 rounded-[2rem] opacity-50 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(163,230,53,0.28), rgba(16,185,129,0.12), transparent 70%)",
              }}
              aria-hidden
            />
            <VideoModal
              videoSrc={DEMO_PRODUCT_VIDEO_SRC}
              posterSrc={DEMO_PRODUCT_VIDEO_POSTER}
              className="relative aspect-video h-auto w-full rounded-2xl shadow-[0_28px_90px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/[0.09]"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/** Bento grid — la plataforma contada en tiles vivos, sin screenshots. */
function BentoSection() {
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();

  const tileBase =
    "group relative isolate flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_24px_60px_rgba(10,30,20,0.12)]";

  return (
    <section
      className="relative scroll-mt-24 overflow-hidden bg-[#f7faf9] py-16 sm:py-20 md:py-24"
      id="solucion"
    >
      <DotPattern />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div className="mb-12 text-center sm:mb-14" {...reveal}>
          <SectionEyebrow>Plataforma completa</SectionEyebrow>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0a1e14] sm:text-4xl md:text-5xl">
            Todo tu canal ético en un solo lugar
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
            Sin correos sueltos. Sin hojas de cálculo. Sin casos perdidos.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={reduced === true ? false : "hidden"}
          whileInView={reduced === true ? undefined : "visible"}
          viewport={LANDING_VIEWPORT}
          variants={STAGGER_CONTAINER}
        >
          {/* Tile 1 — Canal 24/7 (alto, con form mock) */}
          <motion.article
            variants={reduced === true ? undefined : STAGGER_ITEM}
            onMouseMove={handleSpotlightMove}
            style={SPOTLIGHT_INITIAL_STYLE}
            className={`${tileBase} sm:row-span-2`}
          >
            <SpotlightGlow color="rgba(163,230,53,0.16)" />
            <div className="mb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a1e14] shadow-[0_10px_24px_rgba(163,230,53,0.2)]">
                <i className="icon-[lucide--megaphone] h-5 w-5 text-lime-300" aria-hidden />
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-[#0a1e14]">
              Canal de denuncias 24/7
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Formularios personalizados, anónimos y en el idioma de tu equipo.
            </p>
            <div className="mt-5 flex-1">
              <FormMock />
            </div>
          </motion.article>

          {/* Tile 2 — IA */}
          <motion.article
            variants={reduced === true ? undefined : STAGGER_ITEM}
            onMouseMove={handleSpotlightMove}
            style={SPOTLIGHT_INITIAL_STYLE}
            className={tileBase}
          >
            <SpotlightGlow color="rgba(124,58,237,0.14)" />
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.2)]">
                <i className="icon-[lucide--sparkles] h-5 w-5 text-emerald-600" aria-hidden />
              </span>
              <h3 className="text-lg font-extrabold text-[#0a1e14]">
                IA que clasifica
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Severidad, categoría y riesgo, resueltos al instante.
            </p>
            <div className="mt-4 space-y-2.5">
              <MeterBar label="Nivel de riesgo" pct={82} tone="rose" />
              <MeterBar label="Prioridad sugerida" pct={90} tone="amber" delay={0.15} />
            </div>
          </motion.article>

          {/* Tile 3 — Chat confidencial */}
          <motion.article
            variants={reduced === true ? undefined : STAGGER_ITEM}
            onMouseMove={handleSpotlightMove}
            style={SPOTLIGHT_INITIAL_STYLE}
            className={tileBase}
          >
            <SpotlightGlow color="rgba(6,182,212,0.16)" />
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.2)]">
                <i className="icon-[lucide--messages-square] h-5 w-5 text-emerald-600" aria-hidden />
              </span>
              <h3 className="text-lg font-extrabold text-[#0a1e14]">
                Chat confidencial
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Conversa sin exponer la identidad de nadie.
            </p>
            <div className="mt-4 space-y-2">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2">
                <p className="text-[11px] text-slate-600">
                  ¿Puedes darnos más contexto?
                </p>
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#0a1e14] px-3 py-2">
                <p className="text-[11px] text-white">
                  Sí, ocurrió durante la auditoría…
                </p>
              </div>
            </div>
          </motion.article>

          {/* Tile 4 — Analítica */}
          <motion.article
            variants={reduced === true ? undefined : STAGGER_ITEM}
            onMouseMove={handleSpotlightMove}
            style={SPOTLIGHT_INITIAL_STYLE}
            className={tileBase}
          >
            <SpotlightGlow color="rgba(59,130,246,0.16)" />
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.2)]">
                <i className="icon-[lucide--bar-chart-3] h-5 w-5 text-emerald-600" aria-hidden />
              </span>
              <h3 className="text-lg font-extrabold text-[#0a1e14]">
                Analítica para comité
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Tendencias y tiempos de cierre, en tiempo real.
            </p>
            <div className="mt-4">
              <ChartMock />
            </div>
          </motion.article>

          {/* Tile 5 — Alertas SLA */}
          <motion.article
            variants={reduced === true ? undefined : STAGGER_ITEM}
            onMouseMove={handleSpotlightMove}
            style={SPOTLIGHT_INITIAL_STYLE}
            className={tileBase}
          >
            <SpotlightGlow color="rgba(245,158,11,0.18)" />
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.2)]">
                <i className="icon-[lucide--alarm-clock] h-5 w-5 text-emerald-600" aria-hidden />
              </span>
              <h3 className="text-lg font-extrabold text-[#0a1e14]">
                Alertas y SLA
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Ningún caso vence sin que lo sepas.
            </p>
            <div className="mt-4">
              <AlertsMock />
            </div>
          </motion.article>

          {/* Tile 6 — Reportes ejecutivos (ancho) */}
          <motion.article
            variants={reduced === true ? undefined : STAGGER_ITEM}
            onMouseMove={handleSpotlightMove}
            style={SPOTLIGHT_INITIAL_STYLE}
            className={`${tileBase} sm:col-span-2 lg:col-span-3 lg:flex-row lg:items-center lg:gap-10`}
          >
            <SpotlightGlow color="rgba(163,230,53,0.14)" />
            <div className="lg:max-w-md">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a1e14] shadow-[0_10px_24px_rgba(163,230,53,0.2)]">
                  <i className="icon-[lucide--file-check-2] h-5 w-5 text-lime-300" aria-hidden />
                </span>
                <h3 className="text-lg font-extrabold text-[#0a1e14]">
                  Reportes ejecutivos en un clic
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Demuestra debida diligencia ante comité, auditoría y
                reguladores.
              </p>
            </div>
            <div className="mt-5 flex flex-1 flex-wrap items-center gap-2.5 lg:mt-0 lg:justify-end">
              {[
                { label: "Casos abiertos", value: "12" },
                { label: "Tiempo medio de cierre", value: "9 días" },
                { label: "Cumplimiento SLA", value: "98%" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-slate-200 bg-[#f7faf9] px-4 py-3"
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    {kpi.label}
                  </p>
                  <p className="mt-0.5 text-lg font-black text-[#0a1e14]">
                    {kpi.value}
                  </p>
                </div>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-[#052b24]">
                <i className="icon-[lucide--download] h-3.5 w-3.5" aria-hidden />
                Exportar PDF
              </span>
            </div>
          </motion.article>
        </motion.div>
      </div>
    </section>
  );
}

function IndustryChip({
  industry,
}: {
  industry: { icon: string; label: string };
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm transition-colors hover:border-emerald-300">
      <i
        className={`${industry.icon} h-[18px] w-[18px] shrink-0 text-emerald-700`}
        aria-hidden
      />
      <span className="whitespace-nowrap text-sm font-semibold text-[#0a1e14]">
        {industry.label}
      </span>
    </div>
  );
}

function IndustriesSection() {
  const reveal = useInViewReveal();
  const reduced = useReducedMotion();
  // Con movimiento reducido las filas no animan (se envuelven en estático),
  // así que ahí basta un único set en vez de las copias repetidas del marquee.
  const rowA = reduced === true ? INDUSTRIES_ROW_A : repeatIndustries(INDUSTRIES_ROW_A);
  const rowB = reduced === true ? INDUSTRIES_ROW_B : repeatIndustries(INDUSTRIES_ROW_B);
  return (
    <motion.section
      className="relative overflow-hidden bg-white py-16 sm:py-20"
      {...reveal}
    >
      <div className="mx-auto mb-10 max-w-6xl px-5 text-center sm:px-6 lg:px-8">
        <SectionEyebrow>Para cada industria</SectionEyebrow>
        <h2 className="mx-auto mt-4 max-w-xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0a1e14] sm:text-4xl">
          Hecho para tu sector
        </h2>
      </div>

      <div className="space-y-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="flex overflow-hidden">
          <div className="flex min-w-max gap-4 pr-4 motion-safe:animate-marquee motion-reduce:min-w-0 motion-reduce:flex-wrap motion-reduce:justify-center">
            {rowA.map((industry, i) => (
              <IndustryChip key={`a-${industry.label}-${i}`} industry={industry} />
            ))}
          </div>
        </div>
        <div className="flex overflow-hidden">
          <div
            className="flex min-w-max gap-4 pr-4 motion-safe:animate-marquee motion-reduce:min-w-0 motion-reduce:flex-wrap motion-reduce:justify-center"
            style={{ animationDirection: "reverse" }}
          >
            {rowB.map((industry, i) => (
              <IndustryChip key={`b-${industry.label}-${i}`} industry={industry} />
            ))}
          </div>
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
      className="relative overflow-hidden bg-white py-16 sm:py-20 md:py-24"
      {...reveal}
    >
      <DotPattern />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <SectionEyebrow>Testimonios</SectionEyebrow>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-[#0a1e14] sm:text-4xl">
            Líderes de cumplimiento ya lo viven
          </h2>
        </div>

        <motion.div
          className="grid gap-5 md:grid-cols-3"
          initial={reduced === true ? false : "hidden"}
          whileInView={reduced === true ? undefined : "visible"}
          viewport={LANDING_VIEWPORT}
          variants={STAGGER_CONTAINER}
        >
          {TESTIMONIALS.map((t) => (
            <motion.article
              key={t.quote}
              variants={reduced === true ? undefined : STAGGER_ITEM}
              className="relative flex flex-col rounded-3xl border border-slate-200 bg-[#f7faf9] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl sm:p-7"
            >
              <span
                className="pointer-events-none absolute right-5 top-3 select-none text-[5rem] font-black leading-none text-emerald-600/10"
                aria-hidden
              >
                "
              </span>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                <i className="icon-[lucide--trending-up] h-3 w-3" aria-hidden />
                {t.highlight}
              </span>
              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i
                    key={i}
                    className="icon-[lucide--star] h-4 w-4 fill-current text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-pretty text-[0.9375rem] font-medium leading-relaxed text-[#0d212c]">
                "{t.quote}"
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0a1e14] text-xs font-black text-lime-300">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0a1e14]">{t.author}</p>
                  <p className="text-xs text-slate-400">{t.company}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

/** Seguridad — contenedor flotante verde profundo de marca. */
function SecuritySection() {
  const { openCalendly } = useCalendlyGate();
  const reduced = useReducedMotion();
  const reveal = useInViewReveal();
  return (
    <section className="scroll-mt-24 bg-white px-4 py-8 sm:px-6 sm:py-12" id="seguridad">
      <motion.div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#0a1e14] px-6 py-14 sm:px-10 sm:py-16 md:px-14 md:py-20"
        {...reveal}
      >
        <LineGridPattern dark />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-lime-300/[0.08] motion-safe:animate-slowSpin"
          style={{ animationDuration: "60s" }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-lime-300/40" />
        </div>
        <div
          className="pointer-events-none absolute right-0 top-0 h-[380px] w-[380px] opacity-20 blur-[110px]"
          style={{ background: "rgba(163,230,53,0.3)" }}
          aria-hidden
        />

        <div className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <SectionEyebrow dark>Seguridad y privacidad</SectionEyebrow>
            <h2 className="mt-4 text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
              Seguridad de nivel empresarial
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
              Confidencialidad, gobernanza y comunicación segura entre todas
              las partes.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Cifrado en tránsito y en reposo",
                "ISO 37002 (buenas prácticas)",
                "Directiva UE 2019/1937",
              ].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-lime-300/25 bg-lime-300/[0.08] px-3.5 py-1.5 text-xs font-semibold text-lime-200"
                >
                  <i
                    className="icon-[lucide--shield-check] h-3.5 w-3.5 shrink-0"
                    aria-hidden
                  />
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={(e) => {
                trackGA4Event("landing_cta_click", {
                  cta_name: "security_expert",
                  placement: "security",
                });
                openCalendly(e);
              }}
              className="group mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
            >
              Hablar con un experto
              <i
                className="icon-[lucide--arrow-right] h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </div>

          <motion.div
            className="grid gap-3 sm:grid-cols-2 sm:gap-4"
            initial={reduced === true ? false : "hidden"}
            whileInView={reduced === true ? undefined : "visible"}
            viewport={LANDING_VIEWPORT}
            variants={STAGGER_CONTAINER}
          >
            {SECURITY_CARDS.map((feat) => (
              <motion.article
                key={feat.title}
                variants={reduced === true ? undefined : STAGGER_ITEM}
                onMouseMove={handleSpotlightMove}
                style={SPOTLIGHT_INITIAL_STYLE}
                className="group relative isolate overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-lime-300/25 hover:bg-white/[0.07] sm:p-5"
              >
                <SpotlightGlow color="rgba(163,230,53,0.14)" />
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/[0.12] shadow-[0_10px_20px_rgba(163,230,53,0.15)]">
                  <i
                    className={`${feat.icon} h-5 w-5 text-lime-300`}
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
        </div>
      </motion.div>
    </section>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function LandingV4() {
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
    <div className="min-h-screen bg-white">
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
        <ImpactStatsSection />
        <PainComparisonSection />
        <InteractiveDemoSection />
        <BentoSection />
        <IndustriesSection />
        <TestimonialsSection />
        <SecuritySection />
        <PricingSection />
        <FAQSection />
        <LeadMagnetBandSection />
      </main>

      <section className="border-t border-slate-200" aria-label="Siguiente paso">
        <FooterDemoCtaBand ctaName="closing_demo" placement="closing" />
      </section>
      <LandingMinimalFooter />
    </div>
  );
}
