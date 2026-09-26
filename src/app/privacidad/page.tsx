import type { Metadata } from "next";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { Voice } from "@/modules/brand/components/primitives";
import { IndexList, PageHero, Section } from "@/modules/brand/components/sections";
import { Faq } from "@/modules/landig-page/components/v5/Faq";
import { PrivacyHeroActions } from "./PrivacyHeroActions";

export const metadata: Metadata = {
  title: "Seguridad y Privacidad | EthicVoice",
  description:
    "Cómo protege EthicVoice los datos de las denuncias: cifrado en tránsito y en reposo, acceso por roles, MFA y SSO, privacidad por diseño y retención configurable.",
  alternates: { canonical: "/privacidad" },
};

const CONTROLS = [
  { k: "Cifrado", v: "En tránsito y en reposo" },
  { k: "Acceso", v: "MFA, SSO y permisos por rol" },
  { k: "Respaldos", v: "Copias periódicas verificadas" },
  { k: "Registro", v: "Monitoreo y bitácora de cada acción" },
] as const;

const PRACTICES = [
  {
    title: "Buenas prácticas de seguridad",
    body: "Controles técnicos y organizativos: cifrado en tránsito y en reposo, acceso por roles, registro y monitoreo.",
  },
  {
    title: "Evaluaciones y pruebas",
    body: "Revisiones periódicas y mejora continua con proveedores y asesores. Detalles bajo confidencialidad cuando aplique.",
  },
  {
    title: "Privacidad por diseño",
    body: "Flujos que minimizan datos y retención; anonimato, eliminación y retención configurables por organización.",
  },
] as const;

const TOPICS = [
  {
    title: "Autenticación multifactor",
    body: "MFA y SSO son esenciales para un procesamiento de datos seguro. Mantén control total sobre quién accede a qué información de tu canal de denuncias.",
  },
  {
    title: "Traducciones humanas cuando importa",
    body: "La traducción automática es útil, pero riesgosa en temas sensibles. Cuando debemos estar 100% seguros de lo que se reporta, la precisión humana sigue siendo indispensable.",
  },
  {
    title: "Regulaciones de privacidad",
    body: "Alineación con GDPR, la Directiva Europea de Denunciantes y buenas prácticas de retención y localización de datos según tu contexto.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Seguridad y privacidad"
        title={["Tus denuncias,", <>bajo <Voice>llave.</Voice></>]}
        lead="Garantizar la seguridad de los datos es nuestra máxima prioridad: controles alineados con la industria y privacidad por diseño."
        actions={<PrivacyHeroActions />}
      />

      <section className="bg-ev-paper pb-24">
        <div className="mx-auto max-w-[var(--ev-max)] px-[var(--ev-gutter)]">
          <dl className="grid border-t border-ev-night sm:grid-cols-2 lg:grid-cols-4">
            {CONTROLS.map((c) => (
              <div key={c.k} className="border-b border-ev-line py-7 pr-6 lg:border-b-0 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:pl-8">
                <dt className="ev-label text-ev-moss">{c.k}</dt>
                <dd className="mt-3 text-[1.3125rem] font-medium leading-snug tracking-[-0.025em] text-ev-night">{c.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section
        id="whistleblowing-security"
        index="01"
        kicker="Protección de datos"
        title={["Tus datos de denuncias", <>están <Voice>seguros.</Voice></>]}
      >
        <IndexList items={PRACTICES} columns={3} />
      </Section>

      <section className="ev-grain ev-grain-dark relative overflow-hidden bg-ev-night py-28 text-white sm:py-40">
        <div className="mx-auto max-w-[var(--ev-max)] px-[var(--ev-gutter)]">
          <p className="ev-label text-white/45">
            <span className="text-ev-signal">(02)</span> Dirección de Tecnología
          </p>
          <blockquote className="mt-10 max-w-5xl text-[clamp(1.9rem,4.2vw,3.9rem)] font-medium leading-[1.06] tracking-[-0.045em]">
            “Construir un sistema que cumpla los estándares más altos de
            seguridad y privacidad y que, al mismo tiempo, sea{" "}
            <em className="ev-serif text-ev-signal">sencillo de usar.</em>”
          </blockquote>
        </div>
      </section>

      <Section surface="paper" index="03" kicker="Control y cumplimiento" title={["Cada acceso,", <>con <Voice>nombre y fecha.</Voice></>]}>
        <IndexList items={TOPICS} />
      </Section>

      <Faq index="04" />
    </MarketingPageShell>
  );
}
