"use client";

import React from "react";
import { SectionReveal } from "@/modules/landig-page/components/motion/SectionReveal";

const PILLARS = [
  {
    icon: "icon-[lucide--user-round-search]",
    title: "Privacidad y anonimato",
    desc: "Diseño del canal para proteger la identidad y la confidencialidad de quien reporta, según la configuración de tu organización.",
  },
  {
    icon: "icon-[lucide--lock-keyhole]",
    title: "Cifrado y transmisión segura",
    desc: "Uso de protocolos y prácticas de seguridad actuales para proteger la información en tránsito y en la plataforma.",
  },
  {
    icon: "icon-[lucide--shield-half]",
    title: "Accesos por roles",
    desc: "Solo las personas que tu empresa autoriza pueden ver y actuar sobre los casos, con trazabilidad de las acciones del equipo.",
  },
  {
    icon: "icon-[lucide--scale]",
    title: "Enfoque de cumplimiento",
    desc: "Herramientas pensadas para apoyar procesos serios de canal ético, sin sustituir el asesoramiento legal de tu organización.",
  },
] as const;

function TrustDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute left-1/2 top-0 h-px w-[min(90%,720px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#0a1f14]/15 to-transparent" />
      <svg
        className="absolute -right-[8%] top-24 h-52 w-48 opacity-[0.2] sm:top-32"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="100"
          cy="100"
          r="78"
          stroke="#0a1f14"
          strokeWidth="0.75"
          strokeDasharray="4 6"
        />
        <circle
          cx="100"
          cy="100"
          r="52"
          stroke="#a3e635"
          strokeWidth="0.75"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

export const TrustSecuritySection = () => {
  const [hero, ...rest] = PILLARS;
  const [lock, roles, compliance] = rest;

  return (
    <section className="relative overflow-hidden bg-[#f5f3ee] px-4 py-12 sm:px-6 sm:py-14 md:py-16 lg:px-8">
      <TrustDecor />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <SectionReveal className="mb-8 text-center sm:mb-10 md:mb-12">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/75">
              Confianza
            </p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
              Seguridad y confianza
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
              Priorizamos la seguridad y la confianza con un lenguaje claro: sin
              usar sellos de certificación que no correspondan a nuestra situación
              actual.
            </p>
          </header>
        </SectionReveal>

        {/* Bloque principal — ancho completo */}
        <SectionReveal delay={0.06} y={10}>
        <div className="overflow-hidden rounded-3xl border border-[#0a1f14]/20 bg-[#0a1f14] p-6 shadow-xl shadow-[#0a1f14]/20 sm:p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-lime-400/15 ring-2 ring-lime-400/35 sm:h-[4.5rem] sm:w-[4.5rem]">
              <i
                className={`${hero.icon} h-8 w-8 text-lime-400 sm:h-9 sm:w-9`}
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                {hero.title}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
                {hero.desc}
              </p>
            </div>
          </div>
        </div>
        </SectionReveal>

        {/* Dos pilares en fila con acentos distintos */}
        <SectionReveal delay={0.1} y={10}>
        <div className="mt-5 flex flex-col gap-5 md:mt-6 md:flex-row md:items-stretch md:gap-5 lg:gap-6">
          <article className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-[#0a1f14]/12 bg-white/90 p-6 shadow-md shadow-[#0a1f14]/[0.04] backdrop-blur-sm sm:p-7 md:min-h-[200px]">
            <div
              className="absolute left-0 top-0 h-full w-1 rounded-l-3xl bg-lime-400"
              aria-hidden
            />
            <div className="flex items-start gap-4 pl-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0a1f14] text-white">
                <i className={`${lock.icon} h-6 w-6`} aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900">
                  {lock.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {lock.desc}
                </p>
              </div>
            </div>
          </article>

          <article className="relative flex flex-1 flex-col rounded-3xl border-2 border-dashed border-[#0a1f14]/20 bg-white/60 p-6 backdrop-blur-sm sm:p-7 md:min-h-[200px] md:-translate-y-2 md:shadow-none lg:-translate-y-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime-400/15 text-[#0a1f14] ring-2 ring-[#0a1f14]/10">
                <i className={`${roles.icon} h-6 w-6`} aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900">
                  {roles.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {roles.desc}
                </p>
              </div>
            </div>
          </article>
        </div>
        </SectionReveal>

        {/* Cumplimiento — bloque tipo nota / pie */}
        <SectionReveal delay={0.12} y={8}>
        <article className="mt-5 rounded-2xl border border-gray-200/90 bg-[#faf9f6] px-5 py-5 sm:mt-6 sm:px-8 sm:py-6 md:flex md:items-start md:gap-6 md:rounded-3xl">
          <div className="mx-auto mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a1f14] shadow-sm md:mx-0 md:mb-0">
            <i className={`${compliance.icon} h-5 w-5`} aria-hidden />
          </div>
          <div className="min-w-0 text-center md:text-left">
            <h3 className="text-base font-bold text-gray-900 sm:text-lg">
              {compliance.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-[0.9375rem]">
              {compliance.desc}
            </p>
          </div>
        </article>
        </SectionReveal>

        <SectionReveal delay={0.14} y={6}>
        <p className="mx-auto mt-8 max-w-2xl px-1 text-center text-xs leading-relaxed text-gray-500 sm:mt-10 sm:text-sm">
          <i
            className="icon-[lucide--info] mr-1 inline-block h-3.5 w-3.5 align-middle text-[#0a1f14]/70"
            aria-hidden
          />
          Las obligaciones legales y de protección de datos dependen de tu
          sector, país y políticas internas; podemos orientarte en la
          implementación, pero la responsabilidad final es de tu organización.
        </p>
        </SectionReveal>
      </div>
    </section>
  );
};
