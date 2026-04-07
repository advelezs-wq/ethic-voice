"use client";

import { motion } from "framer-motion";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";

export const PricingCTA = () => {
  const { openCalendly } = useCalendlyGate();
  const badges = [
    "ISO 27001",
    "GDPR Compliant",
    "SOC 2 Type II",
    "5000+ empresas confían en nosotros",
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿No estás listo para solicitar una cotización?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Contáctanos con más detalles sobre tus requisitos y te responderemos
            rápidamente
          </p>
          <button
            type="button"
            onClick={openCalendly}
            className="bg-green-600 mb-8 text-center flex justify-center text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 group transition-colors items-center cursor-pointer"
          >
            Hablar con ventas
            <i
              className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45"
              role="img"
              aria-hidden="true"
            />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6"
        >
          {badges.map((badge, index) => (
            <div
              key={index}
              className="bg-white px-4 py-2 rounded-full border border-gray-200"
            >
              <span className="text-gray-700 font-medium text-sm">{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
