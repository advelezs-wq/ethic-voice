"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  LANDING_VIEWPORT,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/modules/landig-page/lib/landingMotion";
import { SectionReveal } from "@/modules/landig-page/components/motion/SectionReveal";

const SERVICES = [
  {
    icon: "icon-[lucide--message-square-dot]",
    tag: "Canal ético",
    title: "Línea de Denuncia",
    desc: "Canal seguro y anónimo para reportes internos y externos. Incluye seguimiento en tiempo real.",
    href: "/servicios/linea-de-denuncia",
    featured: true,
  },
  {
    icon: "icon-[lucide--brain]",
    tag: "Inteligencia artificial",
    title: "MentorIA",
    desc: "Análisis predictivo con IA para identificar tendencias y prevenir incidentes éticos antes de que escalen.",
    href: "/servicios/mentoria",
    featured: false,
  },
  {
    icon: "icon-[lucide--search]",
    tag: "Auditoría",
    title: "Mystery Shopper Ético",
    desc: "Evaluaciones encubiertas para medir tu cumplimiento ético en puntos de contacto críticos.",
    href: "/servicios/mystery-shopper",
    featured: false,
  },
] as const;

function ServicesSectionBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(20,83,45,0.06)_0%,transparent_55%)]" />
      <svg
        className="absolute -right-[15%] top-1/2 h-[min(90%,520px)] w-[min(85%,700px)] -translate-y-1/2 opacity-[0.35] md:right-0 md:opacity-45"
        viewBox="0 0 600 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          stroke="#0a1f14"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.25"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M40 420 C180 280 380 480 560 320" />
          <path d="M0 200 C200 80 400 260 600 120" />
          <path d="M80 480 C220 360 400 440 580 380" opacity="0.6" />
        </g>
      </svg>
      <svg
        className="absolute -left-[10%] bottom-0 h-40 w-[min(100%,480px)] opacity-30 sm:h-48"
        viewBox="0 0 400 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          stroke="#a3e635"
          strokeWidth="1"
          strokeLinecap="round"
          className="opacity-40"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M0 120 Q100 60 200 100 T400 80" />
          <path d="M0 140 Q120 90 240 120 T400 100" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}

function ServiceCard({ s }: { s: (typeof SERVICES)[number] }) {
  const featured = s.featured;

  const inner = (
    <>
      {featured ? (
        <>
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime-400/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 0v24H0' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div className="relative flex h-full min-h-[280px] flex-col justify-between p-6 sm:p-8 lg:min-h-[320px]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-300/90 sm:text-xs">
                {s.tag}
              </p>
              <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/15 ring-1 ring-lime-400/30 sm:h-16 sm:w-16">
                <i className={`${s.icon} h-7 w-7 text-lime-400 sm:h-8 sm:w-8`} />
              </div>
              <h3 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                {s.title}
              </h3>
              <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-white/75 sm:text-base">
                {s.desc}
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-lime-400">
              <span>Explorar servicio</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 text-[#0a1f14] transition-transform duration-200 group-hover:translate-x-0.5">
                <i className="icon-[lucide--arrow-right] h-4 w-4" />
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="relative flex h-full flex-col p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0a1f14] shadow-inner shadow-black/10 sm:h-12 sm:w-12">
            <i className={`${s.icon} h-5 w-5 text-white sm:h-6 sm:w-6`} />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0a1f14]/70 sm:text-[11px]">
            {s.tag}
          </p>
          <h3 className="mt-2 text-lg font-bold text-gray-900 sm:text-xl">
            {s.title}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 sm:text-[0.9375rem]">
            {s.desc}
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-xs font-semibold text-[#0a1f14]">Ver más</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a1f14] text-white transition-colors group-hover:bg-[#0a1f14]/80">
              <i className="icon-[lucide--arrow-right] h-4 w-4" />
            </span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <Link
      href={s.href}
      className={`group relative block h-full overflow-hidden rounded-3xl border transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a1f14] ${
        featured
          ? "border-lime-400/20 bg-[#0a1f14] shadow-xl shadow-[#0a1f14]/25 ring-1 ring-white/10 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#0a1f14]/35"
          : "border-gray-200/90 bg-white/90 shadow-md shadow-gray-200/40 ring-1 ring-black/[0.03] backdrop-blur-sm hover:-translate-y-0.5 hover:border-[#0a1f14]/15 hover:shadow-lg"
      }`}
    >
      {inner}
    </Link>
  );
}

export const ServicesSection = () => {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#fafcfa] to-white px-4 py-12 sm:px-6 sm:py-14 md:py-16 lg:px-8">
      <ServicesSectionBg />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <SectionReveal className="mb-8 text-center sm:mb-10 md:mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/80">
            Servicios
          </p>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
            Nuestros servicios éticos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Tres pilares para blindar cultura, datos y puntos de contacto con tu
            organización.
          </p>
        </SectionReveal>

        <motion.div
          className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 md:grid-rows-2 md:gap-5 lg:gap-6"
          variants={staggerContainerVariants(!!reduce)}
          initial="hidden"
          whileInView="visible"
          viewport={LANDING_VIEWPORT}
        >
          {SERVICES.map((s) => {
            const mdPlacement = s.featured
              ? "md:col-start-2 md:row-start-1 md:row-span-2"
              : s.href === "/servicios/mentoria"
                ? "md:col-start-1 md:row-start-1"
                : "md:col-start-1 md:row-start-2";
            return (
              <motion.div
                key={s.title}
                variants={staggerItemVariants(!!reduce)}
                className={`min-h-0 ${mdPlacement}`}
              >
                <ServiceCard s={s} />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
