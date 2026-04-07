"use client";

import Link from "next/link";
import NextImage from "next/image";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Image } from "@heroui/react";
import Script from "next/script";

const calendlyUrl =
  "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1";

function openCalendlyPopup(e: { preventDefault: () => void }) {
  e.preventDefault();
  if (typeof window !== "undefined" && (window as any).Calendly) {
    (window as any).Calendly.initPopupWidget({ url: calendlyUrl });
  } else if (typeof window !== "undefined") {
    window.open(calendlyUrl, "_blank");
  }
}

function scrollToFeatures(e: { preventDefault: () => void }) {
  e.preventDefault();
  if (typeof document !== "undefined") {
    const el = document.getElementById("features");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export const PlatformPage = () => {
  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof document !== "undefined") {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://assets.calendly.com/assets/external/widget.css";
            document.head.appendChild(link);
          }
        }}
      />
      <section className="relative overflow-hidden bg-[#0a1f14] px-6 pb-16 pt-8 md:pt-12">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(22,101,52,0.35)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90">
                Producto
              </p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
                Plataforma{" "}
                <span className="text-lime-400">EthicVoice</span>
              </h1>
              <p className="max-w-2xl text-lg text-white/80">
                Reportes confiables, gestión de casos, analíticas avanzadas e IA
                para transformar el cumplimiento en una ventaja competitiva.
              </p>
              {/* Action buttons removed per request */}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Borde/sombra pegados al bitmap: sin caja fija h-80 ni object-cover */}
              <div className="inline-block max-w-full overflow-hidden rounded-2xl border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
                <NextImage
                  src="/platform/preview-1.jpg"
                  alt="Vista previa de la plataforma EthicVoice"
                  width={2340}
                  height={1368}
                  className="block h-auto w-full max-w-full align-top"
                  sizes="(min-width: 1024px) min(50vw, 640px), 100vw"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="overview" className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card shadow="sm" className="border border-gray-200">
              <CardBody>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <i className="icon-[lucide--megaphone] size-5 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Denuncias y canales</h3>
                <p className="text-gray-600 mt-1">Web, email, chatbot y teléfono, seguros y accesibles.</p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="border border-gray-200">
              <CardBody>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <i className="icon-[lucide--clipboard-list] size-5 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Gestión de casos</h3>
                <p className="text-gray-600 mt-1">Flujos claros, SLA, y colaboración para resolver con rigor.</p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="border border-gray-200">
              <CardBody>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <i className="icon-[lucide--sparkles] size-5 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Analíticas e IA</h3>
                <p className="text-gray-600 mt-1">Insights accionables y procesamiento inteligente de denuncias.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Highlight Sections */}
      <section id="features" className="bg-[#f5f3ee] px-6 py-16">
        <div className="container mx-auto max-w-7xl space-y-16">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Características importantes de la plataforma
            </h2>
          </div>

          {/* Build alternating feature blocks */}
          {[
            {
              title: "Analíticas avanzadas e IA",
              desc:
                "Procesa los reportes con IA: extrae entidades clave (personas, lugares, fechas), resalta términos sensibles y detecta señales de riesgo para acelerar la investigación.",
              bullets: [
                "Detección automática de entidades y palabras sensibles",
                "Priorización por severidad y nivel de confianza",
                "Resúmenes ejecutivos listos para el equipo",
                "Tendencias por tema, ubicación y frecuencia",
              ],
              mock: "Mock de dashboard de analíticas / IA",
            },
            {
              title: "Seguridad avanzada",
              desc:
                "Reporte cifrado de extremo a extremo, anonimato real y confidencialidad por diseño. Controles de acceso y auditoría para proteger cada dato.",
              bullets: [
                "Cifrado E2E desde el navegador hasta el almacenamiento",
                "Reportes anónimos sin metadatos sensibles",
                "Permisos y acceso granulares por rol y sensibilidad",
                "Auditoría y retención segura de la información",
              ],
              mock: "Mock de configuraciones y logs",
            },
            {
              title: "Plataforma multidioma",
              desc:
                "El idioma ya no es una barrera: interfaz, formularios y comunicaciones en múltiples idiomas con traducciones automáticas precisas.",
              bullets: [
                "Formularios, UI y notificaciones localizados",
                "Traducción automática bidireccional de reportes y mensajes",
                "Detección automática del idioma del usuario",
                "Soporte para más de 100 idiomas y escritura RTL",
              ],
              mock: "Mock de plataforma multidioma",
            },
            {
              title: "Espacios de trabajo organizados",
              desc:
                "Diseñado para equipos: vistas por rol, distribución de tareas, asignaciones y seguimiento colaborativo de casos entre áreas.",
              bullets: [
                "Colas y tableros por estado y prioridad",
                "Asignaciones, notas internas y recordatorios",
                "Integraciones con correo y herramientas internas",
              ],
              mock: "Mock de bandejas y tableros",
            },
          ].map((f, idx) => (
            <div
              key={f.title}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
            >
              {/* Text block */}
              <div className={idx % 2 === 0 ? "lg:order-1" : "lg:order-2"}>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
                <ul className="list-disc list-inside text-gray-700 mt-3 space-y-1">
                  {f.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              {/* Image/mock block */}
              <div
                className={
                  (f.title === "Analíticas avanzadas e IA" || f.title === "Espacios de trabajo organizados" || f.title === "Seguridad avanzada" || f.title === "Plataforma multidioma"
                    ? "aspect-square "
                    : "h-64 ") +
                  "flex items-center justify-center overflow-hidden " +
                  (idx % 2 === 0 ? "lg:order-2" : "lg:order-1")
                }
              >
                {f.title === "Analíticas avanzadas e IA" ? (
                  <Image
                    src="/platform/ai-analysis.jpeg"
                    alt="Análisis avanzado con IA"
                    className="w-full h-full object-cover"
                  />
                ) : f.title === "Seguridad avanzada" ? (
                  <div className="w-full h-full bg-white">
                    <Image
                      src="/platform/advanced-security.jpeg"
                      alt="Seguridad avanzada y confidencialidad"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : f.title === "Plataforma multidioma" ? (
                  <Image
                    src="/platform/multidioma-platform.jpeg"
                    alt="Plataforma multidioma"
                    className="w-full h-full object-cover"
                  />
                ) : f.title === "Espacios de trabajo organizados" ? (
                  <Image
                    src="/platform/workspace-organizational.jpeg"
                    alt="Espacios de trabajo organizados"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500">{f.mock}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Transforma el cumplimiento en una ventaja competitiva
          </h3>
          <p className="text-gray-600 mb-6">
            Agenda una demo para conocer cómo la plataforma EthicVoice se adapta a
            tu organización.
          </p>
          <button
            onClick={openCalendlyPopup}
            className="group inline-flex items-center rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-[0_0_24px_rgba(190,242,100,0.35)] transition hover:bg-lime-300"
          >
            Solicitar demo
            <i
              className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45"
              role="img"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>
    </>
  );
};


