"use client";

import React, { useState, useEffect } from "react";
import { PlanType, BillingCycle, PLAN_CONFIGS, isPlanUpgrade, calculatePriceDifference, getFeatureDifferences, formatPrice } from "@/types/subscription.types";
import { useExchangeRate } from "@/modules/core/hooks/useExchangeRate";

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: {
    id: number;
    planType: PlanType;
    billingCycle: BillingCycle;
    status: string;
  };
  onPlanChanged: (newPlan: PlanType, newBilling?: BillingCycle) => void;
}

export default function PlanChangeModal({
  isOpen,
  onClose,
  currentSubscription,
  onPlanChanged,
}: PlanChangeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    currentSubscription.planType
  );
  const [selectedBilling, setSelectedBilling] = useState<BillingCycle>(
    currentSubscription.billingCycle
  );
  const [prorationMode, setProrationMode] = useState<
    "immediate" | "next_cycle"
  >("immediate");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { rates } = useExchangeRate({ base: "COP", symbols: ["USD"] });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(currentSubscription.planType);
      setSelectedBilling(currentSubscription.billingCycle);
      setError(null);
    }
  }, [isOpen, currentSubscription]);

  const isUpgrade = isPlanUpgrade(currentSubscription.planType, selectedPlan);
  const [estimate, setEstimate] = useState<{
    prorationAmount: number;
    amountToCharge: number;
    nextCycleAmount: number;
    currency: string;
  } | null>(null);
  const { newFeatures, removedFeatures } = getFeatureDifferences(
    currentSubscription.planType,
    selectedPlan
  );

  const currentPlanConfig = PLAN_CONFIGS[currentSubscription.planType];
  const selectedPlanConfig = PLAN_CONFIGS[selectedPlan];

  const isNoChange =
    selectedPlan === currentSubscription.planType &&
    selectedBilling === currentSubscription.billingCycle;

  useEffect(() => {
    if (!isOpen) return;
    if (
      selectedPlan === currentSubscription.planType &&
      selectedBilling === currentSubscription.billingCycle
    ) {
      setEstimate(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/subscriptions/change-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: currentSubscription.id,
            newPlanType: selectedPlan,
            newBillingCycle: selectedBilling,
            prorationMode,
            estimate: true,
          }),
        });
        const data = await res.json();
        if (res.ok && data.estimate) {
          setEstimate({
            prorationAmount: data.estimate.prorationAmount,
            amountToCharge: data.estimate.amountToCharge,
            nextCycleAmount: data.estimate.nextCycleAmount,
            currency: data.estimate.currency,
          });
        } else {
          setEstimate(null);
        }
      } catch {
        setEstimate(null);
      }
    })();
  }, [isOpen, selectedPlan, selectedBilling, prorationMode, currentSubscription]);

  const handlePlanChange = async () => {
    if (isNoChange) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          newPlanType: selectedPlan,
          newBillingCycle: selectedBilling,
          prorationMode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change plan");
      }

      onPlanChanged(selectedPlan, selectedBilling);
      onClose();
    } catch (error) {
      console.error("Error changing plan:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              Cambiar Plan de Suscripción
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar modal"
            >
              <i className="icon-[lucide--x] w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Plan actual:{" "}
            <span className="font-semibold">
              {currentPlanConfig.displayName}
            </span>
          </p>
        </div>

        {/* Plan Selection */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Object.entries(PLAN_CONFIGS).map(([planKey, config]) => {
              if (planKey === "PREMIUM") return null; // Skip contact-us plan

              const planType = planKey as PlanType;
              const isSelected = selectedPlan === planType;
              const isCurrent = currentSubscription.planType === planType;

              return (
                <div
                  key={planKey}
                  className={`
                    relative border-2 rounded-lg p-6 cursor-pointer transition-all
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }
                    ${isCurrent ? "ring-2 ring-green-200" : ""}
                  `}
                  onClick={() => setSelectedPlan(planType)}
                >
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Actual
                    </div>
                  )}

                  {config.isPopular && (
                    <div className="absolute -top-2 left-4 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      Popular
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {config.displayName}
                    </h3>

                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {selectedBilling === "YEARLY" && config.price.yearly
                          ? formatPrice(config.price.yearly)
                          : formatPrice(config.price.monthly || 0)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedBilling === "YEARLY" ? "por año" : "por mes"}
                      </div>
                      {rates?.USD && (
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedBilling === "YEARLY" && config.price.yearly
                            ? `≈ $${(config.price.yearly * rates.USD).toFixed(2)} USD/${"year"}`
                            : `≈ $${((config.price.monthly || 0) * rates.USD).toFixed(2)} USD/${"mo"}`}
                        </div>
                      )}
                      {selectedBilling === "YEARLY" &&
                        config.price.yearly &&
                        config.price.monthly && (
                          <div className="text-xs text-green-600 font-medium">
                            Ahorra 20% anual
                          </div>
                        )}
                    </div>

                    <div className="text-left space-y-2">
                      <div className="text-sm text-gray-600">
                        •{" "}
                        {config.features.maxUsers === -1
                          ? "Usuarios ilimitados (∞)"
                          : `${config.features.maxUsers} usuario(s)`}
                      </div>
                      <div className="text-sm text-gray-600">
                        •{" "}
                        {config.features.maxInvestigators === -1
                          ? "Investigadores ilimitados (∞)"
                          : `${config.features.maxInvestigators} investigadores`}
                      </div>
                      <div className="text-sm text-gray-600">
                        •{" "}
                        {config.features.maxEmployees === -1
                          ? "Empleados ilimitados (∞)"
                          : `Hasta ${config.features.maxEmployees} empleados`}
                      </div>
                      {config.features.hasEmailChannel && (
                        <div className="text-sm text-gray-600">
                          • Canal de email
                        </div>
                      )}
                      {config.features.hasAiProcessing && (
                        <div className="text-sm text-gray-600">
                          • Procesamiento IA
                        </div>
                      )}
                      {config.features.hasChatbotChannel && (
                        <div className="text-sm text-gray-600">
                          • Canal chatbot
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Billing Cycle Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Ciclo de Facturación
            </h3>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="billing"
                  value="MONTHLY"
                  checked={selectedBilling === "MONTHLY"}
                  onChange={(e) =>
                    setSelectedBilling(e.target.value as BillingCycle)
                  }
                  className="text-blue-600"
                />
                <span>Mensual</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="billing"
                  value="YEARLY"
                  checked={selectedBilling === "YEARLY"}
                  onChange={(e) =>
                    setSelectedBilling(e.target.value as BillingCycle)
                  }
                  className="text-blue-600"
                />
                <span>Anual (20% descuento)</span>
              </label>
            </div>
          </div>

          {/* Change Summary */}
          {!isNoChange && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Resumen del Cambio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Plan Actual
                  </h4>
                  <p className="text-sm text-gray-600">
                    {currentPlanConfig.displayName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentSubscription.billingCycle === "YEARLY"
                      ? "Anual"
                      : "Mensual"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Nuevo Plan</h4>
                  <p className="text-sm text-gray-600">
                    {selectedPlanConfig.displayName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedBilling === "YEARLY" ? "Anual" : "Mensual"}
                  </p>
                </div>
              </div>

              {estimate && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Resumen de pago</h4>
                  {isUpgrade ? (
                    <p className="text-sm font-medium text-orange-600">
                      Con tu plan y consumo actuales pagarás {formatPrice(estimate.amountToCharge)} ahora (prorrateo) y el siguiente ciclo continuarás pagando {formatPrice(estimate.nextCycleAmount)}.
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-green-700">
                      Downgrade: no se te cobrará ahora. Desde el siguiente ciclo pagarás {formatPrice(estimate.nextCycleAmount)}.
                    </p>
                  )}
                </div>
              )}

              {/* Feature Changes */}
              {(newFeatures.length > 0 || removedFeatures.length > 0) && (
                <div className="mb-4">
                  {newFeatures.length > 0 && (
                    <div className="mb-2">
                      <h4 className="font-medium text-green-700 mb-1">
                        Nuevas Funcionalidades
                      </h4>
                      <ul className="text-sm text-green-600 space-y-1">
                        {newFeatures.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {removedFeatures.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-1">
                        Funcionalidades que se Perderán
                      </h4>
                      <ul className="text-sm text-red-600 space-y-1">
                        {removedFeatures.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Proration Mode */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Cuándo Aplicar el Cambio
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="proration"
                      value="immediate"
                      checked={prorationMode === "immediate"}
                      onChange={(e) =>
                        setProrationMode(
                          e.target.value as "immediate" | "next_cycle"
                        )
                      }
                      className="text-blue-600"
                    />
                    <span className="text-sm">
                      Inmediatamente (se prorrateará el período actual)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="proration"
                      value="next_cycle"
                      checked={prorationMode === "next_cycle"}
                      onChange={(e) =>
                        setProrationMode(
                          e.target.value as "immediate" | "next_cycle"
                        )
                      }
                      className="text-blue-600"
                    />
                    <span className="text-sm">
                      Al final del período de facturación actual
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <i className="icon-[lucide--alert-circle] w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handlePlanChange}
            disabled={isNoChange || isLoading}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all
              ${
                isNoChange || isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : isUpgrade
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : isNoChange ? (
              "Sin cambios"
            ) : isUpgrade ? (
              `Actualizar a ${selectedPlanConfig.displayName}`
            ) : (
              `Cambiar a ${selectedPlanConfig.displayName}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
