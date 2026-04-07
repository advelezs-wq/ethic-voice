"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { VideoModal } from "./VideoModal";

/** Ciclo cerrado (inicio = fin) para bucle infinito sin saltos — sensación de oleaje */
const topWaveTimes = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1] as const;

/** Curvas de flujo esquina superior izquierda — oleaje sutil infinito */
function HeroDecorTopLeft({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  const strokes = [
    { d: "M0 0 C 60 40 140 60 240 130 S 360 200 420 260" },
    { d: "M0 20 C 70 55 160 80 260 150 S 380 220 420 280" },
    { d: "M0 45 C 50 80 120 100 210 165 S 340 235 400 300", opacity: 0.75 },
    { d: "M0 70 C 40 100 100 120 180 180 S 300 245 370 305", opacity: 0.5 },
  ] as const;

  return (
    <svg
      className={className}
      viewBox="0 0 420 320"
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
        {strokes.map((s, i) => {
          const phase = i * 0.9;
          const ax = 2.2 + i * 0.35;
          const ay = 2.8 + i * 0.25;
          const r = 0.22 + i * 0.06;
          return (
            <motion.g
              key={i}
              style={{ transformOrigin: "0px 0px", willChange: "transform" }}
              animate={
                reduceMotion
                  ? {}
                  : {
                      x: [
                        0,
                        ax,
                        ax * 0.4,
                        -ax * 0.5,
                        -ax,
                        -ax * 0.35,
                        ax * 0.45,
                        ax * 0.15,
                        0,
                      ],
                      y: [
                        0,
                        -ay * 0.35,
                        -ay,
                        -ay * 0.55,
                        ay * 0.2,
                        ay,
                        ay * 0.65,
                        -ay * 0.25,
                        0,
                      ],
                      rotate: [
                        0,
                        r,
                        r * 0.5,
                        -r * 0.4,
                        -r,
                        -r * 0.3,
                        r * 0.6,
                        r * 0.2,
                        0,
                      ],
                    }
              }
              transition={{
                duration: 14 + i * 1.8,
                repeat: Infinity,
                ease: "linear",
                delay: phase,
                times: [...topWaveTimes],
              }}
            >
              <path d={s.d} opacity={"opacity" in s ? s.opacity : 1} />
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
}

const bottomWaveTimes = [0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1] as const;

/** Curvas inferiores — oleaje horizontal suave e infinito */
function HeroDecorBottomFlow({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  const strokes = [
    { d: "M0 85 Q 200 40 400 70 T 800 55 T 1200 75" },
    { d: "M0 105 Q 280 60 520 95 T 1000 80 T 1200 100", opacity: 0.8 },
    { d: "M0 65 Q 150 20 350 50 T 700 35 T 1200 55", opacity: 0.6 },
  ] as const;

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
        {strokes.map((s, i) => {
          const phase = i * 0.55;
          const yAmp = 2.8 + i * 0.6;
          const xAmp = 5 + i * 1.2;
          return (
            <motion.g
              key={i}
              style={{
                transformOrigin: "600px 88px",
                willChange: "transform",
              }}
              animate={
                reduceMotion
                  ? {}
                  : {
                      y: [
                        0,
                        -yAmp * 0.4,
                        -yAmp,
                        -yAmp * 0.55,
                        yAmp * 0.35,
                        yAmp * 0.9,
                        yAmp * 0.25,
                        0,
                      ],
                      x: [
                        0,
                        xAmp * 0.5,
                        xAmp,
                        xAmp * 0.2,
                        -xAmp * 0.45,
                        -xAmp * 0.85,
                        -xAmp * 0.15,
                        0,
                      ],
                    }
              }
              transition={{
                duration: 11 + i * 1.4,
                repeat: Infinity,
                ease: "linear",
                delay: phase,
                times: [...bottomWaveTimes],
              }}
            >
              <path d={s.d} opacity={"opacity" in s ? s.opacity : 1} />
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
}

export const Hero = () => {
  const { openCalendly } = useCalendlyGate();

  return (
    <section className="relative min-h-[min(480px,88svh)] overflow-x-clip bg-[#0a1f14] pt-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(22,101,52,0.35)_0%,transparent_55%)]"
        aria-hidden
      />

      <HeroDecorTopLeft className="pointer-events-none absolute -left-2 top-14 z-[1] h-56 w-72 opacity-85 sm:top-16 sm:h-64 sm:w-80 md:left-0 md:top-20 md:h-72 md:w-96" />

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
            <button
              type="button"
              onClick={openCalendly}
              className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-[0_0_24px_rgba(190,242,100,0.35)] transition hover:bg-lime-300 sm:px-7 sm:text-base"
            >
              Agendar prueba gratis
            </button>
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
