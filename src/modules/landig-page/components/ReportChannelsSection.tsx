"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  LANDING_VIEWPORT,
  landingTransition,
} from "@/modules/landig-page/lib/landingMotion";

export const ReportChannelsSection = () => {
  const reduce = useReducedMotion();
  const channels = [
    {
      id: "phone",
      title: "Línea Telefónica",
      subtitle: "01-800 GRATUITA",
      description:
        "Disponible 24/7 en más de 75 idiomas con operadores especializados.",
      icon: (
        <i
          className="icon-[lucide--phone] size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      features: [
        "24/7 disponible",
        "75+ idiomas",
        "Completamente confidencial",
      ],
      bgColor: "bg-white",
      iconColor: "text-blue-600",
      borderColor: "border-gray-200",
      hoverBorder: "hover:border-blue-300",
    },
    {
      id: "email",
      title: "Correo Electrónico",
      subtitle: "POTENCIADO CON IA",
      description:
        "Sistema inteligente que procesa y clasifica denuncias automáticamente.",
      icon: (
        <i
          className="icon-[lucide--mail] size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      features: [
        "Procesamiento con IA",
        "Respuesta automática",
        "Encriptación E2E",
      ],
      bgColor: "bg-white",
      iconColor: "text-purple-600",
      borderColor: "border-gray-200",
      hoverBorder: "hover:border-purple-300",
    },
    {
      id: "web",
      title: "Formulario Web",
      subtitle: "POTENCIADO CON IA",
      description:
        "Plataforma web segura con guías inteligentes para facilitar el proceso.",
      icon: (
        <i
          className="icon-[lucide--globe] size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      features: [
        "Guías inteligentes",
        "Interfaz intuitiva",
        "Seguimiento en tiempo real",
      ],
      bgColor: "bg-white",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
      hoverBorder: "hover:border-green-300",
      isHighlighted: true,
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      subtitle: "MENSAJERÍA SEGURA",
      description:
        "Canal familiar y accesible con encriptación de extremo a extremo.",
      icon: (
        <i
          className="icon-[ic--baseline-whatsapp] size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      features: ["Familiar y fácil", "Encriptación E2E", "Respuestas rápidas"],
      bgColor: "bg-white",
      iconColor: "text-emerald-600",
      borderColor: "border-gray-200",
      hoverBorder: "hover:border-emerald-300",
    },
  ];

  const containerVariants = {
    hidden: { opacity: reduce ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduce ? 0 : 0.09,
        delayChildren: reduce ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: reduce ? 0 : 12, opacity: reduce ? 1 : 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: landingTransition(0),
    },
  };

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={landingTransition(0)}
          viewport={LANDING_VIEWPORT}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Múltiples Canales para{" "}
            <span className="text-green-700">Enviar Denuncias</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Ofrecemos diversos canales seguros y confidenciales para que puedas
            reportar cualquier irregularidad de la manera que te resulte más
            cómoda y confiable.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={LANDING_VIEWPORT}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12"
        >
          {channels.map((channel) => (
            <motion.div
              key={channel.id}
              variants={itemVariants}
              className={`
                relative group rounded-2xl p-6 sm:p-7 lg:p-8 border-2 transition-all duration-300 shadow-sm
                ${channel.bgColor} ${channel.borderColor} ${channel.hoverBorder}
                ${channel.isHighlighted ? "ring-2 ring-green-200 shadow-lg border-green-200" : "hover:shadow-xl"}
              `}
            >
              {channel.isHighlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Recomendado
                  </span>
                </div>
              )}

              <div
                className={`${channel.iconColor} mb-6 p-3 rounded-xl bg-gray-50 w-fit`}
              >
                {channel.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {channel.title}
              </h3>

              <p className={`text-sm font-semibold mb-4 ${channel.iconColor}`}>
                {channel.subtitle}
              </p>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {channel.description}
              </p>

              <ul className="space-y-3 mb-6">
                {channel.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center text-sm text-gray-700"
                  >
                    <div className="w-2 h-2 rounded-full mr-3 bg-gray-400"></div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Primary CTA moved to bottom combined panel */}
            </motion.div>
          ))}
        </motion.div>

        {/* Combined Action Section: Submit + Track */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={landingTransition(0.1)}
          viewport={LANDING_VIEWPORT}
          className="text-center bg-white rounded-2xl p-7 sm:p-10 border border-gray-200 shadow-sm"
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Gestiona tu denuncia en un solo lugar
            </h3>
            <p className="text-gray-600 mb-8">
              Envíala de forma segura y confidencial, o consulta el estado con tu
              código de seguimiento.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 place-items-center">
              <Link
                href="/submit"
                className="inline-flex w-full sm:w-auto items-center justify-center px-6 sm:px-8 py-3 bg-[#1f7a4c] hover:bg-[#186142] text-white font-semibold rounded-lg transition-colors group shadow-md"
              >
                <i
                  className="icon-[lucide--shield-alert] size-5 mr-2"
                  role="img"
                  aria-hidden="true"
                />
                Enviar Denuncia
                <i
                  className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:translate-x-1"
                  role="img"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/track"
                className="inline-flex w-full sm:w-auto items-center justify-center px-6 sm:px-8 py-3 border-2 border-[#1f7a4c] text-[#1f7a4c] hover:bg-green-50 font-semibold rounded-lg transition-colors group shadow-md"
              >
                <i
                  className="icon-[lucide--search] size-5 mr-2"
                  role="img"
                  aria-hidden="true"
                />
                Seguimiento de Denuncia
                <i
                  className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45"
                  role="img"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={landingTransition(0.12)}
          viewport={LANDING_VIEWPORT}
          className="text-center mt-16"
        >
          <div className="flex flex-wrap justify-center items-center gap-10 text-base text-gray-600 px-2">
            <div className="flex items-center">
              <i
                className="icon-[lucide--shield-check] size-6 mr-3 text-green-600"
                role="img"
                aria-hidden="true"
              />
              <span>100% Confidencial</span>
            </div>
            <div className="flex items-center">
              <i
                className="icon-[lucide--lock] size-6 mr-3 text-blue-600"
                role="img"
                aria-hidden="true"
              />
              <span>Encriptación E2E</span>
            </div>
            <div className="flex items-center">
              <i
                className="icon-[lucide--award] size-6 mr-3 text-purple-600"
                role="img"
                aria-hidden="true"
              />
              <span>ISO 37002 Gestión de denuncias</span>
            </div>
            <div className="flex items-center">
              <i
                className="icon-[lucide--clock] size-6 mr-3 text-gray-600"
                role="img"
                aria-hidden="true"
              />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
