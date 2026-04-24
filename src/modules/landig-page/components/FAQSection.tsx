"use client";
import React from "react";
import { motion } from "framer-motion";
import { Accordion, AccordionItem } from "@heroui/react";
import {
  LANDING_VIEWPORT,
  landingTransition,
} from "@/modules/landig-page/lib/landingMotion";

type FAQSectionProps = {
  /** Si es false, no renderiza el encabezado ni el contenedor de página (útil dentro de MarketingSectionV2). */
  showHeader?: boolean;
};

export const FAQSection = ({ showHeader = true }: FAQSectionProps) => {
  const faqs = [
    {
      question: "¿Qué es un sistema de denuncias éticas?",
      answer:
        "Un sistema de denuncias éticas es una plataforma que permite a los empleados y otras partes interesadas reportar de manera confidencial y segura cualquier conducta inapropiada, violaciones éticas o legales dentro de una organización. Facilita la comunicación bidireccional y el seguimiento de casos.",
    },
    {
      question: "¿Cómo garantizan el anonimato completo?",
      answer:
        "Nuestro sistema utiliza tecnología de encriptación de extremo a extremo y permite reportes completamente anónimos. Los usuarios pueden elegir no proporcionar información identificativa y aún así mantener comunicación bidireccional a través de códigos únicos seguros.",
    },
    {
      question: "¿En cuántos idiomas está disponible la plataforma?",
      answer:
        "EthicVoice está disponible en más de 75 idiomas, permitiendo que organizaciones multinacionales ofrezcan la plataforma en los idiomas nativos de sus empleados. También ofrecemos soporte telefónico 24/7 en múltiples idiomas.",
    },
    {
      question: "¿Qué garantías de seguridad ofrecen?",
      answer:
        "Protegemos la información con encriptación de extremo a extremo, controles de acceso granulares y auditoría continua. Cumplimos con buenas prácticas y marcos de referencia internacionales para resguardar tus datos, incluso cuando los reportes son anónimos.",
    },
    {
      question: "¿Cuánto tiempo toma implementar el sistema?",
      answer:
        "La implementación básica puede completarse en tan solo 2-3 semanas. Para configuraciones más complejas con integraciones personalizadas, el proceso típicamente toma entre 4-8 semanas. Nuestro equipo de onboarding guía todo el proceso.",
    },
    {
      question: "¿Pueden integrarse con nuestros sistemas existentes?",
      answer:
        "Sí, ofrecemos integraciones con una amplia gama de sistemas empresariales incluyendo SSO/SAML, HRIS, sistemas de gestión de documentos, y herramientas de análisis como Power BI y Tableau. También proporcionamos APIs REST y webhooks para integraciones personalizadas.",
    },
  ];

  const accordion = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={landingTransition(showHeader ? 0.08 : 0)}
      viewport={LANDING_VIEWPORT}
    >
      <Accordion
        defaultExpandedKeys={["0"]}
        className="gap-2 p-0 sm:gap-4"
        itemClasses={{
          title: "font-semibold text-base text-[#0d212c] sm:text-lg",
          trigger: "h-auto py-3 sm:py-4",
          content:
            "px-1 pb-4 pt-0 text-sm leading-relaxed text-[#273c46] sm:px-2 sm:text-base sm:pb-5",
        }}
      >
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index.toString()}
            aria-label={faq.question}
            title={faq.question}
          >
            <p>{faq.answer}</p>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );

  if (!showHeader) {
    return <div className="mx-auto w-full max-w-3xl">{accordion}</div>;
  }

  return (
    <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8">
      <div className="container mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={landingTransition(0)}
          viewport={LANDING_VIEWPORT}
          className="mb-8 text-center sm:mb-12 md:mb-14"
        >
          <h2 className="mb-3 text-2xl font-bold text-[#0d212c] sm:mb-4 sm:text-3xl md:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#273c46] sm:text-base md:text-lg">
            Encuentra respuestas a las preguntas más comunes sobre nuestra
            plataforma de cumplimiento.
          </p>
        </motion.div>
        {accordion}
      </div>
    </section>
  );
};
