import type { Metadata } from "next";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { buttonClasses, Arrow, Container, Voice } from "@/modules/brand/components/primitives";
import { IndexList, PageHero, Section } from "@/modules/brand/components/sections";

export const metadata: Metadata = {
  title: "Programa de Partners | EthicVoice",
  description:
    "Consultores, firmas de auditoría, despachos legales y empresas de tecnología: ofrece EthicVoice a tus clientes y crece con nosotros.",
  alternates: { canonical: "/partners" },
};

const BENEFITS = [
  { title: "Nuevas fuentes de ingresos", body: "Comisiones atractivas por cada cliente que adquiera la plataforma a través de ti." },
  { title: "Valor agregado a tu portafolio", body: "Una solución tecnológica de cumplimiento y ética empresarial lista para ofrecer." },
  { title: "Soporte y acompañamiento", body: "Material comercial, capacitaciones y asesoría directa de nuestro equipo." },
  { title: "Reconocimiento conjunto", body: "Red oficial de aliados y visibilidad compartida en eventos, medios y campañas." },
  { title: "Modelo flexible", body: "Recomienda, comercializa o integra EthicVoice en tus servicios." },
] as const;

const TIERS = [
  { n: "01", title: "Referenciador", body: "Recomiendas EthicVoice y recibes comisión por cada contrato cerrado." },
  { n: "02", title: "Comercial", body: "Incluyes EthicVoice en tu portafolio, gestionas clientes y accedes a mejores beneficios económicos." },
  { n: "03", title: "Estratégico", body: "Alianza de largo plazo con integraciones tecnológicas o proyectos conjuntos." },
] as const;

const AUDIENCE = [
  "Consultores en cumplimiento, ética y riesgos",
  "Firmas de auditoría, legales y contables",
  "Empresas de tecnología que integren EthicVoice",
  "Cámaras de comercio, gremios y asociaciones",
] as const;

export default function PartnersPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Programa de Partners"
        title={["Crece llevando la ética", <>empresarial a <Voice>otro nivel.</Voice></>]}
        lead="La transparencia no es solo un requisito legal: es una ventaja competitiva. Ofrece a tus clientes un canal de denuncias confidencial, anónimo y seguro."
        actions={
          <>
            <a href="mailto:partners@ethicvoice.co" className={buttonClasses("signal", "lg")}>
              Escríbenos <Arrow />
            </a>
            <a href="/partners/portal" className={buttonClasses("outline", "lg")}>
              Portal de Partners
            </a>
          </>
        }
      />

      <Section index="01" kicker="Beneficios" title={["No vendes un software:", <>ayudas a prevenir <Voice>riesgos.</Voice></>]}>
        <IndexList items={BENEFITS} columns={2} />
      </Section>

      <Section surface="paper" index="02" kicker="Modalidades" title={["Tres formas de", <>trabajar <Voice>juntos.</Voice></>]}>
        <div className="grid gap-px overflow-hidden rounded-[1.5rem] bg-ev-line md:grid-cols-3">
          {TIERS.map((t) => (
            <article key={t.n} className="flex min-h-[18rem] flex-col justify-between bg-white p-8 sm:p-10">
              <span className="font-wordmark text-[5rem] font-semibold leading-none tracking-[-0.06em] text-ev-signal">
                {t.n}
              </span>
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-ev-night">Partner {t.title}</h3>
                <p className="mt-3 text-[0.975rem] leading-relaxed text-ev-mute">{t.body}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section index="03" kicker="¿A quién está dirigido?">
        <ul className="border-t border-ev-night">
          {AUDIENCE.map((a) => (
            <li
              key={a}
              className="border-b border-ev-line py-6 text-[clamp(1.5rem,3.2vw,2.75rem)] font-medium leading-tight tracking-[-0.04em] text-ev-night"
            >
              {a}
            </li>
          ))}
        </ul>
        <Container className="!px-0">
          <p className="ev-label mt-10 flex flex-wrap gap-x-8 gap-y-2 text-ev-mute">
            <span>partners@ethicvoice.co</span>
            <span>+57 322 414 5120</span>
          </p>
        </Container>
      </Section>
    </MarketingPageShell>
  );
}
