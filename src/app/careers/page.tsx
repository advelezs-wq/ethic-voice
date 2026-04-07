"use client";

import Image from "next/image";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

const CareersPage = () => {
  return (
    <MarketingPageShell>
      <section className="relative overflow-hidden bg-[#0a1f14] px-6 py-16 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(22,101,52,0.35)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90">
              Carreras
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Únete a <span className="text-lime-400">EthicVoice</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              Ayúdanos a construir una cultura de integridad en miles de
              organizaciones.
            </p>
            <p className="mt-4 text-white/70">
              Buscamos personas apasionadas por el impacto, la tecnología y el
              cumplimiento. Creemos en el trabajo colaborativo, el aprendizaje
              continuo y el crecimiento profesional.
            </p>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(163,230,53,0.15)] ring-1 ring-white/10 md:h-80">
            <Image
              src="/nosotros/careers-2.png"
              alt="Equipo EthicVoice"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f5f3ee] px-6 py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-[#0a1f14] md:text-3xl">
            Áreas de trabajo
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: "Producto & Diseño",
                desc: "Diseña experiencias claras y accesibles.",
              },
              {
                title: "Ingeniería",
                desc: "Construye soluciones seguras y escalables.",
              },
              {
                title: "Compliance & Riesgos",
                desc: "Acompaña a nuestros clientes en su transformación.",
              },
            ].map((a, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#0a1f14]/10 bg-white p-6 shadow-sm"
              >
                <h3 className="font-semibold text-[#0a1f14]">{a.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0a1f14] px-6 py-16">
        <div className="container mx-auto max-w-6xl text-center text-white">
          <h3 className="text-2xl font-bold md:text-3xl">
            ¿No ves una vacante?
          </h3>
          <p className="mt-3 text-white/75">
            Escríbenos y cuéntanos cómo puedes aportar.
          </p>
          <a
            href="mailto:talento@ethicvoice.com"
            className="mt-6 inline-flex items-center rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-[0_0_24px_rgba(190,242,100,0.35)] transition hover:bg-lime-300"
          >
            Enviar CV
            <i className="icon-[mdi--arrow-right] ml-2 h-5 w-5" />
          </a>
        </div>
      </section>
    </MarketingPageShell>
  );
};

export default CareersPage;
