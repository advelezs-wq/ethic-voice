"use client";

import { Header } from "@/modules/landig-page/components/layout/Header";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
import Image from "next/image";
import { BackgroundCurves } from "@/modules/landig-page/components/layout/BackgroundCurves";

const NewsPage = () => {
  const news = [
    {
      title: "EthicVoice lanza nuevas funciones impulsadas por Andi IA",
      date: "2025-08-12",
      image: "/platform/ai-analysis.jpeg",
      excerpt:
        "Mejoras en priorización automática y análisis de casos para canales más eficientes.",
    },
    {
      title: "Alianza estratégica con Valor Estratégico Consultores",
      date: "2025-06-05",
      image: "/platform/company.jpg",
      excerpt:
        "Fortalecemos nuestros servicios de cumplimiento y gestión de riesgos.",
    },
    {
      title: "Reconocimiento por mejores prácticas en privacidad",
      date: "2025-04-20",
      image: "/platform/advanced-security.jpeg",
      excerpt:
        "Distinción por nuestro enfoque en confidencialidad y protección de datos.",
    },
  ];

  return (
    <div className="min-h-screen bg-white bg-curves relative">
      <div className="absolute inset-0 -z-[1]">
        <BackgroundCurves />
      </div>
      <Header />
      <main className="pt-20">
        <section className="py-16 px-6 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Noticias</h1>
            <p className="text-gray-600 max-w-2xl">
              Actualizaciones, anuncios y cobertura de prensa sobre EthicVoice.
            </p>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((n, i) => (
              <article key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-full h-48">
                  <Image src={n.image} alt={n.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <span className="text-xs uppercase tracking-wide text-gray-500">{new Date(n.date).toLocaleDateString()}</span>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900">{n.title}</h2>
                  <p className="text-gray-600 text-sm mt-2">{n.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NewsPage;


