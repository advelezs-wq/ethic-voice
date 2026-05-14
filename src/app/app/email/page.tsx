// app/app/settings/email/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import { Button } from "@heroui/react";
import { Badge } from "@heroui/react";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";

export default function EmailSetupPage() {
  const { currentOrganization } = useOrganization();
  const {
    planInfo,
    permissions,
    isLoading: planLoading,
  } = usePlanPermissions();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingActivation, setTogglingActivation] = useState(false);

  useEffect(() => {
    // If the plan cannot access the email channel, don't fetch config
    if (permissions && !permissions.canAccessEmailChannel) {
      setLoading(false);
      return;
    }

    if (currentOrganization?.id && permissions?.canAccessEmailChannel) {
      fetchEmailConfig();
    }
  }, [currentOrganization?.id, permissions]);

  const fetchEmailConfig = async () => {
    try {
      const response = await fetch("/api/organization/email/config");
      if (!response.ok) {
        // If unauthorized or other error, just stop loading gracefully
        setEmailConfig(null);
        return;
      }
      const data = await response.json();
      setEmailConfig(data.config);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const createEmail = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/organization/email/create", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error ||
            error.message ||
            "Tu plan no incluye la bandeja de entrada por email. Actualiza tu plan."
        );
      }

      const data = await response.json();
      setEmailConfig(data.config);
      addToast({
        title: "Bandeja creada",
        description:
          "La bandeja quedó en estado pendiente. Actívala manualmente para iniciar detección de denuncias.",
        color: "success",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      addToast({
        title: error.message || "Error creando email",
        color: "danger",
      });
    } finally {
      setCreating(false);
    }
  };

  const setActivation = async (activate: boolean) => {
    setTogglingActivation(true);
    try {
      const response = await fetch("/api/organization/email/activation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activate }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar la activación");
      }

      setEmailConfig(data.config);
      addToast({
        title: activate ? "Bandeja activada" : "Bandeja desactivada",
        description: data?.message,
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo actualizar el estado",
        color: "danger",
      });
    } finally {
      setTogglingActivation(false);
    }
  };

  const copyEmail = () => {
    if (emailConfig?.emailAddress)
      navigator.clipboard.writeText(emailConfig.emailAddress);
    addToast({
      title: "Email copiado al portapapeles",
      color: "success",
    });
  };
  if (loading || planLoading)
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner className="size-12" />
      </div>
    );

  // If plan cannot access email channel, show upgrade CTA
  if (!permissions?.canAccessEmailChannel) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">
              Canal de correo no disponible en tu plan
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-gray-700">
              Tu plan actual ({planInfo?.planType ?? "DESCONOCIDO"}) no incluye
              una bandeja de entrada para denuncias por correo.
            </p>
            <p className="text-gray-600">
              Para activar el canal de correo y recibir denuncias enviadas a{" "}
              <strong>{currentOrganization?.slug}@ethicvoice.co</strong>,
              actualiza tu plan.
            </p>
            <div>
              <Button
                color="primary"
                onPress={() => (window.location.href = "/app/billing")}
              >
                Ver planes y actualizar
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <section className="ev-page-hero">
        <p className="ev-page-hero-kicker">Canal de correo</p>
        <h1 className="ev-page-hero-title">Bandeja de entrada para denuncias</h1>
        <p className="ev-page-hero-description">
          Configura, activa y controla la detección de denuncias por email de forma segura.
        </p>
      </section>

      {!emailConfig ? (
        <Card className="border border-emerald-100 bg-white/95 shadow-none">
          <CardBody className="text-center py-12">
            <i
              className="icon-[lucide--mail] size-16 mx-auto mb-4 text-gray-400"
              role="img"
              aria-hidden="true"
            />
            <h2 className="text-xl font-semibold mb-2 text-[#0d212c]">
              Crea tu bandeja de entrada
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Se reservará una dirección única para tu organización. Luego podrás
              activarla manualmente para empezar a detectar denuncias.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-sm text-emerald-900">
                Email preasignado:{" "}
                <strong>{currentOrganization?.slug}@ethicvoice.co</strong>
              </p>
            </div>

            <Button
              color="primary"
              size="lg"
              onPress={createEmail}
              isLoading={creating}
              startContent={
                <i
                  className="icon-[lucide--sparkles] size-5"
                  role="img"
                  aria-hidden="true"
                />
              }
            >
              Crear bandeja
            </Button>

            <div className="mt-8 text-sm text-gray-500">
              <p>
                La detección de denuncias solo inicia cuando la bandeja esté activa.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="border border-emerald-100 bg-white/95 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between w-full flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-[#0d212c]">
                Estado de la bandeja
              </h2>
              <Badge
                color={emailConfig.isActive ? "success" : "warning"}
                variant="flat"
              >
                {emailConfig.isActive ? "Activa" : "Pendiente de activación"}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-5">
            <p className="text-gray-700">
              Dirección: <strong>{emailConfig.emailAddress}</strong>
            </p>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <p className="text-sm text-emerald-900">
                {emailConfig.isActive
                  ? "La bandeja está activa. Los correos entrantes al alias configurado se detectarán y procesarán."
                  : "La bandeja está inactiva. No se detectarán denuncias por correo hasta que la actives."}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" onPress={copyEmail} variant="bordered">
                Copiar dirección
              </Button>
              {emailConfig.isActive ? (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => setActivation(false)}
                  isLoading={togglingActivation}
                >
                  Desactivar bandeja
                </Button>
              ) : (
                <Button
                  size="sm"
                  color="primary"
                  onPress={() => setActivation(true)}
                  isLoading={togglingActivation}
                >
                  Activar bandeja
                </Button>
              )}
            </div>

            {Array.isArray(emailConfig?.auditEvents) &&
              emailConfig.auditEvents.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-white p-4">
                  <p className="text-sm font-semibold text-[#0d212c] mb-3">
                    Historial de activación
                  </p>
                  <div className="space-y-2">
                    {emailConfig.auditEvents
                      .slice()
                      .reverse()
                      .slice(0, 6)
                      .map(
                        (
                          event: {
                            type: string;
                            timestamp?: string;
                            reason?: string | null;
                            actorEmail?: string | null;
                          },
                          idx: number
                        ) => (
                          <div
                            key={`${event.type}-${event.timestamp || idx}-${idx}`}
                            className="text-xs text-gray-700 border-b border-emerald-50 pb-2 last:border-0 last:pb-0"
                          >
                            <p className="font-medium text-emerald-900">
                              {event.type === "EMAIL_INBOX_ACTIVATED"
                                ? "Bandeja activada"
                                : event.type === "EMAIL_INBOX_DEACTIVATED"
                                  ? "Bandeja desactivada"
                                  : event.type === "EMAIL_INBOX_AUTO_DEACTIVATED_PLAN"
                                    ? "Desactivación automática por plan"
                                    : "Configuración creada"}
                            </p>
                            <p className="text-gray-500">
                              {event.timestamp
                                ? new Date(event.timestamp).toLocaleString("es-MX")
                                : "Fecha no disponible"}
                              {event.actorEmail ? ` · ${event.actorEmail}` : ""}
                            </p>
                            {event.reason && (
                              <p className="text-gray-600 mt-0.5">{event.reason}</p>
                            )}
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
