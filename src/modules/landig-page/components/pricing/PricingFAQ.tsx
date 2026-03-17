"use client";

import React from "react";
import { motion } from "framer-motion";
import { Accordion, AccordionItem } from "@heroui/react";

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
    <section className="py-20 px-6 bg-white">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Preguntas frecuentes sobre precios
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Accordion
            defaultExpandedKeys={["0"]}
            className="gap-4"
            itemClasses={{
              title: "font-semibold text-lg text-gray-900",
              trigger: " h-auto",
              content: "p-4",
            }}
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                title={
                  <h3 className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </h3>
                }
              >
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
