import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

export default function PartnersPage() {
  return (
    <MarketingPageShell mainClassName="pb-16">
      <section className="container max-w-7xl px-4 md:mx-auto">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[#0a1f14]/10 bg-[#f5f3ee] p-6 text-center shadow-sm md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/70">
            Alianzas
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-[#0a1f14] md:text-5xl">
            Programa de Partners{" "}
            <span className="text-lime-600">EthicVoice</span>
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Crece con nosotros llevando la ética empresarial a otro nivel.
          </p>
          <p className="mt-4 text-gray-700">
            En EthicVoice creemos que la transparencia y la ética corporativa no
            son solo un requisito legal, sino una verdadera ventaja competitiva.
            Por eso, hemos creado un Programa de Partners para que consultores,
            firmas de auditoría, despachos legales, compañías de software y
            aliados estratégicos puedan ofrecer a sus clientes nuestra plataforma
            de canal de denuncias confidencial, anónima y segura.
          </p>
          <p className="mt-4 text-gray-700">
            Con EthicVoice, no solo vendes un software, sino que ayudas a las
            organizaciones a prevenir riesgos, proteger su reputación y fortalecer
            su cultura ética.
          </p>
        </div>
      </section>

      <section className="container mt-12 max-w-7xl px-4 md:mx-auto">
        <div className="rounded-2xl border border-[#0a1f14]/10 bg-white p-6 md:p-10">
          <h2 className="text-2xl font-bold text-[#0a1f14] md:text-3xl">
            Beneficios de ser Partner EthicVoice
          </h2>
          <ul className="mt-6 space-y-3 text-gray-700">
            {[
              <>
                <strong>Nuevas fuentes de ingresos:</strong> Recibe comisiones
                atractivas por cada cliente que adquiera la plataforma a través
                de ti.
              </>,
              <>
                <strong>Valor agregado a tu portafolio:</strong> Amplía tu oferta
                con una solución tecnológica de cumplimiento y ética empresarial.
              </>,
              <>
                <strong>Soporte y acompañamiento:</strong> Material comercial,
                capacitaciones y asesoría directa de nuestro equipo.
              </>,
              <>
                <strong>Reconocimiento conjunto:</strong> Red oficial de aliados
                y visibilidad compartida en eventos, medios y campañas.
              </>,
              <>
                <strong>Modelo flexible:</strong> Recomienda, comercializa o
                integra EthicVoice en tus servicios.
              </>,
            ].map((content, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <i
                  className="icon-[mdi--check-circle] mt-0.5 size-6 shrink-0 text-lime-600"
                  aria-hidden
                />
                <span>{content}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container mt-12 max-w-7xl px-4 md:mx-auto">
        <h2 className="text-2xl font-bold text-[#0a1f14] md:text-3xl">
          ¿A quién está dirigido?
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-4 text-gray-700 md:grid-cols-2">
          {[
            "Consultores en cumplimiento, ética y riesgos.",
            "Firmas de auditoría, legales y contables.",
            "Empresas de tecnología que deseen integrar EthicVoice.",
            "Cámaras de comercio, gremios y asociaciones empresariales.",
          ].map((text) => (
            <li key={text} className="flex items-start gap-3">
              <i
                className="icon-[mdi--arrow-right] mt-1 size-5 shrink-0 text-lime-600"
                aria-hidden
              />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container mt-12 max-w-7xl px-4 md:mx-auto">
        <h2 className="text-2xl font-bold text-[#0a1f14] md:text-3xl">
          Modalidades de Colaboración
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              title: "1. Partner Referenciador",
              body: "Recomiendas EthicVoice y recibes comisión por cada contrato cerrado.",
            },
            {
              title: "2. Partner Comercial",
              body: "Incluyes EthicVoice en tu portafolio, gestionas clientes y accedes a mejores beneficios económicos.",
            },
            {
              title: "3. Partner Estratégico",
              body: "Alianza a largo plazo con integraciones tecnológicas o proyectos conjuntos.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-[#0a1f14]/10 bg-white p-6 shadow-sm"
            >
              <h3 className="mb-2 font-semibold text-[#0a1f14]">{c.title}</h3>
              <p className="text-gray-700">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mt-12 max-w-7xl px-4 md:mx-auto">
        <div className="rounded-2xl border border-lime-400/30 bg-[#0a1f14] p-6 text-center md:p-8">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Únete a nuestra red de Partners
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-white/80">
            Forma parte de la transformación hacia una cultura empresarial más
            ética y transparente en Colombia y Latinoamérica.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="mailto:partners@ethicvoice.co"
              className="inline-flex items-center justify-center rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-[0_0_24px_rgba(190,242,100,0.35)] transition hover:bg-lime-300"
            >
              Escríbenos
              <i className="icon-[mdi--email] ml-2 size-5" />
            </a>
            <a
              href="/partners/portal"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Ir al Portal de Partners
              <i className="icon-[mdi--arrow-right] ml-2 size-5" />
            </a>
          </div>
          <div className="mt-6 text-sm text-white/70">
            <p className="flex flex-wrap items-center justify-center gap-4">
              <span className="inline-flex items-center gap-2">
                <i className="icon-[mdi--web]" />
                <a
                  href="https://www.ethicvoice.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  www.ethicvoice.co
                </a>
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="icon-[mdi--phone]" />
                (+57) 322 414 5120
              </span>
            </p>
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
