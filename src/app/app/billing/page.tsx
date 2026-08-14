"use client";

import React from "react";
import { SubscriptionManagement } from "@/modules/app/components/subscription/SubscriptionManagement";
import { PageHero } from "@/modules/app/components/ui";

export default function BillingPage() {
  return (
    <section className="h-full w-full space-y-6">
      <PageHero
        kicker="Suscripción"
        title="Plan y facturación"
        description="Administra tu plan, pagos e historial de facturación."
      />
      <SubscriptionManagement />
    </section>
  );
}
