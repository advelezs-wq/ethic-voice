"use client";

import { useState } from "react";
import { PricingHero } from "@/modules/landig-page/components/pricing/PricingHero";
import PricingPlans from "@/modules/landig-page/components/pricing/PricingPlans";
import { BillingCycle } from "@/types/subscription.types";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { IndexList, Section } from "@/modules/brand/components/sections";
import { Voice } from "@/modules/brand/components/primitives";
import { Faq } from "@/modules/landig-page/components/v5/Faq";

const STEPS = [
  { title: "Cuéntanos sobre tu organización", body: "Te contactamos en menos de 24 horas para entender tus necesidades." },
  { title: "Solución a tu medida", body: "En una llamada corta te mostramos las opciones adaptadas a tu estructura y riesgos." },
  { title: "Implementación rápida", body: "Te acompañamos con todo lo necesario para que tu canal quede activo en días." },
] as const;

const PRICING_FAQS = [
  {
    q: "¿Cómo se define el precio?",
    a: "Según el tamaño de tu organización y las capacidades que necesitas, como IA avanzada o canales adicionales. Si no sabes cuál elegir, agenda una llamada y te recomendamos el plan adecuado.",
  },
  {
    q: "¿Puedo cambiar de plan o cancelar?",
    a: "Sí. Los planes funcionan por suscripción, sin permanencia mínima: cambias de plan o cancelas la renovación desde tu panel de facturación.",
  },
  {
    q: "¿Para qué tamaño de organización es EthicVoice?",
    a: "Desde equipos de 50 colaboradores hasta corporaciones con múltiples sedes. El plan Premium se adapta a operaciones de cualquier escala.",
  },
  {
    q: "¿Sirve para organizaciones con presencia en varios países?",
    a: "Sí. Trabajamos con organizaciones con entidades en múltiples países, con formularios localizados y comunicación traducida.",
  },
  {
    q: "¿Qué incluye el acompañamiento?",
    a: "Onboarding y acompañamiento están incluidos. En Premium sumamos diagnóstico, diseño a medida, migración de datos y capacitación del equipo.",
  },
] as const;

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);

  return (
    <MarketingPageShell>
      <PricingHero billingCycle={billingCycle} onBillingCycleChange={setBillingCycle} />
      <PricingPlans billingCycle={billingCycle} />
      <Section index="02" kicker="Proceso" title={["De la primera llamada", <>a un canal <Voice>activo.</Voice></>]}>
        <IndexList items={STEPS} columns={3} />
      </Section>
      <Faq items={PRICING_FAQS} index="03" />
    </MarketingPageShell>
  );
}
