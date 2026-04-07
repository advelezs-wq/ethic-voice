"use client";

import React from "react";

const REASONS = [
  {
    icon: "icon-[lucide--scale]",
    title: "Riesgo legal",
    desc: "Mitiga riesgos y evita sanciones regulatorias graves.",
    color: "bg-amber-50 text-amber-600",
    ring: "ring-amber-200/50",
  },
  {
    icon: "icon-[lucide--user-check]",
    title: "Fuga de talento",
    desc: "Retén a tus mejores empleados con confianza.",
    color: "bg-blue-50 text-blue-600",
    ring: "ring-blue-200/50",
  },
  {
    icon: "icon-[lucide--shield-alert]",
    title: "Daño reputacional",
    desc: "Protege tu imagen y credibilidad corporativa.",
    color: "bg-rose-50 text-rose-600",
    ring: "ring-rose-200/50",
  },
] as const;

function WhyEthicWaveBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute -left-[8%] top-1/2 h-[min(100%,640px)] w-[min(120%,900px)] -translate-y-1/2 opacity-90 sm:-left-[4%] md:left-0 md:h-[min(110%,720px)] md:w-full md:max-w-4xl"
        viewBox="0 0 900 560"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          <path
            className="opacity-[0.2]"
            stroke="#6b9088"
            d="M-30 140 C140 60 320 200 500 120 S820 40 930 130"
          />
          <path
            className="opacity-[0.16]"
            stroke="#14532d"
            d="M0 240 C200 320 420 120 640 220 S860 280 920 180"
          />
          <path
            className="opacity-[0.14]"
            stroke="#8b9a6f"
            d="M40 360 C260 280 480 420 700 300 S880 380 940 260"
          />
          <path
            className="opacity-[0.18]"
            stroke="#7a9e9a"
            d="M-20 200 C180 280 400 100 580 210 S800 160 960 240"
          />
          <path
            className="opacity-[0.12]"
            stroke="#a67c52"
            d="M60 90 C280 160 500 40 720 110 S880 70 940 140"
          />
          <path
            className="opacity-[0.15]"
            stroke="#5c7d6c"
            d="M20 460 C240 380 460 520 680 420 S900 480 950 400"
          />
        </g>
      </svg>
      <svg
        className="absolute -right-[10%] bottom-0 h-[min(70%,420px)] w-[min(100%,520px)] translate-y-1/4 opacity-80 sm:right-0 md:bottom-8 md:h-[min(80%,480px)] md:w-[min(90%,600px)] md:translate-y-0"
        viewBox="0 0 700 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          strokeWidth="1.05"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        >
          <path
            className="opacity-[0.18]"
            stroke="#9aad6e"
            d="M-40 120 C120 200 300 40 500 140 S700 100 740 180"
          />
          <path
            className="opacity-[0.14]"
            stroke="#5a9d9a"
            d="M0 260 C180 180 400 320 620 220 S720 280 760 200"
          />
          <path
            className="opacity-[0.12]"
            stroke="#8b7355"
            d="M80 60 C260 120 440 20 620 90 S720 50 780 110"
          />
        </g>
      </svg>
    </div>
  );
}

export const WhyEthicVoice = () => {
  const [featured, ...compact] = REASONS;

  return (
    <section className="relative overflow-x-hidden bg-[#f5f3ee] px-4 py-12 sm:px-6 sm:py-14 md:py-16 lg:px-8">
      <WhyEthicWaveBackground />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="mb-8 text-center sm:mb-10 md:mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-green-800/70">
            Por qué EthicVoice
          </p>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
            ¿Por qué las empresas eligen EthicVoice?
          </h2>
        </div>

        {/* Bento: móvil en columna; md+ featured alto a la izquierda, dos tarjetas a la derecha */}
        <div className="grid auto-rows-auto grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:grid-rows-2">
          <article
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-6 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[2px] transition-shadow hover:shadow-md md:row-span-2 md:min-h-[min(100%,320px)] md:p-8 lg:min-h-0 lg:p-9 ${featured.ring}`}
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-100/40 blur-2xl transition-opacity group-hover:opacity-90" />
            <div className="relative">
              <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Prioridad
              </span>
              <div
                className={`mt-5 flex h-16 w-16 items-center justify-center rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem] ${featured.color}`}
              >
                <i className={`${featured.icon} h-8 w-8 sm:h-9 sm:w-9`} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900 sm:text-2xl">
                {featured.title}
              </h3>
              <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
                {featured.desc}
              </p>
            </div>
          </article>

          {compact.map((r, idx) => (
            <article
              key={r.title}
              className={`relative flex flex-row items-start gap-4 overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[2px] transition-shadow hover:shadow-md sm:gap-5 sm:p-6 ${r.ring}`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${r.color}`}
              >
                <i className={`${r.icon} h-6 w-6 sm:h-7 sm:w-7`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {String(idx + 2).padStart(2, "0")}
                </span>
                <h3 className="mt-1 text-base font-bold text-gray-900 sm:text-lg">
                  {r.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-[0.9375rem]">
                  {r.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
