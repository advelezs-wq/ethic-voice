"use client";

import React from "react";
import { BillingManager } from "@/modules/app/components/subscription/BillingManager";
import { PageHero } from "@/modules/app/components/ui";

export default function BillingPage() {
  return (
    <section className="h-full w-full space-y-6">
      <PageHero
        kicker="Suscripción"
        title="Plan y facturación"
        description="Tu plan, el próximo cobro, la tarjeta y el historial de pagos."
      />
      <BillingManager />
    </section>
  );
}
