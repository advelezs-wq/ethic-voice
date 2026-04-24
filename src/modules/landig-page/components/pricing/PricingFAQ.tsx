"use client";

import React from "react";
import { motion } from "framer-motion";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

export const PricingFAQ = () => {
  const faqs = [
    {
      question: "¿Cómo se personaliza el precio?",
      answer:
        "Nuestros precios se personalizan según el tamaño de tu empresa y las características que necesitas, como análisis avanzados o SSO. ¿No estás seguro de qué es lo mejor para ti? ¡Contáctanos!",
    },
    {
      question: "¿Cómo obtengo una cotización personalizada?",
      answer:
        "Simplemente llena nuestro formulario de contacto con tus requisitos. Esto nos ayuda a prepararnos para nuestra llamada y mostrarte exactamente lo que buscas.",
    },
    {
      question: "¿Para qué tamaño de empresas está diseñado EthicVoice?",
      answer:
        "La plataforma EthicVoice está diseñada para servir de manera flexible a empresas desde 500 empleados hasta empresas globales. Adaptamos nuestras soluciones a las necesidades únicas de cada cliente, sin excepciones.",
    },
    {
      question: "¿Es EthicVoice adecuado para empresas internacionales?",
      answer:
        "Sí, EthicVoice es perfectamente adecuado para empresas internacionales. Trabajamos con muchas organizaciones que tienen entidades en múltiples países, garantizando integración y soporte sin problemas en todas las regiones.",
    },
    {
      question: "¿Qué incluye el soporte?",
      answer:
        "Cuando te registras en un paquete de soporte, todo está incluido: sin costos adicionales, sin tarifas ocultas. Si eliges no optar por un paquete de soporte, te tenemos cubierto con todo lo necesario para un proceso de auto-incorporación fluido.",
    },
  ];

  return (
    <MarketingSectionV2 id="faq-precios" eyebrow="FAQ" title="Preguntas frecuentes sobre precios" guides={[]}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl space-y-3"
      >
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group rounded-2xl border border-slate-200 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-[#0d212c]">
              {faq.question}
              <i
                className="icon-[lucide--chevron-right] h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-90"
                aria-hidden
              />
            </summary>
            <p className="border-t border-slate-200 px-5 pb-4 pt-3 text-sm leading-relaxed text-[#273c46]">
              {faq.answer}
            </p>
          </details>
        ))}
      </motion.div>
    </MarketingSectionV2>
  );
};
