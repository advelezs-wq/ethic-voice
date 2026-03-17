"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/use-disclosure";
// Local lightweight toast fallback to avoid build-time dependency issues
const toast = {
  success: (message: string) => {
    try {
      // Attempt dynamic import in client at runtime
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      import("sonner").then((m) => m.toast.success(message)).catch(() => {
        console.log("✅", message);
      });
    } catch {
      console.log("✅", message);
    }
  },
  error: (message: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      import("sonner").then((m) => m.toast.error(message)).catch(() => {
        console.error("❌", message);
      });
    } catch {
      console.error("❌", message);
    }
  },
};
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import InPlatformPricingTable from "@/modules/app/components/subscription/InPlatformPricingTable";

interface SubscriptionInfo {
  id: number;
  planType: string;
  planName: string;
  status: string;
  startDate: string;
  endDate?: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  billingCycle: string;
  isTrialActive: boolean;
  trialDaysRemaining?: number;
  nextChargeDate?: string;
  providerSubscriptionId?: string;
  hasEmailChannel: boolean;
  hasAiProcessing: boolean;
  hasChatbotChannel: boolean;
  hasPhoneChannel: boolean;
  hasAdvancedAnalytics: boolean;
  maxUsers: number;
  maxInvestigators: number;
  maxEmployees: number;
}

interface Invoice {
  id: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  dueDate?: string;
  paidAt?: string;
  description: string;
  downloadUrl?: string;
}

interface SubscriptionManagementProps {
  className?: string;
}

export function SubscriptionManagement({
  className,
}: SubscriptionManagementProps) {
  const { currentOrganization } = useOrganization();
  const { isLoading: planLoading } = usePlanPermissions();

  // State
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancellation, setCancellation] = useState<
    { endsAt?: string | null; daysRemaining?: number | null } | null
  >(null);

  // Modals
  const {
    isOpen: isCancelOpen,
    onOpen: onCancelOpen,
    onClose: onCancelClose,
  } = useDisclosure();
  const {
    isOpen: isUpgradeOpen,
    onOpen: onUpgradeOpen,
    onClose: onUpgradeClose,
  } = useDisclosure();
  const [targetBillingCycle, setTargetBillingCycle] = useState<"MONTHLY" | "YEARLY">();

  // Load subscription data
  useEffect(() => {
    if (currentOrganization?.id) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadSubscriptionData();
    }
    // We intentionally omit loadSubscriptionData from deps to avoid recreating the function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  const loadSubscriptionData = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      // Load subscription info
      console.log("🔍 Loading subscription details for org:", currentOrganization.id);
      const subResponse = await fetch(
        `/api/organization/${currentOrganization.id}/subscription-details`
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();
        console.log("✅ Subscription details loaded:", subData);
        setSubscription(subData.subscription);
      } else {
        const error = await subResponse.text();
        console.error("❌ Failed to load subscription details:", {
          status: subResponse.status,
          statusText: subResponse.statusText,
          error,
        });

        if (subResponse.status !== 404) {
          toast.error(
            `Error al cargar detalles de suscripción: ${subResponse.status}`
          );
        }
      }

      // Load cancellation info from org-status (to show alerts when sub is cancelada)
      try {
        const statusRes = await fetch("/api/users/org-status", { cache: "no-store" });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setCancellation(statusData?.cancellation || null);
        }
      } catch {
        // ignore
      }

      // Load billing history
      console.log("🔍 Loading billing history for org:", currentOrganization.id);
      const invoicesResponse = await fetch(
        `/api/organization/${currentOrganization.id}/billing-history`
      );

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        console.log("✅ Billing history loaded:", invoicesData);
        setInvoices(invoicesData.invoices || []);
      } else {
        const error = await invoicesResponse.text();
        console.error("❌ Failed to load billing history:", {
          status: invoicesResponse.status,
          statusText: invoicesResponse.statusText,
          error,
        });

        toast.error(
          `Error al cargar historial de facturación: ${invoicesResponse.status}`
        );
      }
    } catch (error) {
      console.error("❌ Unexpected error loading subscription data:", error);
      toast.error("Error inesperado al cargar información de suscripción");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setActionLoading(true);

      const response = await fetch(`/api/subscriptions/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          providerSubscriptionId: subscription.providerSubscriptionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel subscription");
      }

      await response.json();

      toast.success("Suscripción cancelada exitosamente");
      onCancelClose();
      loadSubscriptionData(); // Reload data
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al cancelar suscripción"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradeDowngrade = async (newPlanType: PlanType) => {
    if (!subscription || !currentOrganization?.id) return;

    try {
      setActionLoading(true);

      const response = await fetch(`/api/subscriptions/change-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          newPlanType,
          organizationId: currentOrganization.id,
          newBillingCycle: targetBillingCycle || subscription.billingCycle,
          prorationMode: "immediate",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change plan");
      }

      const result = await response.json();

      if (result.payment?.paymentUrl || result.paymentUrl) {
        // Redirect to MercadoPago authorization URL
        window.location.href = result.payment?.paymentUrl || result.paymentUrl;
      } else if (result.changeType === "upgrade") {
        // Some backends might respond 200 with success but no URL yet; enforce polling then reload
        toast.success("Redirigiendo a Mercado Pago para confirmar el cambio...");
        // Soft fallback: refetch in 2s to capture paymentUrl populated asynchronously
        setTimeout(() => loadSubscriptionData(), 2000);
      } else {
        toast.success(`Plan actualizado a ${newPlanType} exitosamente`);
        onUpgradeClose();
        loadSubscriptionData(); // Reload data
      }
    } catch (error) {
      console.error("Error changing plan:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al cambiar plan"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "cancelled":
        return "danger";
      case "paused":
        return "warning";
      case "trial":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "Activa";
      case "cancelled":
        return "Cancelada";
      case "paused":
        return "Pausada";
      case "trial":
        return "Periodo de Prueba";
      default:
        return status;
    }
  };

  const formatPrice = (price: string | number | null | undefined) => {
    const numericPrice =
      typeof price === "string" ? parseFloat(price) : price || 0;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(isNaN(numericPrice) ? 0 : numericPrice);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return "Fecha inválida";
    }
  };

  if (loading || planLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardBody className="py-6">
            <div className="flex items-start gap-3">
              <i className="icon-[lucide--alert-triangle] size-6 text-orange-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {cancellation?.daysRemaining != null && cancellation.daysRemaining <= 31
                    ? "Cuenta próxima a desactivarse"
                    : "No hay suscripción activa"}
                </h3>
                <p className="text-gray-700 mt-1">
                  {cancellation?.daysRemaining != null && cancellation.daysRemaining <= 31
                    ? `Debido a la cancelación de tu suscripción, tu cuenta será desactivada ${
                        cancellation.daysRemaining <= 0
                          ? "hoy"
                          : cancellation.daysRemaining === 1
                            ? "en 1 día"
                            : `en ${cancellation.daysRemaining} días`
                      }.`
                    : "Esta organización no tiene una suscripción activa."}
                </p>
                {cancellation?.endsAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    Fin del ciclo: {new Date(cancellation.endsAt as string).toLocaleDateString("es-CO")}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabla de planes integrada (misma UI que la página de pricing) */}
        <InPlatformPricingTable />
      </div>
    );
  }

  const availablePlans = Object.entries(PLAN_CONFIGS)
    .filter(([planType]) => planType !== subscription.planType && planType !== "PREMIUM")
    .map(([planType, config]) => ({ planType: planType as PlanType, config }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Subscription Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold">Suscripción Actual</h3>
            <Chip color={getStatusColor(subscription.status)} variant="flat">
              {getStatusText(subscription.status)}
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold text-primary">
                  {subscription.planName}
                </h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(
                    subscription.billingCycle === "YEARLY"
                      ? (subscription.yearlyPrice as unknown as number) || subscription.monthlyPrice
                      : subscription.monthlyPrice
                  )}
                  <span className="text-sm font-normal text-gray-600">
                    /{subscription.billingCycle === "MONTHLY" ? "mes" : "año"}
                  </span>
                </p>
              </div>

              {subscription.isTrialActive && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <i className="icon-[lucide--clock] size-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Periodo de prueba activo
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    {subscription.trialDaysRemaining} días restantes
                  </p>
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Fecha de inicio:</strong>{" "}
                  {formatDate(subscription.startDate)}
                </p>
                {subscription.nextChargeDate && (
                  <p>
                    <strong>Próximo cobro:</strong>{" "}
                    {formatDate(subscription.nextChargeDate)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">
                  Características incluidas:
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {PLAN_CONFIGS[subscription.planType as PlanType]?.features?.highlights?.map(
                    (feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <i className="icon-[lucide--check] size-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Límites:</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Administradores:</strong> {subscription.maxUsers}
                  </p>
                  <p>
                    <strong>Investigadores:</strong>{" "}
                    {subscription.maxInvestigators === -1
                      ? "Ilimitados"
                      : subscription.maxInvestigators}
                  </p>
                  <p>
                    <strong>Empleados:</strong> {subscription.maxEmployees}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t">
            {subscription.status === "ACTIVE" && (
              <>
                <Button
                  color="primary"
                  variant="flat"
                  onPress={onUpgradeOpen}
                  startContent={
                    <i className="icon-[lucide--arrow-up] size-4" />
                  }
                >
                  Cambiar Plan
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onCancelOpen}
                  startContent={<i className="icon-[lucide--x] size-4" />}
                >
                  Cancelar Suscripción
                </Button>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold">Historial de Facturación</h3>
            <Button
              variant="flat"
              size="sm"
              onPress={() => window.location.assign('/app/billing/full-history')}
            >
              Ver más
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay facturas disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {invoices
                .filter((invoice) => {
                  try {
                    const d = new Date(invoice.createdAt as string);
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                    return d >= start;
                  } catch {
                    return true;
                  }
                })
                .map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{invoice.description}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(invoice.amount)}
                      </p>
                      <Chip
                        size="sm"
                        color={
                          invoice.status === "paid" ? "success" : "warning"
                        }
                        variant="flat"
                      >
                        {invoice.status === "paid" ? "Pagado" : "Pendiente"}
                      </Chip>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onPress={() => window.open(`/api/invoices/download?id=${encodeURIComponent(String(invoice.id))}`, '_blank')}
                    >
                      <i className="icon-[lucide--download] size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Cancel Subscription Modal */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose} placement="center">
        <ModalContent>
          <ModalHeader>Cancelar Suscripción</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="icon-[lucide--alert-triangle] size-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">
                      ¿Estás seguro?
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      Al cancelar tu suscripción perderás acceso a todas las
                      funcionalidades premium al final del periodo de
                      facturación actual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Plan actual:</strong> {subscription?.planName}
                </p>
                <p>
                  <strong>Fecha de cancelación:</strong> Inmediata
                </p>
                <p>
                  <strong>Acceso hasta:</strong>{" "}
                  {subscription?.nextChargeDate
                    ? formatDate(subscription.nextChargeDate)
                    : "Final del periodo actual"}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCancelClose}>
              Mantener Suscripción
            </Button>
            <Button
              color="danger"
              onPress={handleCancelSubscription}
              isLoading={actionLoading}
            >
              Confirmar Cancelación
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Upgrade/Downgrade Modal */}
      <Modal
        isOpen={isUpgradeOpen}
        onClose={onUpgradeClose}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>Cambiar Plan</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600">
                Selecciona el nuevo plan al que deseas cambiar:
              </p>

              <div className="flex gap-2 mb-2">
                <Button
                  size="sm"
                  variant={targetBillingCycle === "MONTHLY" ? "solid" : "flat"}
                  color="primary"
                  onPress={() => setTargetBillingCycle("MONTHLY")}
                >
                  Mensual
                </Button>
                <Button
                  size="sm"
                  variant={targetBillingCycle === "YEARLY" ? "solid" : "flat"}
                  color="primary"
                  onPress={() => setTargetBillingCycle("YEARLY")}
                >
                  Anual
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePlans.map(({ planType, config }) => (
                  <Card
                    key={planType}
                    isPressable
                    className="border-2 border-transparent hover:border-primary cursor-pointer"
                    onPress={() => handleUpgradeDowngrade(planType)}
                  >
                    <CardBody className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {config.displayName}
                          </h4>
                          <p className="text-2xl font-bold text-primary">
                            {formatPrice(
                              ((targetBillingCycle || subscription.billingCycle) === "YEARLY"
                                ? (config.price.yearly as number)
                                : config.price.monthly) as number
                            )}
                            <span className="text-sm font-normal text-gray-600">
                              /{(targetBillingCycle || subscription.billingCycle) === "YEARLY" ? "año" : "mes"}
                            </span>
                          </p>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <i className="icon-[lucide--users] size-4 text-gray-600" />
                            <span>
                              {config.features.maxUsers} administradores
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="icon-[lucide--user-search] size-4 text-gray-600" />
                            <span>
                              {config.features.maxInvestigators} investigadores
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="icon-[lucide--building] size-4 text-gray-600" />
                            <span>
                              {config.features.maxEmployees} empleados
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onUpgradeClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
