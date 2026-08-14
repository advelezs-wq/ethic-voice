"use client";

import React, { useState } from "react";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Tabs,
  Tab,
} from "@heroui/react";
import { motion } from "framer-motion";
import {
  PlanConfig,
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
  formatPriceForUI,
} from "@/types/subscription.types";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { PlanWidget } from "@/modules/app/components/subscription/PlanWidget";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
// Removed CheckIcon import - using iconify icons instead

export default function UpgradePage() {
  const { openCalendly } = useCalendlyGate();
  const { planInfo } = usePlanPermissions();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    BillingCycle.MONTHLY
  );

  const feature = searchParams.get("feature");

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

  const handleUpgrade = async (plan: PlanConfig) => {
    if (plan.isEnterprise) {
      openCalendly();
      return;
    }

    setSelectedPlan(plan.type);
    setIsProcessing(true);

    try {
      // Create Rebill upgrade subscription
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: plan.type,
          billingCycle: billingCycle,
          returnUrl: "/app",
          openSidebar: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create upgrade subscription");
      }

      const data = await response.json();
      if (data?.subscription?.paymentUrl) {
        window.location.href = data.subscription.paymentUrl;
      } else {
        window.location.href = "/app";
      }
    } catch (error) {
      console.error("Error creating upgrade:", error);
      window.location.href = `/pricing?upgrade=true&plan=${plan.type}`;
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#f7faf9] flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!planInfo) {
    return (
      <div className="min-h-screen bg-[#f7faf9] flex items-center justify-center">
        <Card>
          <CardBody>
            <p className="text-center text-slate-400">
              Unable to load plan information
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Get available upgrade plans
  const currentPlanIndex = Object.values(PlanType).indexOf(planInfo.planType);
  const availablePlans = Object.values(PLAN_CONFIGS).filter((plan, index) => {
    return index > currentPlanIndex; // Only show higher tier plans
  });

  return (
    <>
      {/* Removed MercadoPago SDK (migrated to Rebill) */}

      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                as="a"
                href="/app/settings"
                variant="light"
                size="sm"
                startContent={
                  <i className="icon-[lucide--arrow-left] w-4 h-4" />
                }
              >
                Volver a Configuración
              </Button>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                  Planes y precios
                </p>
                <h1 className="text-4xl font-extrabold text-[#0d212c]">Plan</h1>
                <p className="text-slate-500 mt-1">
                  {feature ? (
                    <>
                      Desbloquea <strong>{feature}</strong> y más con un plan
                      superior
                    </>
                  ) : (
                    <>Obtén acceso a más características y capacidades</>
                  )}
                </p>
              </div>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center">
              <Tabs
                selectedKey={billingCycle}
                onSelectionChange={(key) =>
                  handleBillingToggle(key as BillingCycle)
                }
                variant="solid"
                size="lg"
                className="w-auto"
                classNames={{
                  tabList: "bg-emerald-50 rounded-full p-1",
                  cursor: "bg-[#0d212c] rounded-full shadow-lg",
                  tab: "px-6 py-2 text-sm font-medium rounded-full transition-all duration-300",
                  tabContent:
                    "group-data-[selected=true]:text-white text-[#0d212c]",
                }}
              >
                <Tab key={BillingCycle.MONTHLY} title="Mensual" />
                <Tab key={BillingCycle.YEARLY} title="Anual (10% descuento)" />
              </Tabs>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Current Plan Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                <PlanWidget />

                {feature && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">
                        Solicitud de Funcionalidad
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-2">
                        <i className="icon-[lucide--zap] w-4 h-4 text-emerald-600" />
                        <span className="font-medium">{feature}</span>
                      </div>
                      <p className="text-sm text-slate-500">
                        Esta funcionalidad no está disponible en tu plan actual.
                        Actualiza para desbloquear esta y muchas otras
                        capacidades.
                      </p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>

            {/* Available Plans */}
            <div className="lg:col-span-3">
              {availablePlans.length === 0 ? (
                <Card className="text-center py-12">
                  <CardBody>
                    <i className="icon-[lucide--crown] w-16 h-16 text-lime-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#0d212c] mb-2">
                      ¡Ya estás en el nivel más alto!
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Tienes acceso a todas las funcionalidades disponibles en
                      nuestro plan Premium.
                    </p>
                    <Button as="a" href="/app/settings" color="primary">
                      Volver a Configuración
                    </Button>
                  </CardBody>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Pricing Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {availablePlans.map((plan, index) => {
                      const price = getPrice(plan.type);
                      const isPopular = plan.isPopular;
                      const priceDisplay = formatPriceForUI(price!);

                      return (
                        <motion.div
                          key={plan.type}
                          initial={{ opacity: 0, transform: "translateY(20px)" }}
                          animate={{ opacity: 1, transform: "translateY(0)" }}
                          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: index * 0.06 }}
                          className={`relative flex min-h-[600px] flex-col rounded-2xl p-8 transition-transform duration-300 hover:-translate-y-1 ${
                            isPopular
                              ? "bg-[#0f172a] shadow-[0_24px_60px_rgba(15,23,42,0.38)] ring-2 ring-lime-400"
                              : "border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-xl"
                          }`}
                        >
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="rounded-full bg-lime-400 px-4 py-1 text-[11px] font-black uppercase tracking-wide text-[#052b24] shadow-[0_8px_18px_rgba(163,230,53,0.35)]">
                                Más popular
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <div className="mb-6">
                            <h3 className={`text-2xl font-extrabold mb-2 ${isPopular ? "text-white" : "text-[#0d212c]"}`}>
                              {plan.displayName}
                            </h3>
                            <p className={`text-sm leading-relaxed ${isPopular ? "text-white/55" : "text-slate-500"}`}>
                              {plan.description}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="mb-6">
                            {plan.isEnterprise ? (
                              <div className={`text-3xl font-black ${isPopular ? "text-white" : "text-[#0d212c]"}`}>
                                Contactar
                              </div>
                            ) : (
                              <div className="flex items-baseline flex-wrap">
                                <span
                                  className={`font-black ${isPopular ? "text-white" : "text-[#0d212c]"} ${
                                    priceDisplay.size === "large"
                                      ? "text-3xl md:text-4xl"
                                      : priceDisplay.size === "medium"
                                        ? "text-2xl md:text-3xl"
                                        : "text-xl md:text-2xl"
                                  }`}
                                >
                                  {priceDisplay.formatted}
                                </span>
                                <span className={`text-sm ml-1 flex-shrink-0 ${isPopular ? "text-white/50" : "text-slate-400"}`}>
                                  /
                                  {billingCycle === BillingCycle.YEARLY
                                    ? "año"
                                    : "mes"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Features */}
                          <div className="space-y-3 mb-8 flex-1">
                            {plan.features.highlights.map(
                              (feature, featureIndex) => (
                                <div
                                  key={featureIndex}
                                  className="flex items-start gap-2"
                                >
                                  <i className={`icon-[lucide--circle-check] mt-0.5 w-4 h-4 flex-shrink-0 ${isPopular ? "text-lime-300" : "text-emerald-600"}`} />
                                  <span className={`text-sm ${isPopular ? "text-white/75" : "text-slate-600"}`}>
                                    {feature}
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          {/* Price Comparison */}
                          {!plan.isEnterprise && planInfo && (
                            <div className={`rounded-xl p-4 mb-6 ${isPopular ? "bg-white/[0.08] ring-1 ring-white/10" : "bg-emerald-50"}`}>
                              <div className="text-center">
                                <p className={`text-sm ${isPopular ? "text-white/70" : "text-emerald-800"}`}>
                                  <strong>Ahorro vs Plan Actual</strong>
                                </p>
                                <p className={`text-lg font-bold ${isPopular ? "text-lime-300" : "text-emerald-600"}`}>
                                  Mejora por solo +
                                  {
                                    formatPriceForUI(
                                      price! -
                                        (getPrice(planInfo.planType) || 0)
                                    ).formatted
                                  }
                                  /
                                  {billingCycle === BillingCycle.YEARLY
                                    ? "año"
                                    : "mes"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* CTA Button */}
                          <div className="mt-auto">
                            <Button
                              onClick={() => handleUpgrade(plan)}
                              disabled={
                                isProcessing && selectedPlan === plan.type
                              }
                              className={`w-full rounded-xl py-3.5 px-6 text-sm font-bold transition-all duration-200 ${
                                isPopular
                                  ? "bg-lime-400 text-[#052b24] shadow-[0_6px_20px_rgba(163,230,53,0.3)] hover:bg-lime-300"
                                  : "border-2 border-[#0a1e14] text-[#0a1e14] hover:bg-[#0a1e14] hover:text-white"
                              }`}
                            >
                              {isProcessing && selectedPlan === plan.type
                                ? "Procesando..."
                                : plan.isEnterprise
                                  ? "Contactar Ventas"
                                  : "Iniciar Sesión y Continuar"}
                            </Button>

                            {!plan.isEnterprise && (
                              <p className={`text-xs text-center mt-2 ${isPopular ? "text-white/40" : "text-slate-400"}`}>
                                Mejora instantánea • Facturación prorrateada
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
