"use client";

import { motion } from "framer-motion";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

export const PricingCTA = () => {
  const { openCalendly } = useCalendlyGate();
  const badges = [
    "ISO 27001",
    "GDPR Compliant",
    "SOC 2 Type II",
    "5000+ empresas confían en nosotros",
  ];

  return (
    <MarketingSectionV2
      className="!pb-24"
      guides={[{ percent: 50, accent: true }]}
      eyebrow="Ventas"
      title="¿No estás listo para solicitar una cotización?"
      subtitle="Contáctanos con más detalles sobre tus requisitos y te responderemos rápidamente."
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          viewport={{ once: true }}
        >
          <button
            type="button"
            onClick={(e) => openCalendly(e)}
            className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-8 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_4px_20px_rgba(163,230,53,0.35)] transition-colors hover:bg-lime-500"
          >
            Hablar con ventas
            <i className="icon-[lucide--arrow-right] h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          {badges.map((badge, index) => (
            <span
              key={index}
              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#273c46] shadow-sm"
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
    </MarketingSectionV2>
  );
};
