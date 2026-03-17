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
        title: "¡Email creado exitosamente!",
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Configuración de Email para Reportes
      </h1>

      {!emailConfig ? (
        <Card>
          <CardBody className="text-center py-12">
            <i
              className="icon-[lucide--mail] size-16 mx-auto mb-4 text-gray-400"
              role="img"
              aria-hidden="true"
            />
            <h2 className="text-xl font-semibold mb-2">
              Activa la recepción de reportes por email
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Crea una dirección de email única para tu organización donde los
              usuarios podrán enviar reportes directamente.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-sm text-blue-900">
                Tu email será:{" "}
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
              Crear Email de Reportes
            </Button>

            <div className="mt-8 text-sm text-gray-500">
              <p>
                Puedes desactivar o cambiar esta configuración en cualquier
                momento.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Bandeja activa</h2>
              <Badge color="success" variant="flat">
                Activa
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-gray-700">
              Dirección: <strong>{emailConfig.emailAddress}</strong>
            </p>
            <div>
              <Button size="sm" onPress={copyEmail}>
                Copiar dirección
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
