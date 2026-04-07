"use client";

import React from "react";

const STEPS = [
  {
    label: "Paso 1",
    title: "Reporte",
    desc: "Recibe denuncias de múltiples canales de forma segura y anónima.",
    icon: "icon-[lucide--send]",
    visual: "square" as const,
  },
  {
    label: "Paso 2",
    title: "Análisis IA",
    desc: "Procesa y clasifica los datos para identificar riesgos y patrones.",
    icon: "icon-[lucide--brain-circuit]",
    visual: "ring" as const,
  },
  {
    label: "Paso 3",
    title: "Resolución",
    desc: "Gestiona y cierra casos con transparencia y seguimiento completo.",
    icon: "icon-[lucide--circle-check]",
    visual: "pill" as const,
  },
];

function HowItWorksDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute -right-[20%] top-0 h-[min(100%,420px)] w-[min(90%,520px)] opacity-[0.35]"
        viewBox="0 0 400 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 320 C120 200 200 280 360 80"
          stroke="#14532d"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M0 180 Q100 80 200 160 T400 120"
          stroke="#86efac"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.35"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg
        className="absolute -left-[15%] bottom-0 h-32 w-64 opacity-40 sm:h-40 sm:w-80"
        viewBox="0 0 320 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 100 Q80 40 160 90 T320 60"
          stroke="#14532d"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.25"
        />
      </svg>
    </div>
  );
}

function StepVisual({
  step,
  index,
  reverse,
}: {
  step: (typeof STEPS)[number];
  index: number;
  reverse: boolean;
}) {
  const n = String(index + 1).padStart(2, "0");
  const baseIcon = (
    <i className={`${step.icon} h-8 w-8 sm:h-9 sm:w-9`} aria-hidden />
  );

  let iconWrap: React.ReactNode;
  if (step.visual === "square") {
    iconWrap = (
      <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-green-800 text-white shadow-lg shadow-green-900/25 sm:h-[4.75rem] sm:w-[4.75rem]">
        {baseIcon}
      </div>
    );
  } else if (step.visual === "ring") {
    iconWrap = (
      <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-lime-100/90 text-green-900 ring-4 ring-lime-400/50 ring-offset-2 ring-offset-[#f5f3ee] sm:h-[4.75rem] sm:w-[4.75rem]">
        {baseIcon}
      </div>
    );
  } else {
    iconWrap = (
      <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-green-950 text-lime-300 shadow-inner sm:h-[4.75rem] sm:w-[4.75rem]">
        {baseIcon}
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 justify-center md:w-[42%] md:max-w-none ${
        reverse ? "md:justify-start" : "md:justify-end"
      }`}
    >
      <span
        className={`pointer-events-none absolute font-black leading-none text-green-900/[0.06] select-none sm:text-green-900/[0.08] ${
          reverse
            ? "right-0 top-1/2 -translate-y-1/2 text-[5.5rem] sm:text-[7rem]"
            : "left-0 top-1/2 -translate-y-1/2 text-[5.5rem] sm:text-[7rem]"
        }`}
        aria-hidden
      >
        {n}
      </span>
      <div className="relative z-[1]">{iconWrap}</div>
    </div>
  );
}

export const HowItWorks = () => {
  return (
    <section className="relative overflow-hidden bg-[#f5f3ee] px-4 py-12 sm:px-6 sm:py-14 md:py-16 lg:px-8">
      <HowItWorksDecor />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="mb-10 text-center sm:mb-12 md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-800/75">
            Tres pasos
          </p>
          <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
            Cómo funciona
          </h2>
        </header>

        <div className="flex flex-col gap-8 sm:gap-10 md:gap-12">
          {STEPS.map((step, i) => {
            const reverse = i % 2 === 1;
            return (
              <React.Fragment key={step.label}>
                <article
                  className={`relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-white/90 bg-white/80 p-6 shadow-md shadow-green-950/[0.04] backdrop-blur-[2px] sm:p-8 md:flex-row md:items-center md:gap-8 md:p-10 ${
                    reverse ? "md:flex-row-reverse" : ""
                  } ${
                    i === 0
                      ? "md:mr-[4%] lg:mr-[7%]"
                      : i === 1
                        ? "md:ml-[6%] lg:ml-[10%]"
                        : "md:mr-[2%] lg:mr-[5%]"
                  }`}
                >
                  <StepVisual step={step} index={i} reverse={reverse} />

                  <div
                    className={`min-w-0 flex-1 text-center md:text-left ${
                      reverse ? "md:text-right" : ""
                    }`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-700 sm:text-xs">
                      {step.label}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                      {step.title}
                    </h3>
                    <p
                      className={`mx-auto mt-3 max-w-prose text-sm leading-relaxed text-gray-600 sm:text-base ${
                        reverse ? "md:ml-auto" : "md:mr-auto"
                      } ${reverse ? "md:text-right" : ""}`}
                    >
                      {step.desc}
                    </p>
                  </div>
                </article>

                {i < STEPS.length - 1 && (
                  <div className="flex justify-center py-1 md:hidden" aria-hidden>
                    <i className="icon-[lucide--chevron-down] h-5 w-5 text-green-700/30" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};
