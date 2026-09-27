"use client";

import React, { useState } from "react";
import { Button, Tabs, Tab } from "@heroui/react";
import {
  PlanConfig,
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
  formatPriceForUI,
} from "@/types/subscription.types";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
// Removed CheckIcon import - using iconify icons instead
import { motion } from "framer-motion";
import { useExchangeRate } from "@/modules/core/hooks/useExchangeRate";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { addToast } from "@/modules/core/utils/safe-toast";
// Duplicate import removed

export default function InPlatformPricingTable() {
  const { openCalendly } = useCalendlyGate();
  const { currentOrganization: _currentOrganization } = useOrganization();
  const { planInfo } = usePlanPermissions();
  const { rates } = useExchangeRate({ base: "USD", symbols: ["COP"] });
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    BillingCycle.MONTHLY
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const handleBillingToggle = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
  };

  // Removed local formatPrice - using formatPriceForUI from types

  const getPrice = (planType: PlanType) => {
    const config = PLAN_CONFIGS[planType];
    if (planType === PlanType.PREMIUM) return null;

    const price =
      billingCycle === BillingCycle.YEARLY
        ? config.price.yearly!
        : config.price.monthly;
    return price;
  };

  const handlePlanSelect = async (plan: PlanConfig) => {
    if (plan.isEnterprise) {
      openCalendly();
      return;
    }

    setIsProcessing(true);
    setSelectedPlan(plan.type);

    try {
      const isCurrent = planInfo?.planType === plan.type;

      if (isCurrent) {
        // Reactivar: no cobro inmediato, solo reactivar en MP y DB
        const res = await fetch("/api/subscriptions/update-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reactivate" }),
        });
        if (!res.ok) throw new Error("No se pudo reactivar la suscripción");
        // Vuelve a organización/billing
        window.location.reload();
        return;
      }

      // Upgrade/Downgrade: usa endpoint de cambio de plan con prorrateo/créditos
      const res = await fetch("/api/subscriptions/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // subscriptionId y org se resuelven en el backend por contexto cuando es posible
          newPlanType: plan.type,
          newBillingCycle: billingCycle,
          prorationMode: "immediate",
        }),
      });
      if (!res.ok) throw new Error("No se pudo iniciar el cambio de plan");
      const result = await res.json();
      const url =
        result?.payment?.paymentUrl ||
        result?.paymentUrl ||
        result?.redirect?.url;
      if (url) window.location.href = url as string;
    } catch (error) {
      console.error("Error creating subscription:", error);
      addToast({
        title: "Error al crear la suscripción. Por favor intenta nuevamente.",
        color: "danger",
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const displayPlans = [PlanType.STARTER, PlanType.GROW, PlanType.GROW_PRO];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-ev-night">Elige tu plan</h2>
        <p className="mx-auto mb-8 mt-2 max-w-2xl text-[0.9375rem] text-ev-mute">
          {planInfo?.isTrialActive
            ? "Tu período de prueba está activo. Elige un plan para continuar cuando termine."
            : "Para continuar usando EthicVoice, selecciona el plan que mejor se adapte a tus necesidades."}
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <Tabs
            selectedKey={billingCycle}
            onSelectionChange={(key) =>
              handleBillingToggle(key as BillingCycle)
            }
            variant="solid"
            size="lg"
            className="w-auto"
            classNames={{
              tabList: "rounded-full border border-ev-line bg-white p-1",
              cursor: "rounded-full bg-ev-night",
              tab: "px-6 text-sm font-medium rounded-full",
              tabContent: "group-data-[selected=true]:text-white text-ev-mute",
            }}
          >
            <Tab key={BillingCycle.MONTHLY} title="Mensual" />
            <Tab key={BillingCycle.YEARLY} title="Anual · ahorra 10%" />
          </Tabs>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {displayPlans.map((planType) => {
          const config = PLAN_CONFIGS[planType];
          const price = getPrice(planType);
          const isPopular = config.isPopular;
          const isCurrent = planInfo?.planType === planType;
          const priceDisplay = formatPriceForUI(price!);

          return (
            <motion.div
              key={planType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: displayPlans.indexOf(planType) * 0.1,
              }}
              className={`relative flex min-h-[500px] flex-col rounded-2xl bg-white p-6 ${
                isCurrent
                  ? "border-2 border-ev-night"
                  : isPopular
                    ? "border-2 border-ev-signal"
                    : "border border-ev-line"
              }`}
            >
              {/* Recommended Chip */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="rounded-full bg-ev-signal px-3 py-1 text-xs font-medium text-ev-night">
                    Recomendado
                  </span>
                </div>
              )}
              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="rounded-full bg-ev-night px-3 py-1 text-xs font-medium text-white">
                    Tu plan actual
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-ev-night mb-2">
                  {config.displayName.replace("EthicVoice ", "")}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline flex-wrap">
                  <span
                    className={`ev-num font-semibold text-ev-night ${
                      priceDisplay.size === "large"
                        ? "text-2xl md:text-3xl"
                        : priceDisplay.size === "medium"
                          ? "text-xl md:text-2xl"
                          : "text-lg md:text-xl"
                    }`}
                  >
                    {priceDisplay.formatted}
                  </span>
                  <span className="text-sm text-slate-500 ml-1 flex-shrink-0">
                    /{billingCycle === BillingCycle.YEARLY ? "año" : "mes"}
                  </span>
                </div>
                {price && (
                  <div className="text-xs text-slate-400 mt-1">
                    {rates?.COP
                      ? (() => {
                          const monthlyUsd =
                            billingCycle === BillingCycle.YEARLY
                              ? price / 12
                              : price;
                          const estCop = Math.round(monthlyUsd * rates.COP);
                          return `${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(estCop)} COP/mes`;
                        })()
                      : ""}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {config.features.highlights.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <i className="icon-[lucide--check] w-4 h-4 text-ev-moss flex-shrink-0" />
                    <span className="text-sm text-ev-ink">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                <Button
                  onClick={() => handlePlanSelect(config)}
                  disabled={isProcessing && selectedPlan === planType}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isCurrent
                      ? "rounded-full bg-ev-night text-white hover:bg-ev-slate"
                      : isPopular
                        ? "rounded-full bg-ev-signal text-ev-night hover:bg-[#a9dc66]"
                        : "rounded-full border border-ev-night/20 bg-white text-ev-night hover:border-ev-night/50"
                  }`}
                >
                  {isProcessing && selectedPlan === planType
                    ? "Procesando..."
                    : isCurrent
                      ? "Reactivar suscripción"
                      : `Elegir ${config.displayName.replace("EthicVoice ", "")}`}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-slate-500">
          🔒 Pagos seguros procesados por Rebill
        </p>
      </div>
    </div>
  );
}
