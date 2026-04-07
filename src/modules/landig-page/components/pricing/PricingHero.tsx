import { motion } from "framer-motion";
import React from "react";
import { Tabs, Tab } from "@heroui/react";
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
    <section className="relative overflow-hidden bg-[#0a1f14] px-6 py-16 md:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(22,101,52,0.35)_0%,transparent_55%)]"
        aria-hidden
      />
      <div className="relative z-10 container mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90">
            Planes
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Elige tu plan <span className="text-lime-400">ideal</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
            Selecciona entre los mejores planes, asegurando una combinación
            perfecta. ¿Necesitas más o menos? Personaliza tu suscripción para un
            ajuste perfecto.
          </p>

          <div className="flex justify-center">
            <Tabs
              selectedKey={billingCycle}
              onSelectionChange={(key) =>
                onBillingCycleChange(key as BillingCycle)
              }
              variant="solid"
              color="success"
              size="lg"
              className="w-auto"
              classNames={{
                tabList: "rounded-full bg-white/10 p-1",
                cursor: "rounded-full bg-lime-400 shadow-lg",
                tab: "rounded-full px-8 py-3 text-sm font-medium transition-all duration-300",
                tabContent:
                  "group-data-[selected=true]:text-gray-950 text-white/70",
              }}
            >
              <Tab key={BillingCycle.MONTHLY} title="Mensual" />
              <Tab key={BillingCycle.YEARLY} title="Anual (ahorra 10%)" />
            </Tabs>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
