"use client";

import { Header } from "@/modules/landig-page/components/layout/Header";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
import Image from "next/image";
import { BackgroundCurves } from "@/modules/landig-page/components/layout/BackgroundCurves";

const CareersPage = () => {
  return (
    <div className="min-h-screen bg-white bg-curves relative">
      <div className="absolute inset-0 -z-[1]">
        <BackgroundCurves />
      </div>
      <Header />
      <main className="pt-20">
        <section className="py-20 px-6 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Únete a EthicVoice
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Ayúdanos a construir una cultura de integridad en miles de organizaciones.
                </p>
                <p className="text-gray-600">
                  Buscamos personas apasionadas por el impacto, la tecnología y el cumplimiento.
                  Creemos en el trabajo colaborativo, el aprendizaje continuo y el crecimiento profesional.
                </p>
              </div>
              <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/nosotros/careers-2.png"
                  alt="Equipo EthicVoice"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Áreas de trabajo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Producto & Diseño", desc: "Diseña experiencias claras y accesibles." },
                { title: "Ingeniería", desc: "Construye soluciones seguras y escalables." },
                { title: "Compliance & Riesgos", desc: "Acompaña a nuestros clientes en su transformación." },
              ].map((a, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">{a.title}</h3>
                  <p className="text-gray-600 text-sm">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-green-700">
          <div className="container mx-auto max-w-6xl text-center text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">¿No ves una vacante?</h3>
            <p className="text-green-100 mb-6">Escríbenos y cuéntanos cómo puedes aportar.</p>
            <a
              href="mailto:talento@ethicvoice.com"
              className="inline-flex items-center bg-white text-green-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Enviar CV
              <i className="icon-[mdi--arrow-right] ml-2 w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CareersPage;


