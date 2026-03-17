"use client";
import React from "react";
import { motion } from "framer-motion";
import { Accordion, AccordionItem } from "@heroui/react";

export const FAQSection = () => {
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

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Preguntas frecuentes
          </h2>
          <p className="text-xl text-gray-600">
            Encuentra respuestas a las preguntas más comunes sobre nuestra
            plataforma de cumplimiento.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Accordion
            defaultExpandedKeys={["0"]}
            className="gap-4 p-0"
            itemClasses={{
              title: "font-semibold text-lg text-gray-900",
              trigger: " h-auto",
              content: "p-4",
            }}
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index.toString()}
                aria-label={faq.question}
                title={faq.question}
              >
                <p className="leading-relaxed">{faq.answer}</p>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
