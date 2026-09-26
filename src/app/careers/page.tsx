import type { Metadata } from "next";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { Arrow, buttonClasses, Voice } from "@/modules/brand/components/primitives";
import { IndexList, PageHero, Section } from "@/modules/brand/components/sections";

export const metadata: Metadata = {
  title: "Carreras | EthicVoice",
  description:
    "Ayúdanos a construir una cultura de integridad en miles de organizaciones. Producto, ingeniería y compliance.",
  alternates: { canonical: "/careers" },
};

const AREAS = [
  { title: "Producto y diseño", body: "Diseña experiencias claras y accesibles para quien reporta y para quien investiga." },
  { title: "Ingeniería", body: "Construye soluciones seguras y escalables, con la privacidad como requisito." },
  { title: "Compliance y riesgos", body: "Acompaña a nuestros clientes en la transformación de sus programas de ética." },
] as const;

export default function CareersPage() {
  return (
    <MarketingPageShell showFooter={false}>
      <PageHero
        kicker="Carreras"
        title={["Construye la herramienta", <>que protege a quien <Voice>habla.</Voice></>]}
        lead="Buscamos personas apasionadas por el impacto, la tecnología y el cumplimiento. Creemos en el trabajo colaborativo, el aprendizaje continuo y el crecimiento profesional."
        actions={
          <a href="mailto:talento@ethicvoice.com" className={buttonClasses("signal", "lg")}>
            Enviar CV <Arrow />
          </a>
        }
      />

      <Section index="01" kicker="Áreas de trabajo" title={["Dónde puedes", <>sumar <Voice>tu voz.</Voice></>]}>
        <IndexList items={AREAS} columns={3} />
      </Section>

      <Section surface="night" index="02" kicker="Candidatura espontánea">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <h2 className="ev-display lg:col-span-8">
            ¿No ves una <em className="ev-serif pr-[0.06em] text-ev-signal">vacante?</em>
          </h2>
          <div className="lg:col-span-4">
            <p className="text-lg leading-relaxed text-white/65">
              Escríbenos y cuéntanos cómo puedes aportar.
            </p>
            <a href="mailto:talento@ethicvoice.com" className={buttonClasses("signal", "lg", "mt-8")}>
              talento@ethicvoice.com <Arrow />
            </a>
          </div>
        </div>
      </Section>
    </MarketingPageShell>
  );
}
