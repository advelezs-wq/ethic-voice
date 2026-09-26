"use client";

import { BillingCycle } from "@/types/subscription.types";
import { Container, RevealHeading, Voice, reveal } from "@/modules/brand/components/primitives";

interface PricingHeroProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

const CYCLES = [
  { value: BillingCycle.MONTHLY, label: "Mensual" },
  { value: BillingCycle.YEARLY, label: "Anual · ahorra 10%" },
] as const;

export const PricingHero = ({ billingCycle, onBillingCycleChange }: PricingHeroProps) => {
  const activeIndex = CYCLES.findIndex((c) => c.value === billingCycle);

  return (
    <section className="bg-ev-paper">
      <Container className="pb-16 pt-10 sm:pt-14 lg:pb-24">
        <div {...reveal(0)} className="ev-label flex items-center justify-between border-b border-ev-line pb-4 text-ev-mute">
          <span>
            <span className="text-ev-moss">(EV)</span> Precios
          </span>
          <span className="hidden sm:inline">USD · Sin permanencia</span>
        </div>
        <div className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-8">
            <RevealHeading
              as="h1"
              className="ev-display text-ev-night"
              lines={["Un plan para cada", <>etapa de tu <Voice>organización.</Voice></>]}
            />
            <p {...reveal(250)} className="ev-lead mt-8 max-w-xl">
              Empieza hoy y escala cuando lo necesites. Cambia de plan o cancela
              la renovación desde tu panel de facturación.
            </p>
          </div>

          {/* Selector de ciclo: la píldora se desliza entre opciones */}
          <div {...reveal(300)} className="lg:col-span-4 lg:flex lg:justify-end">
            <div
              role="radiogroup"
              aria-label="Ciclo de facturación"
              className="relative inline-grid grid-cols-2 rounded-full border border-ev-line bg-white p-1"
            >
              <span
                aria-hidden
                className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-ev-night transition-transform duration-300 ease-ev-out"
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
              />
              {CYCLES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={billingCycle === c.value}
                  onClick={() => onBillingCycleChange(c.value)}
                  className={`relative z-10 min-h-11 whitespace-nowrap rounded-full px-5 text-sm transition-colors duration-300 ${
                    billingCycle === c.value ? "text-white" : "text-ev-mute hover:text-ev-night"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
