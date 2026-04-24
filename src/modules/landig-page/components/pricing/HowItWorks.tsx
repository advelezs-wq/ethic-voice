"use client";

import { motion } from "framer-motion";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

export const HowItWorks = () => {
  const steps = [
    {
      icon: "icon-[lucide--message-square]",
      title: "Cuéntanos sobre ti",
      description:
        "Te contactaremos en 24 horas para entender completamente tus necesidades",
    },
    {
      icon: "icon-[lucide--monitor]",
      title: "Solución personalizada",
      description:
        "Programaremos una llamada corta y te mostraremos las opciones adaptadas a tu organización",
    },
    {
      icon: "icon-[lucide--rocket]",
      title: "Implementación rápida",
      description:
        "Te apoyamos de manera oportuna con todo lo necesario para comenzar",
    },
  ];

  return (
    <MarketingSectionV2
      surface
      eyebrow="Proceso"
      title="¿Cómo funciona?"
      subtitle="Tres pasos claros desde el primer contacto hasta operar con EthicVoice."
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-100">
              <i className={`${step.icon} h-8 w-8 text-lime-800`} aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-[#0d212c]">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#273c46]">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </MarketingSectionV2>
  );
};
