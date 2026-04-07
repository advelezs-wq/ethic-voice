"use client";

import Image from "next/image";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

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
    <MarketingPageShell>
      <section className="relative overflow-hidden bg-[#0a1f14] px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(22,101,52,0.35)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90">
            Prensa
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            <span className="text-lime-400">Noticias</span>
          </h1>
          <p className="mt-4 max-w-2xl text-white/75">
            Actualizaciones, anuncios y cobertura de prensa sobre EthicVoice.
          </p>
        </div>
      </section>

      <section className="bg-[#f5f3ee] px-6 py-12">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {news.map((n, i) => (
            <article
              key={i}
              className="overflow-hidden rounded-2xl border border-[#0a1f14]/10 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={n.image}
                  alt={n.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {new Date(n.date).toLocaleDateString()}
                </span>
                <h2 className="mt-2 text-lg font-semibold text-[#0a1f14]">
                  {n.title}
                </h2>
                <p className="mt-2 text-sm text-gray-600">{n.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MarketingPageShell>
  );
};

export default NewsPage;
