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
    <section className="py-16 px-6 bg-white">
      <div className="container mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            ¡Elige tu plan ideal!
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Selecciona entre los mejores planes, asegurando una combinación
            perfecta. ¿Necesitas más o menos? ¡Personaliza tu suscripción para
            un ajuste perfecto!
          </p>

          {/* Billing Toggle - Hero UI Tabs with Green Color */}
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
                tabList: "bg-gray-100 rounded-full p-1",
                cursor: "bg-green-600 rounded-full shadow-lg",
                tab: "px-8 py-3 text-sm font-medium rounded-full transition-all duration-300",
                tabContent:
                  "group-data-[selected=true]:text-white text-gray-600",
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
