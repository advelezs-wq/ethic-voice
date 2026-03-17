import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/modules/landig-page/components/layout/Header";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
import { FAQSection } from "@/modules/landig-page/components/FAQSection";
import { CalendlyCta } from "@/modules/landig-page/components/CalendlyCta";
import Script from "next/script";
import { BackgroundCurves } from "@/modules/landig-page/components/layout/BackgroundCurves";

export const metadata: Metadata = {
  title: "Seguridad y Privacidad | EthicVoice",
  description:
    "Protegemos sus datos con los más altos estándares de seguridad y privacidad: ISO, auditorías SOC y cifrado de extremo a extremo.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white bg-curves relative">
      <div className="absolute inset-0 -z-[1]">
        <BackgroundCurves />
      </div>
      {/* Calendly Widget CSS */}
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
      />
      {/* Calendly Widget Script */}
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
      <Header />

      {/* Hero Section */}
      <section className="container max-w-7xl md:mx-auto py-28 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Seguridad y Privacidad
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-2xl">
              Garantizar la seguridad de sus datos es nuestra máxima prioridad. Implementamos medidas de seguridad estándar de la industria
              y nos sometemos a auditorías regulares realizadas por auditores externos. La privacidad y la seguridad están garantizadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#whistleblowing-security"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-green-700 text-green-700 font-semibold hover:bg-green-50"
              >
                Leer más
              </a>
            </div>
          </div>
          <div className="flex justify-center order-last md:order-none">
            <div className="relative w-full max-w-xl md:max-w-2xl">
              <Image
                src="/privacidad/hero.jpeg"
                alt="Security and privacy hero"
                width={1200}
                height={800}
                className="w-full rounded-lg shadow-2xl object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      <main className="pb-12">
        <div className="container max-w-7xl md:mx-auto space-y-12">
          {/* Whistleblowing Security Section */}
          <section id="whistleblowing-security" className="py-16 md:py-20 bg-gradient-to-br from-emerald-50 via-green-50 to-white">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0c3b2f] mb-4 md:mb-6 leading-tight">
                Tus datos de denuncias y conductas indebidas están seguros con nosotros
              </h2>
              <p className="text-[#0c3b2f] max-w-3xl mx-auto mb-8 md:mb-10 opacity-80 text-sm md:text-base">
                Somos auditados y acreditados regularmente según estándares globales de seguridad y privacidad.
              </p>
              <div className="bg-white rounded-2xl p-6 md:p-12 max-w-6xl mx-auto shadow-sm border border-emerald-100">
                <div className="hidden md:flex items-center justify-center gap-10 mb-10 opacity-90">
                  <div className="w-20 h-20 rounded-full border-2 border-emerald-300 text-[#0c3b2f] flex flex-col items-center justify-center text-[11px]">
                    <i className="icon-[mdi--lock] text-emerald-700 text-xl" />
                    Cifrado
                  </div>
                  <div className="w-20 h-20 rounded-full border-2 border-emerald-300 text-[#0c3b2f] flex flex-col items-center justify-center text-[11px]">
                    <i className="icon-[mdi--shield-key] text-emerald-700 text-xl" />
                    MFA / SSO
                  </div>
                  <div className="w-20 h-20 rounded-full border-2 border-emerald-300 text-[#0c3b2f] flex flex-col items-center justify-center text-[11px]">
                    <i className="icon-[mdi--backup-restore] text-emerald-700 text-xl" />
                    Respaldos
                  </div>
                  <div className="w-20 h-20 rounded-full border-2 border-emerald-300 text-[#0c3b2f] flex flex-col items-center justify-center text-[11px]">
                    <i className="icon-[mdi--account-lock] text-emerald-700 text-xl" />
                    Accesos
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                  <div className="text-center space-y-6 bg-white border border-gray-100 rounded-xl p-6 shadow-sm h-full">
                    <div className="flex justify-center mb-6">
                      <i className="icon-[mdi--shield-check] h-16 w-16 text-green-700" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-700 mb-2">Buenas prácticas de seguridad</h3>
                    <p className="text-gray-700">
                      Aplicamos controles técnicos y organizativos, como cifrado en tránsito y en reposo cuando corresponde, control de acceso basado en roles, registro y monitoreo.
                    </p>
                  </div>
                  <div className="text-center space-y-6 bg-white border border-gray-100 rounded-xl p-6 shadow-sm h-full">
                    <div className="flex justify-center mb-6">
                      <i className="icon-[mdi--check-circle] h-16 w-16 text-green-700" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-700 mb-2">Evaluaciones y pruebas</h3>
                    <p className="text-gray-700">
                      Realizamos revisiones periódicas, pruebas y mejoras continuas con proveedores y asesores cuando aplica. Podemos compartir detalles bajo acuerdo de confidencialidad.
                    </p>
                  </div>
                  <div className="text-center space-y-6 bg-white border border-gray-100 rounded-xl p-6 shadow-sm h-full">
                    <div className="flex justify-center mb-6">
                      <i className="icon-[mdi--lock] h-16 w-16 text-green-700" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-700 mb-2">Privacidad por diseño</h3>
                    <p className="text-gray-700">
                      Diseñamos los flujos minimizando datos, tiempos de retención y accesos; ofrecemos opciones para anonimato, eliminación y retención configurable según las necesidades de cada organización.
                    </p>
                  </div>
                </div>
                <div className="mt-8 md:mt-12 text-center">
                  <CalendlyCta className="inline-flex items-center px-6 py-3 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800 group transition-colors">
                    Hablar con nuestros expertos
                    <i className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45" />
                  </CalendlyCta>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonial */}
          <section className="py-16 md:py-20 bg-gray-100">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                <div className="order-2 md:order-1 flex justify-center">
                  <Image
                    src="/platform/company.jpg"
                    alt="Líder de Tecnología"
                    width={320}
                    height={320}
                    className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-lg shadow-lg"
                  />
                </div>
                <div className="order-1 md:order-2 space-y-6 md:space-y-8">
                  <blockquote className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    “La misión de nuestro equipo es construir un sistema líder que cumpla con los más altos estándares de seguridad y
                    privacidad, y que al mismo tiempo sea sencillo de usar.”
                  </blockquote>
                  <div className="space-y-2">
                    <p className="font-semibold text-lg text-gray-900">Dirección de Tecnología</p>
                    <p className="text-gray-600">EthicVoice</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Traducciones humanas */}
          <section className="py-16 md:py-20">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                <div className="flex justify-center">
                  <Image
                    src="/platform/multidioma-platform.jpeg"
                    alt="Plataforma multidioma de EthicVoice"
                    width={420}
                    height={420}
                    className="w-full max-w-sm md:max-w-md h-auto rounded-lg"
                  />
                </div>
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Traducciones humanas integradas</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    La traducción automática puede ser impresionante, pero también innecesariamente riesgosa cuando tratamos temas muy sensibles.
                    Las traducciones humanas siguen siendo indispensables cuando debemos estar 100% seguros de lo que se reporta.
                  </p>
                  <div className="hidden" />
                </div>
              </div>
            </div>
          </section>

          {/* Autenticación multifactor */}
          <section className="py-16 md:py-20 bg-gray-100">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Autenticación multifactor</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    La autenticación multifactor y el inicio de sesión único (SSO) son esenciales para un procesamiento de datos seguro. Con estas funciones,
                    mantiene control total sobre quién accede a qué datos en su plataforma de denuncias.
                  </p>
                  <div className="hidden" />
                </div>
                <div className="flex justify-center md:justify-end">
                  <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-sm w-full">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm">S</div>
                        <span className="font-medium">De: EthicVoice</span>
                      </div>
                      <span className="text-sm text-gray-500">ahora</span>
                    </div>
                    <div className="space-y-3 mb-6">
                      <p className="text-sm text-gray-700">Tu código 2FA es: 491024</p>
                    </div>
                    <div className="flex justify-center space-x-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="w-8 h-8 text-green-700 text-2xl font-bold flex items-center justify-center">*</div>
                      ))}
                    </div>
                    <a href="#login" className="inline-flex mt-6 w-full items-center justify-center px-5 py-2 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800">Iniciar sesión</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Regulaciones de privacidad */}
          <section className="py-16 md:py-20">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                <div className="flex justify-center">
                  <Image
                    src="/platform/advanced-security.jpeg"
                    alt="Certificaciones de seguridad"
                    width={640}
                    height={480}
                    className="w-full max-w-md md:max-w-lg h-auto rounded-lg"
                  />
                </div>
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Regulaciones de privacidad</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Asegure el cumplimiento de su organización con un conjunto complejo de regulaciones, incluyendo GDPR y la Directiva Europea de Denunciantes.
                    También gestionamos directrices de retención y requisitos de localización de datos.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <CalendlyCta className="inline-flex items-center px-5 py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 group transition-colors">
                      Solicitar demo
                      <i className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45" />
                    </CalendlyCta>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Preguntas frecuentes - reutilizamos el componente de la landing */}
          <FAQSection />

          {/* CTA final */}
          <section className="text-center bg-gray-50 rounded-xl p-6 md:p-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Obtenga una demo de seguridad y privacidad</h2>
            <p className="mt-3 text-gray-700">Vea cómo EthicVoice protege sus datos y simplifica el cumplimiento normativo.</p>
            <CalendlyCta className="inline-flex mt-6 items-center px-6 py-3 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800 group transition-colors">
              Solicitar demo
              <i className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45" />
            </CalendlyCta>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}


