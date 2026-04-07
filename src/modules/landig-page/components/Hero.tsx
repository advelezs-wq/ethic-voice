"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useIsClient } from "@/modules/app/hooks/useIsClient";
import { VideoModal } from "./VideoModal";

declare global {
  interface Window {
    Calendly?: { initPopupWidget: (options: { url: string }) => void };
  }
}

/** Arcos concéntricos esquina superior izquierda — acento lima */
function HeroDecorTopLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g
        className="text-lime-400/50 drop-shadow-[0_0_12px_rgba(163,230,53,0.35)]"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      >
        <path d="M-20 200 A 180 180 0 0 1 160 20" />
        <path d="M-20 220 A 200 200 0 0 1 180 20" />
        <path d="M-20 240 A 220 220 0 0 1 200 20" />
        <path d="M40 260 A 140 140 0 0 1 160 120" opacity="0.7" />
      </g>
    </svg>
  );
}

/** Curvas en la zona de transición inferior */
function HeroDecorBottomFlow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden
    >
      <g
        className="text-lime-400/35 drop-shadow-[0_0_10px_rgba(163,230,53,0.25)]"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M0 85 Q 200 40 400 70 T 800 55 T 1200 75" />
        <path d="M0 105 Q 280 60 520 95 T 1000 80 T 1200 100" opacity="0.8" />
        <path d="M0 65 Q 150 20 350 50 T 700 35 T 1200 55" opacity="0.6" />
      </g>
    </svg>
  );
}

export const Hero = () => {
  const isClient = useIsClient();
  const calendlyUrl =
    "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1";

  const openCalendlyPopup = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (isClient && typeof window !== "undefined" && window.Calendly) {
      window.Calendly.initPopupWidget({ url: calendlyUrl });
    } else {
      window.open(calendlyUrl, "_blank");
    }
  };

  return (
    <section className="relative min-h-[min(480px,88svh)] overflow-x-clip bg-[#0a1f14] pt-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(22,101,52,0.35)_0%,transparent_55%)]"
        aria-hidden
      />

      <HeroDecorTopLeft className="pointer-events-none absolute -left-4 top-16 z-[1] h-48 w-56 opacity-90 sm:top-20 sm:h-56 sm:w-64 md:left-0 md:top-24" />

      <HeroDecorBottomFlow className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-16 w-full opacity-80 sm:h-20 md:h-24" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 md:min-h-[min(440px,82svh)] md:flex-row md:items-center md:justify-between md:gap-10 md:py-10 lg:gap-14 lg:px-8 lg:pb-14 lg:pt-12">
        {/* Texto — columna izquierda */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="flex w-full max-w-lg shrink-0 flex-col items-center justify-center text-center md:max-w-[min(100%,28rem)] md:flex-1 md:items-start md:text-left lg:max-w-xl"
        >
          <h1 className="text-balance text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[2.65rem] lg:text-5xl">
            Transformamos la{" "}
            <span className="text-lime-400">Ética</span> en{" "}
            <span className="text-lime-400">Acción</span>
          </h1>

          <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-white/80 sm:mt-5 sm:text-base md:max-w-md">
            Cumplimiento proactivo, sin fricción: tu equipo al centro, con
            datos claros y decisiones más rápidas.
          </p>

          <div className="mt-6 flex w-full justify-center sm:mt-8 md:justify-start">
            <Link
              href=""
              onClick={openCalendlyPopup}
              className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-[0_0_24px_rgba(190,242,100,0.35)] transition hover:bg-lime-300 sm:px-7 sm:text-base"
            >
              Agendar prueba gratis
            </Link>
          </div>
        </motion.div>

        {/* Video — columna derecha, centrada en la fila */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="flex w-full shrink-0 justify-center md:flex-1 md:justify-end"
        >
          <div className="relative w-full max-w-md lg:max-w-lg">
            <VideoModal
              videoSrc="/demo-video.mp4"
              posterSrc="/platform/ethicvoice-hero.jpeg"
              className="h-64 shadow-2xl shadow-green-950/50 sm:h-72 md:h-80 lg:h-96"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
