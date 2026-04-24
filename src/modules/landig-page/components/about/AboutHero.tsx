"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

export const AboutHero = () => {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-5 pb-12 pt-10 md:px-8 md:pb-16 md:pt-14">
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          {[25, 50, 75].map((left) => (
            <div
              key={left}
              className="absolute bottom-0 top-0 w-px bg-black/[0.07]"
              style={{ left: `${left}%`, transform: "translateX(-50%)" }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(94,210,156,0.14),transparent_45%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="text-center lg:col-span-5 lg:text-left">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700"
              >
                Nosotros
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-3 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-[#051a24] md:text-5xl lg:text-[2.75rem]"
              >
                Quiénes <span className="text-lime-700">somos</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mx-auto mt-5 max-w-lg text-pretty text-base leading-relaxed text-[#273c46] lg:mx-0 md:text-lg"
              >
                Conoce quiénes somos, qué nos impulsa y cómo combinamos
                tecnología y consultoría para la integridad organizacional.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="lg:col-span-7"
            >
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-emerald-900/12">
                <Image
                  src="/nosotros/nosotros-2.png"
                  alt="Equipo y cultura EthicVoice"
                  width={1200}
                  height={800}
                  className="block h-auto w-full align-top"
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <MarketingSectionV2
        id="quienes-somos"
        surface
        eyebrow="EthicVoice"
        title="Plataforma y consultoría para la integridad"
        subtitle="Tecnología segura respaldada por años de experiencia en cumplimiento y gestión de riesgos."
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.12)] md:p-10">
          <p className="mb-6 text-base leading-relaxed text-[#273c46] md:text-lg">
            EthicVoice es una plataforma avanzada de gestión de denuncias y
            cumplimiento normativo, diseñada para facilitar la creación de
            canales éticos seguros, transparentes y eficientes en cualquier
            organización. Con un enfoque integral, EthicVoice permite a las
            empresas gestionar, rastrear y resolver denuncias de forma anónima,
            cumpliendo con los estándares internacionales más rigurosos en
            compliance, prevención de lavado de activos, anticorrupción y
            protección de datos personales. Su interfaz intuitiva y flexible hace
            que la implementación y uso sean simples y eficaces, promoviendo una
            cultura organizacional ética y responsable.
          </p>
          <p className="mb-6 text-base leading-relaxed text-[#273c46] md:text-lg">
            EthicVoice es administrada y operada por Valor Estratégico
            Consultores, una firma de consultoría con más de 10 años de
            experiencia en el campo del cumplimiento normativo y la gestión de
            riesgos. A lo largo de nuestra trayectoria, hemos trabajado con
            empresas de diversos sectores, ayudándolas a cumplir con regulaciones
            locales e internacionales, optimizando sus procesos y fortaleciendo
            sus sistemas de control interno.
          </p>
          <p className="text-base leading-relaxed text-[#273c46] md:text-lg">
            Con el respaldo de Valor Estratégico Consultores, EthicVoice no solo
            ofrece tecnología de vanguardia, sino también un equipo de expertos
            comprometidos con la excelencia y el cumplimiento en todos los
            aspectos de la gestión de riesgos y la ética empresarial.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 border-t border-slate-200 pt-10">
            <Image
              src="/brand/logo-nobg.png"
              alt="EthicVoice"
              width={160}
              height={40}
              className="h-9 w-auto object-contain opacity-90"
            />
            <span className="text-2xl font-light text-slate-300" aria-hidden>
              ×
            </span>
            <Image
              src="/ethic-brands/valor_estrategico.webp"
              alt="Valor Estratégico Consultores"
              width={180}
              height={40}
              className="h-9 w-auto object-contain opacity-90"
            />
          </div>
        </div>
      </MarketingSectionV2>
    </>
  );
};
