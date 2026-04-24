"use client";

import React from "react";
import { BillingCycle } from "@/types/subscription.types";

interface PricingHeroProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

export const PricingHero = ({
  billingCycle,
  onBillingCycleChange,
}: PricingHeroProps) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white px-5 pb-12 pt-10 md:px-8 md:pb-16 md:pt-14">
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        {[25, 50, 75].map((left) => (
          <div
            key={left}
            className="absolute bottom-0 top-0 w-px bg-black/[0.07]"
            style={{ left: `${left}%`, transform: "translateX(-50%)" }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(94,210,156,0.14),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">
          Planes
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-[#051a24] md:text-5xl lg:text-6xl">
          Elige tu plan <span className="text-lime-700">ideal</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#273c46] md:text-lg">
          Selecciona entre los mejores planes, asegurando una combinación
          perfecta. ¿Necesitas más o menos? Personaliza tu suscripción para un
          ajuste perfecto.
        </p>

        <div
          className="mt-8 flex justify-center"
          role="group"
          aria-label="Ciclo de facturación"
        >
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={() => onBillingCycleChange(BillingCycle.MONTHLY)}
              className={`min-h-11 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-8 ${
                billingCycle === BillingCycle.MONTHLY
                  ? "bg-lime-400 text-[#052b24] shadow-md"
                  : "text-[#273c46] hover:bg-slate-50"
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => onBillingCycleChange(BillingCycle.YEARLY)}
              className={`min-h-11 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-8 ${
                billingCycle === BillingCycle.YEARLY
                  ? "bg-lime-400 text-[#052b24] shadow-md"
                  : "text-[#273c46] hover:bg-slate-50"
              }`}
            >
              Anual (ahorra 10%)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
