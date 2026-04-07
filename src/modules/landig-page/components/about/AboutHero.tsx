"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export const AboutHero = () => {
  return (
    <>
      <section className="relative overflow-hidden bg-[#0a1f14] px-4 pb-16 pt-10 md:px-6 md:pb-20 md:pt-14">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_35%,rgba(22,101,52,0.4)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
            <div className="space-y-5 text-center lg:text-left">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90"
              >
                Nosotros
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-[2.65rem]"
              >
                Quiénes{" "}
                <span className="text-lime-400">somos</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mx-auto max-w-lg text-pretty text-base leading-relaxed text-white/80 lg:mx-0"
              >
                Conoce quiénes somos, qué nos impulsa y cómo combinamos
                tecnología y consultoría para la integridad organizacional.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="flex w-full justify-center lg:justify-end"
            >
              <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 shadow-[0_0_48px_rgba(0,0,0,0.45)] sm:max-w-2xl lg:max-w-none lg:rounded-3xl">
                <Image
                  src="/nosotros/nosotros-2.png"
                  alt="Equipo y cultura EthicVoice"
                  width={1200}
                  height={800}
                  className="block h-auto w-full align-top"
                  sizes="(min-width: 1280px) 560px, (min-width: 1024px) 50vw, 100vw"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#f5f3ee] via-white to-[#f5f3ee] px-4 py-14 md:px-6 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(20,83,45,0.06)_0%,transparent_50%)]"
          aria-hidden
        />
        <div className="relative z-10 container mx-auto max-w-3xl">
          <div className="rounded-3xl border border-[#0a1f14]/10 bg-white/95 p-8 shadow-lg shadow-[#0a1f14]/05 ring-1 ring-black/[0.04] md:p-12">
            <p className="mb-6 text-lg leading-relaxed text-gray-700">
              EthicVoice es una plataforma avanzada de gestión de denuncias y
              cumplimiento normativo, diseñada para facilitar la creación de
              canales éticos seguros, transparentes y eficientes en cualquier
              organización. Con un enfoque integral, EthicVoice permite a las
              empresas gestionar, rastrear y resolver denuncias de forma anónima,
              cumpliendo con los estándares internacionales más rigurosos en
              compliance, prevención de lavado de activos, anticorrupción y
              protección de datos personales. Su interfaz intuitiva y flexible
              hace que la implementación y uso sean simples y eficaces,
              promoviendo una cultura organizacional ética y responsable.
            </p>
            <p className="mb-6 text-lg leading-relaxed text-gray-700">
              EthicVoice es administrada y operada por Valor Estratégico
              Consultores, una firma de consultoría con más de 10 años de
              experiencia en el campo del cumplimiento normativo y la gestión de
              riesgos. A lo largo de nuestra trayectoria, hemos trabajado con
              empresas de diversos sectores, ayudándolas a cumplir con
              regulaciones locales e internacionales, optimizando sus procesos y
              fortaleciendo sus sistemas de control interno.
            </p>
            <p className="text-lg leading-relaxed text-gray-700">
              Con el respaldo de Valor Estratégico Consultores, EthicVoice no solo
              ofrece tecnología de vanguardia, sino también un equipo de expertos
              comprometidos con la excelencia y el cumplimiento en todos los
              aspectos de la gestión de riesgos y la ética empresarial.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 border-t border-[#0a1f14]/10 pt-10">
              <img
                src="/brand/logo-nobg.png"
                alt="EthicVoice"
                className="h-9 w-auto opacity-90"
              />
              <span className="text-2xl font-light text-[#0a1f14]/25">×</span>
              <img
                src="/ethic-brands/valor_estrategico.webp"
                alt="Valor Estratégico Consultores"
                className="h-9 w-auto opacity-90"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
