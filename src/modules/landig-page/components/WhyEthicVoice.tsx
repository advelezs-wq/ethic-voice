"use client";

import React from "react";
import Image from "next/image";

type Reason =
  | { kind: "svg"; Icon: React.FC<{ className?: string }>; title: string; desc: string; size?: string }
  | { kind: "img"; src: string; title: string; desc: string; size?: string };

const REASONS: Reason[] = [
  {
    kind: "img",
    src: "/why/Mazo y bloque de sonido.png",
    title: "Riesgo legal",
    desc: "Mitiga riesgos y evita sanciones.",
    size: "h-36 w-36",
  },
  {
    kind: "img",
    src: "/why/Enlace roto y chispas de ruptura.png",
    title: "Fuga de talento",
    desc: "Retén a tus mejores empleados con confianza.",
  },
  {
    kind: "img",
    src: "/why/Escudo triste con grietas.png",
    title: "Daño reputacional",
    desc: "Protege tu imagen y credibilidad.",
  },
];

export const WhyEthicVoice = () => {
  return (
    <section className="relative overflow-x-hidden bg-[#f5f3ee] px-4 py-12 sm:px-6 sm:py-14 md:py-16 lg:px-8">
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="mb-10 text-center sm:mb-12 md:mb-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-900/50">
            Por qué EthicVoice
          </p>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
            ¿Por qué las empresas eligen EthicVoice?
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8 md:gap-12 lg:gap-16">
          {REASONS.map((reason) => (
            <article
              key={reason.title}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-3 flex h-36 w-full items-center justify-center" aria-hidden>
                {reason.kind === "svg" ? (
                  <reason.Icon className="h-28 w-28 text-[#0a1f14]" />
                ) : (
                  <Image
                    src={reason.src}
                    alt=""
                    width={144}
                    height={144}
                    className={`object-contain mix-blend-multiply ${reason.size ?? "h-28 w-28"}`}
                  />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                {reason.title}
              </h3>
              <p className="mt-3 max-w-xs text-pretty text-sm leading-relaxed text-gray-700 sm:text-base">
                {reason.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
