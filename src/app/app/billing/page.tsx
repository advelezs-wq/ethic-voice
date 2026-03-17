"use client";

import React from "react";
import { SubscriptionManagement } from "@/modules/app/components/subscription/SubscriptionManagement";

export default function BillingPage() {
  return (
    <section className="h-full w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Plan y facturación
        </h1>
        <p className="text-gray-600">
          Administra tu plan, pagos e historial de facturación.
        </p>
      </div>
      <SubscriptionManagement />
    </section>
  );
}
