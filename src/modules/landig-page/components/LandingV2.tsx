"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";
import { StickyCalendlyToast } from "@/modules/landig-page/components/StickyCalendlyToast";
import { VideoModal } from "@/modules/landig-page/components/VideoModal";
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

const complianceTargets = [
  {
    icon: "icon-[lucide--building-2]",
    title: "Empresas con 50+ colaboradores",
    desc: "Ayuda a responder exigencias de normativa local y marcos internacionales de whistleblowing.",
  },
  {
    icon: "icon-[lucide--landmark]",
    title: "Entidades públicas y reguladas",
    desc: "Diseño orientado a trazabilidad, plazos y evidencias para auditoría y control interno.",
  },
  {
    icon: "icon-[lucide--briefcase-business]",
    title: "Grupos corporativos y multisede",
    desc: "Canal unificado con reglas por país, área y responsables de investigación.",
  },
];

const valueHighlights = [
  { icon: "icon-[lucide--shield-check]", label: "Confidencialidad y anonimato real" },
  { icon: "icon-[lucide--messages-square]", label: "Comunicación bidireccional con el denunciante" },
  { icon: "icon-[lucide--clock-3]", label: "Control de SLA y vencimientos legales" },
  { icon: "icon-[lucide--chart-column]", label: "Tableros e indicadores gerenciales" },
];

const modules = [
  {
    icon: "icon-[lucide--file-warning]",
    title: "Recepción multicanal",
    desc: "Web 24/7, formularios configurables y registro centralizado por tipología y severidad.",
  },
  {
    icon: "icon-[lucide--users-round]",
    title: "Backoffice de investigaciones",
    desc: "Asignación por roles, tareas, comentarios, evidencias y línea de tiempo del caso.",
  },
  {
    icon: "icon-[lucide--badge-check]",
    title: "Seguimiento de cumplimiento",
    desc: "Estados, hitos y respuestas para que cada caso avance sin perder gobernanza.",
  },
  {
    icon: "icon-[lucide--bar-chart-3]",
    title: "Reportes ejecutivos",
    desc: "Métricas por área, tiempo de cierre, tendencias y visión para comité de ética.",
  },
  {
    icon: "icon-[lucide--languages]",
    title: "Experiencia para equipos diversos",
    desc: "Soporte multiidioma y adaptación del canal según contexto organizacional.",
  },
  {
    icon: "icon-[lucide--graduation-cap]",
    title: "Onboarding y adopción",
    desc: "Acompañamiento de implementación, lanzamiento interno y buenas prácticas de uso.",
  },
];

const processSteps = [
  {
    icon: "icon-[lucide--send]",
    title: "1. Recibe reportes de forma segura",
    desc: "El denunciante envía información y evidencia sin exponer su identidad cuando aplica.",
  },
  {
    icon: "icon-[lucide--list-checks]",
    title: "2. Prioriza y asigna investigación",
    desc: "Clasificación por riesgo, asignación a responsables y plan de acción con fechas.",
  },
  {
    icon: "icon-[lucide--messages-square]",
    title: "3. Da seguimiento y solicita contexto",
    desc: "Comunicación bidireccional para completar información y sostener trazabilidad.",
  },
  {
    icon: "icon-[lucide--check-check]",
    title: "4. Cierra con evidencia y aprendizajes",
    desc: "Documentación final, decisiones, lecciones y reportes para prevención futura.",
  },
];

const comparisonColumns = [
  {
    title: "Canales internos improvisados",
    points: ["Baja confianza para denunciar", "Sin trazabilidad de acciones", "Difícil medir tiempos y resultados"],
  },
  {
    title: "EthicVoice",
    points: ["Flujo estructurado de casos", "Seguridad y permisos por rol", "Indicadores para comité y liderazgo"],
    highlight: true,
  },
  {
    title: "Herramientas no especializadas",
    points: ["Operación manual intensa", "Sin enfoque normativo/compliance", "Menor capacidad de seguimiento"],
  },
];

const planOrder = [PlanType.STARTER, PlanType.GROW, PlanType.GROW_PRO, PlanType.PREMIUM] as const;

const testimonials = [
  {
    quote:
      "La implementación fue rápida y el comité ganó visibilidad real del estado de cada caso.",
    author: "Gerencia de Cumplimiento",
    company: "Empresa de servicios regional",
  },
  {
    quote:
      "Pasamos de correos sueltos a un proceso auditable con seguimiento claro y menos fricción.",
    author: "Dirección de Auditoría Interna",
    company: "Grupo corporativo",
  },
  {
    quote:
      "La comunicación confidencial con denunciantes mejoró la calidad de las investigaciones.",
    author: "Responsable de Ética",
    company: "Compañía multisitio",
  },
];

const legacyHeroBrands = [
  { name: "LaBrutal", src: "/ethic-brands/la_brutal.png" },
  { name: "Progress Consulting Group", src: "/ethic-brands/progress.png" },
  { name: "Valor Estratégico", src: "/ethic-brands/valor_estrategico.webp" },
  { name: "Norvik Tech", src: "/ethic-brands/norvik_logo.webp" },
  { name: "Universal Emerald", src: "/ethic-brands/universal_emerald.png" },
] as const;

const faqs = [
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
    q: "¿Puedo conversar con la persona denunciante sin revelar identidad?",
    a: "Sí. El flujo contempla comunicación bidireccional dentro del caso para pedir contexto adicional y dar seguimiento.",
  },
  {
    q: "¿Incluye analítica para comité o compliance?",
    a: "Sí. Puedes revisar estado de casos, tiempos de atención, tipologías y tendencias para tomar decisiones con evidencia.",
  },
];

function HeroSection({ variant }: { variant: LandingVariant }) {
  const { openCalendly } = useCalendlyGate();
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const heroTitle =
    variant === "trust"
      ? "Simplifica cumplimiento. Fortalece cultura."
      : "Hacer lo correcto, ahora más fácil.";
  const heroSub =
    variant === "trust"
      ? "Pon a compliance en el centro con una plataforma visual que transforma denuncias en decisiones accionables."
      : "Tecnología para equipos de ética y cumplimiento que quieren operar con control, rapidez y trazabilidad.";

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
        if (!cancelled) {
          void bgVideoRef.current?.play().catch(() => {});
        }
      });
    });

    return () => {
      cancelled = true;
      hlsInstance?.destroy();
      if (video) video.pause();
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-white px-4 pb-14 pt-4 sm:px-6 sm:pb-16 sm:pt-6 md:pt-8">
      <video
        ref={bgVideoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
        style={{
          filter: "grayscale(0.25) brightness(1.35) contrast(0.55) saturate(0.7)",
          mixBlendMode: "multiply",
        }}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 45%, rgba(255,255,255,0.62) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(0deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 38%, rgba(255,255,255,0.58) 100%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        {[25, 50, 75].map((left) => (
          <div
            key={left}
            className="absolute bottom-0 top-0 w-px bg-black/[0.08]"
            style={{ left: `${left}%`, transform: "translateX(-50%)" }}
          />
        ))}
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-0 z-[1] w-[min(140%,1200px)] -translate-x-1/2"
        aria-hidden
      >
        <svg
          viewBox="0 0 1200 200"
          className="w-full"
          style={{ filter: "blur(25px)" }}
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="ethicHeroGlow" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="rgba(94,210,156,0.22)" />
              <stop offset="45%" stopColor="rgba(45,212,191,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="600" cy="80" rx="520" ry="120" fill="url(#ethicHeroGlow)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="animate-fade-in-up lg:col-span-7" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <h1 className="text-[3.15rem] font-semibold leading-[1.02] tracking-tight text-[#051a24] sm:text-6xl md:text-7xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#273c46] md:mt-6 md:text-xl">
              {heroSub}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  trackGA4Event("landing_cta_click", { cta_name: "hero_demo", placement: "hero" });
                  openCalendly(e);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-400 px-7 py-3 text-sm font-semibold text-[#052b24] shadow-[0_1px_2px_0_rgba(5,26,36,0.1),0_4px_4px_0_rgba(5,26,36,0.09),0_9px_6px_0_rgba(5,26,36,0.05),inset_0_2px_8px_0_rgba(255,255,255,0.45)] transition-colors hover:bg-lime-500 sm:w-auto"
              >
                Agendar demo
                <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollToId("#como-funciona")}
                className="w-full rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#051a24] shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_30px_rgba(0,0,0,0.08)] transition-opacity hover:opacity-80 sm:w-auto"
              >
                Descubrir producto
              </button>
              <Link
                href="/submit"
                onClick={() =>
                  trackGA4Event("landing_cta_click", {
                    cta_name: "hero_report",
                    placement: "hero",
                  })
                }
                className="inline-flex w-full items-center justify-center rounded-full border-2 border-[#051a24] bg-white px-7 py-3 text-sm font-semibold text-[#051a24] transition-colors hover:bg-[#051a24]/[0.04] sm:w-auto"
              >
                Denunciar
              </Link>
            </div>
          </div>

          <div className="animate-fade-in-up lg:col-span-5" style={{ animationDelay: "0.35s", opacity: 0 }}>
            <p className="max-w-xl text-base leading-relaxed text-[#273c46] md:text-lg">
              Ponemos a los equipos de cumplimiento al centro con una solución que impulsa cultura de integridad, simplifica flujos y reduce riesgo organizacional.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 md:mt-6 md:gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#273c46]">
                Fast implementation
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up mt-8 grid gap-4 md:mt-10 lg:grid-cols-12" style={{ animationDelay: "0.5s", opacity: 0 }}>
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-green-900/15 lg:col-span-8">
            <VideoModal
              videoSrc="/demo-video.mp4"
              posterSrc="/platform/ethicvoice-hero-frame.jpg"
              className="h-[250px] w-full rounded-none sm:h-[320px] md:h-[460px] lg:h-[520px]"
            />
          </article>

          <article className="relative hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/25 md:block lg:col-span-4">
            <Image
              src="/platform/impulsed-by-ai.jpeg"
              alt="Asistente Andi impulsado por IA en EthicVoice"
              width={960}
              height={1280}
              className="h-[460px] w-full object-cover lg:h-[520px]"
              priority
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#051a24]/65 via-[#051a24]/25 to-transparent p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-300">Compliance team</p>
              <p className="mt-1 text-sm text-white/90">Investigación, seguimiento y decisiones con trazabilidad.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function LogoProofSection() {
  const hasOddAmount = legacyHeroBrands.length % 2 !== 0;

  return (
    <section className="border-t border-slate-200 bg-white py-8 sm:py-9">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p className="mb-4 text-center text-[11px] uppercase tracking-[0.22em] text-slate-500 sm:mb-5 sm:text-xs">
          Equipos que ya confían en EthicVoice
        </p>
        <div className="grid grid-cols-2 gap-2.5 text-center sm:gap-3 md:grid-cols-5">
          {legacyHeroBrands.map((brand, index) => (
            <div
              key={brand.name}
              className={`rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:px-4 ${
                hasOddAmount && index === legacyHeroBrands.length - 1
                  ? "col-span-2 mx-auto w-full max-w-[280px] md:col-span-1 md:max-w-none"
                  : ""
              }`}
              title={brand.name}
            >
              <div className="flex h-8 w-full items-center justify-center opacity-75 grayscale transition-opacity hover:opacity-95 sm:h-9">
                <Image
                  src={brand.src}
                  alt={brand.name}
                  width={130}
                  height={36}
                  className="max-h-8 w-auto max-w-full object-contain sm:max-h-9"
                  sizes="(max-width: 767px) 120px, 130px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingV2() {
  const phone = process.env.NEXT_PUBLIC_WPP_NUMBER || "";
  const cookie = useCookieConsentOptional();
  const allowFunctional = cookie?.hydrated && !!cookie.consent?.functional && !cookie.needsInteraction;
  const { openCalendly } = useCalendlyGate();
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
            mainEntity: faqs.map((item) => ({
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
          chatMessage={"Hola! ¿Cómo puedo ayudarte con tu canal de denuncias?"}
          className="floating-whatsapp ev-floating-whatsapp"
        />
      )}
      <StickyCalendlyToast />

      <main className="pb-28 pt-16 sm:pt-[4.5rem]">
        <HeroSection variant={variant} />
        <LogoProofSection />

        <MarketingSectionV2
          id="solucion"
          eyebrow="Cumplimiento y valor"
          title="Diseñado para una línea ética completa"
          subtitle="Estructura inspirada en estándares de mercado: cumplimiento, seguridad, facilidad de uso y trazabilidad operativa."
        >
          <section className="relative overflow-hidden rounded-[32px] border border-emerald-700/30 bg-gradient-to-br from-[#06251f] via-[#05382f] to-[#052b24] p-6 shadow-[0_30px_80px_-30px_rgba(6,37,31,0.8)] md:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 10%, rgba(94,210,156,0.25), transparent 42%), radial-gradient(circle at 85% 0%, rgba(45,212,191,0.2), transparent 35%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(120deg, transparent 0 22px, rgba(255,255,255,0.05) 22px 23px)",
              }}
            />

            <div className="relative z-10 grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/85">Features</p>
                <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white md:text-[44px]">
                  Plataforma integral de ética y cumplimiento
                </h3>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      trackGA4Event("landing_cta_click", { cta_name: "solution_demo", placement: "solution" });
                      openCalendly(e);
                    }}
                    className="rounded-full bg-white px-5 py-2 text-sm font-medium text-[#052b24] transition-opacity hover:opacity-85"
                  >
                    Book a demo
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToId("#como-funciona")}
                    className="rounded-full border border-white/45 px-5 py-2 text-sm font-medium text-white transition-colors hover:border-emerald-300 hover:text-emerald-200"
                  >
                    Discover platform features
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                {complianceTargets.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
                  >
                    <i className={`${item.icon} h-7 w-7 text-emerald-300`} aria-hidden />
                    <h4 className="mt-3 text-base font-bold text-white">{item.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{item.desc}</p>
                  </article>
                ))}
                <article className="rounded-2xl border border-emerald-300/30 bg-emerald-300/[0.14] p-5">
                  <p className="text-sm font-semibold text-emerald-100">Canal visual, rápido y accionable</p>
                  <div className="mt-3 space-y-2">
                    {valueHighlights.slice(0, 2).map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs font-medium text-white">
                        <i className={`${item.icon} h-3.5 w-3.5 text-emerald-200`} aria-hidden />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>

            <div className="relative z-10 mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {valueHighlights.map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-[64px] items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm font-medium leading-snug text-white/95"
                >
                  <i className={`${item.icon} mt-0.5 h-4 w-4 shrink-0 text-emerald-300`} aria-hidden />
                  <span className="text-[13px] sm:text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </section>
          <div className="mt-6 text-center text-sm text-[#273c46]">
            Diseñada para que cualquier usuario entienda rápidamente el valor de EthicVoice desde el primer vistazo.
          </div>
        </MarketingSectionV2>

        <MarketingSectionV2
          id="como-funciona"
          eyebrow="Cómo funciona"
          title="Flujo de gestión de denuncias en 4 etapas"
          subtitle="Para evitar pérdida de información, retrasos y procesos sin evidencia."
        >
          <div className="relative">
            <div
              className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-lime-200 via-lime-400/60 to-lime-200 lg:block"
              aria-hidden
            />

            <div className="space-y-5 md:space-y-6">
              {processSteps.map((step, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={step.title}
                    className={`relative grid items-center gap-4 lg:grid-cols-12 ${isEven ? "" : "lg:[&>*:first-child]:order-2"}`}
                  >
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_22px_rgba(0,0,0,0.06)] lg:col-span-5">
                      <div className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lime-700">
                        Etapa {idx + 1}
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-[#0d212c]">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#273c46]">{step.desc}</p>
                    </article>

                    <div className="hidden items-center justify-center lg:col-span-2 lg:flex">
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-lime-500 bg-white text-lime-700 shadow-[0_0_0_6px_rgba(132,204,22,0.12)]">
                        <i className={`${step.icon} h-5 w-5`} aria-hidden />
                        <span className="absolute -bottom-7 text-[11px] font-semibold text-slate-500">
                          {idx + 1}/4
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 lg:col-span-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Resultado de la etapa
                      </p>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-start gap-2 text-sm text-[#273c46]">
                          <i className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 text-lime-600" aria-hidden />
                          Registro estructurado y trazable de acciones.
                        </li>
                        <li className="flex items-start gap-2 text-sm text-[#273c46]">
                          <i className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 text-lime-600" aria-hidden />
                          Menor fricción entre denuncia, investigación y cierre.
                        </li>
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </MarketingSectionV2>

        <MarketingSectionV2
          eyebrow="Funcionalidades clave"
          title="Qué recibe tu organización con EthicVoice"
          subtitle="Diseño visual e intuitivo para que el usuario entienda rápidamente qué ofrece la plataforma."
          guides={[16, { percent: 50, accent: true }, 84]}
          surface
        >
          <section className="grid gap-5 lg:grid-cols-12">
            <article className="rounded-[28px] border border-lime-200 bg-gradient-to-br from-lime-50 via-white to-emerald-50 p-6 shadow-[0_10px_26px_rgba(0,0,0,0.06)] lg:col-span-5 lg:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-700">Vista general</p>
              <h3 className="mt-3 text-2xl font-bold leading-tight text-[#0d212c] md:text-[30px]">
                Una plataforma, seis capacidades para operar tu línea ética sin fricción
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#273c46] md:text-base">
                En lugar de herramientas aisladas, EthicVoice conecta recepción, investigación,
                seguimiento y analítica en un flujo continuo para compliance y comité.
              </p>
              <div className="mt-6 space-y-2.5">
                {[
                  "Más claridad para el equipo investigador",
                  "Menos tareas manuales y más trazabilidad",
                  "Mejor experiencia para denunciantes y responsables",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2 text-sm text-[#0d212c]">
                    <i className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-lime-600" aria-hidden />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {modules.map((item, idx) => (
                <article
                  key={item.title}
                  className={`rounded-2xl border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-0.5 ${
                    idx % 3 === 0
                      ? "border-emerald-200 bg-emerald-50/60"
                      : idx % 3 === 1
                        ? "border-lime-200 bg-lime-50/60"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 ring-1 ring-slate-200">
                    <i className={`${item.icon} h-5 w-5 text-lime-700`} aria-hidden />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[#0d212c]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#273c46]">{item.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
            {[
              { label: "Canal activo", value: "24/7" },
              { label: "Modelo de operación", value: "Multicanal" },
              { label: "Enfoque", value: "Cumplimiento + Cultura" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-lg font-bold text-[#0d212c]">{kpi.value}</p>
              </div>
            ))}
          </div>
        </MarketingSectionV2>

        <MarketingSectionV2
          id="seguridad"
          eyebrow="Seguridad y privacidad"
          title="Canal seguro, anónimo y auditable"
          subtitle="Con enfoque de protección de datos, gobernanza y comunicación segura entre las partes."
        >
          <section className="relative overflow-hidden rounded-[32px] border border-emerald-700/30 bg-gradient-to-br from-[#051b16] via-[#07352b] to-[#051f1a] p-6 shadow-[0_30px_80px_-30px_rgba(6,37,31,0.8)] md:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 15%, rgba(94,210,156,0.24), transparent 42%), radial-gradient(circle at 85% 0%, rgba(45,212,191,0.2), transparent 35%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(125deg, transparent 0 24px, rgba(255,255,255,0.05) 24px 25px)",
              }}
            />

            <div className="relative z-10 grid gap-4 lg:grid-cols-12">
              <article className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.12] p-6 lg:col-span-5">
                <i className="icon-[lucide--shield-check] h-8 w-8 text-emerald-300" aria-hidden />
                <h3 className="mt-4 text-2xl font-bold text-white">Privacidad, anonimato y control</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Estructura alineada con buenas prácticas de confidencialidad, permisos por rol y trazabilidad de acciones.
                </p>
                <div className="mt-5 inline-flex items-center rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  Seguridad orientada a compliance
                </div>
              </article>

              <article className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm lg:col-span-7">
                <ul className="grid gap-3 text-sm text-white/90 sm:grid-cols-2">
                  <li className="flex gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <i className="icon-[lucide--circle-check] h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span>Comunicación bidireccional segura tras el reporte.</span>
                  </li>
                  <li className="flex gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <i className="icon-[lucide--circle-check] h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span>Accesos segmentados para equipo investigador y comité.</span>
                  </li>
                  <li className="flex gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <i className="icon-[lucide--circle-check] h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span>Registro histórico de actividades del caso.</span>
                  </li>
                  <li className="flex gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <i className="icon-[lucide--circle-check] h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span>Capacidad de reportes para auditoría y seguimiento.</span>
                  </li>
                </ul>
              </article>
            </div>
          </section>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Modelo de acceso", value: "Por roles" },
              { label: "Visibilidad", value: "Trazable" },
              { label: "Comunicación", value: "Segura y continua" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                <p className="mt-1 text-base font-bold text-[#0d212c]">{item.value}</p>
              </div>
            ))}
          </div>
        </MarketingSectionV2>

        <MarketingSectionV2
          eyebrow="Comparativa de alternativas"
          title="EthicVoice frente a soluciones improvisadas"
          subtitle="La diferencia principal: pasar de recepción básica de denuncias a gestión profesional de casos."
          surface
        >
          <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(0,0,0,0.06)] md:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% -20%, rgba(132,204,22,0.18), transparent 45%)",
              }}
            />

            <div className="relative z-10 mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sin sistema</p>
                <p className="mt-1 text-sm font-bold text-[#0d212c]">Más riesgo operativo</p>
              </div>
              <div className="rounded-xl border border-lime-300 bg-lime-50 px-4 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lime-700">Con EthicVoice</p>
                <p className="mt-1 text-sm font-bold text-[#0d212c]">Más control y trazabilidad</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Resultado</p>
                <p className="mt-1 text-sm font-bold text-[#0d212c]">Mejores decisiones</p>
              </div>
            </div>

            <div className="relative z-10 grid gap-4 lg:grid-cols-12">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  <i className="icon-[lucide--triangle-alert] h-3.5 w-3.5" aria-hidden />
                  Riesgos comunes
                </div>
                <h3 className="mt-3 text-lg font-bold text-[#0d212c]">{comparisonColumns[0].title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {comparisonColumns[0].points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-[#273c46]">
                      <i className="icon-[lucide--x-circle] mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-lime-300/60 bg-gradient-to-br from-lime-50 via-white to-emerald-50 p-5 shadow-[0_10px_24px_rgba(132,204,22,0.2)] lg:col-span-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">
                  <i className="icon-[lucide--badge-check] h-3.5 w-3.5" aria-hidden />
                  Ventaja EthicVoice
                </div>
                <h3 className="mt-3 text-lg font-bold text-[#0d212c]">{comparisonColumns[1].title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {comparisonColumns[1].points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-[#273c46]">
                      <i className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-lime-700" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <i className="icon-[lucide--alert-circle] h-3.5 w-3.5" aria-hidden />
                  Limitaciones típicas
                </div>
                <h3 className="mt-3 text-lg font-bold text-[#0d212c]">{comparisonColumns[2].title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {comparisonColumns[2].points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-[#273c46]">
                      <i className="icon-[lucide--x-circle] mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Mayor confianza para reportar",
              "Mejor tiempo de respuesta",
              "Más evidencia para auditoría",
              "Menos operación manual",
            ].map((benefit) => (
              <div key={benefit} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-[#0d212c] shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
                {benefit}
              </div>
            ))}
          </div>
        </MarketingSectionV2>

        <MarketingSectionV2
          eyebrow="Testimonios"
          title="Resultados que los equipos sí perciben"
          subtitle="Evidencia operativa: más orden, más trazabilidad y mejor capacidad de respuesta."
          guides={[22, { percent: 50, accent: true }, 78]}
        >
          <section className="grid gap-5 lg:grid-cols-12">
            <article className="relative overflow-hidden rounded-[28px] border border-lime-300/45 bg-gradient-to-br from-lime-50 via-white to-emerald-50 p-7 shadow-[0_18px_38px_rgba(132,204,22,0.16)] lg:col-span-6">
              <div
                className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-lime-200/40 blur-3xl"
                aria-hidden
              />
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2 text-lime-700">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i key={i} className="icon-[lucide--star] h-4 w-4 fill-current" aria-hidden />
                  ))}
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">Testimonio destacado</span>
                </div>
                <p className="text-[22px] leading-tight text-[#0d212c] md:text-[28px]">
                  "{testimonials[0].quote}"
                </p>
                <div className="mt-7 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d212c] text-xs font-bold text-white">
                    GC
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0d212c]">{testimonials[0].author}</p>
                    <p className="text-xs text-slate-500">{testimonials[0].company}</p>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
              {testimonials.slice(1).map((item, idx) => (
                <article
                  key={item.quote}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
                >
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <i className="icon-[lucide--badge-check] h-3.5 w-3.5 text-lime-600" aria-hidden />
                    Caso validado
                  </div>
                  <p className="text-sm leading-relaxed text-[#273c46]">"{item.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#0d212c]">
                      {idx === 0 ? "DA" : "RE"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0d212c]">{item.author}</p>
                      <p className="text-xs text-slate-500">{item.company}</p>
                    </div>
                  </div>
                </article>
              ))}
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Implementación", value: "Rápida" },
                    { label: "Percepción del comité", value: "Más control" },
                    { label: "Resultado común", value: "Mejor trazabilidad" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                      <p className="mt-1 text-sm font-bold text-[#0d212c]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <i className="icon-[lucide--messages-square] h-3.5 w-3.5 text-lime-600" aria-hidden />
              Equipos de cumplimiento
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <i className="icon-[lucide--shield-check] h-3.5 w-3.5 text-lime-600" aria-hidden />
              Contextos regulados
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <i className="icon-[lucide--chart-column] h-3.5 w-3.5 text-lime-600" aria-hidden />
              Mejora operativa medible
            </span>
          </div>
        </MarketingSectionV2>

        <MarketingSectionV2
          id="planes"
          eyebrow="Planes y escalabilidad"
          title="Planes EthicVoice para cada etapa de madurez"
          subtitle="Los mismos planes de nuestra página de precios, presentados aquí para comparación rápida."
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8">
            {planOrder
              .filter((p) => p !== PlanType.PREMIUM)
              .map((planType) => {
                const plan = PLAN_CONFIGS[planType];
                const isPopular = !!plan.isPopular;
                const employees =
                  plan.features.maxEmployees === -1
                    ? "Colaboradores ilimitados"
                    : `Hasta ${plan.features.maxEmployees} colaboradores`;

                return (
                  <article
                    key={planType}
                    className={`relative flex h-full min-h-[560px] flex-col rounded-xl bg-white p-6 shadow-lg transition-all duration-300 sm:p-7 md:p-8 ${
                      isPopular ? "border-2 border-green-500 shadow-2xl" : "border border-gray-200 hover:shadow-xl"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-md">
                          Recomendado
                        </span>
                      </div>
                    )}

                    <h3 className="text-2xl font-semibold text-gray-900">{plan.displayName}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{plan.description}</p>

                    <div className="mt-6 rounded-xl border border-gray-200 bg-slate-50 p-4 md:mt-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Precio</p>
                      <p className="mt-1 text-3xl font-extrabold text-gray-900 md:text-4xl">
                        ${plan.price.monthly}
                        <span className="ml-1 text-sm font-medium text-gray-600">USD / mes</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {plan.price.yearly ? `$${plan.price.yearly} USD / año` : "Plan anual disponible"}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-600">{employees}</p>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.highlights.slice(0, 6).map((item) => (
                        <li key={`${planType}-${item}`} className="flex items-start gap-2 text-sm text-[#273c46]">
                          <i className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-lime-600" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* flex-1 alinea el CTA al fondo; min-h asegura hueco mínimo respecto a la lista */}
                    <div className="min-h-8 flex-1" aria-hidden />

                    <button
                      type="button"
                      onClick={(e) => {
                        trackGA4Event("landing_cta_click", {
                          cta_name: `pricing_${planType.toLowerCase()}`,
                          placement: "pricing",
                        });
                        openCalendly(e);
                      }}
                      className={`w-full shrink-0 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 ${
                        isPopular
                          ? "bg-green-600 text-white shadow-lg hover:bg-green-700"
                          : "border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      }`}
                    >
                      Iniciar Sesion y Continuar
                    </button>
                  </article>
                );
              })}
          </div>

          {(() => {
            const enterprise = PLAN_CONFIGS[PlanType.PREMIUM];
            return (
              <div className="mx-auto mt-10 max-w-6xl">
                <article className="relative overflow-hidden rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-[#051a24] via-[#0d212c] to-[#052b24] p-8 shadow-2xl lg:p-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <div className="relative grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-5">
                      <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                        Plan personalizado
                      </span>
                      <h4 className="mt-4 text-3xl font-bold text-white">{enterprise.displayName}</h4>
                      <p className="mt-3 leading-relaxed text-white/80">{enterprise.description}</p>
                      <div className="mt-6 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">Precio</p>
                        <p className="mt-1 text-xl font-bold text-white">Bajo consulta</p>
                        <p className="mt-1 text-xs text-white/75">Implementacion segun alcance y complejidad</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          trackGA4Event("landing_cta_click", {
                            cta_name: "pricing_enterprise_consult",
                            placement: "pricing",
                          });
                          openCalendly(e);
                        }}
                        className="mt-6 w-full rounded-lg bg-white px-8 py-3 text-base font-bold text-[#052b24] shadow-lg transition-all duration-200 hover:bg-emerald-50 sm:w-auto"
                      >
                        Hablar con consultor
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
                      {enterprise.features.highlights.slice(0, 8).map((feature) => (
                        <div key={feature} className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                          <div className="flex items-start gap-3">
                            <i className="icon-[lucide--circle-check] mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                            <p className="text-sm leading-snug text-white/90">{feature}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            );
          })()}

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-xs font-medium text-lime-800">
              * Precios en USD. La configuración final depende del alcance de implementación.
            </span>
          </div>
        </MarketingSectionV2>

        <MarketingSectionV2 id="faq" eyebrow="FAQ" title="Preguntas frecuentes para implementar una línea ética" guides={[]}>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-slate-200 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-[#0d212c]">
                  {item.q}
                  <i className="icon-[lucide--chevron-right] h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="border-t border-slate-200 px-5 pb-4 pt-3 text-sm leading-relaxed text-[#273c46]">{item.a}</p>
              </details>
            ))}
          </div>
        </MarketingSectionV2>

      </main>

      <section className="border-t border-slate-200" aria-label="Siguiente paso">
        <FooterDemoCtaBand ctaName="closing_demo" placement="closing" />
      </section>
      <LandingMinimalFooter />
    </div>
  );
}
