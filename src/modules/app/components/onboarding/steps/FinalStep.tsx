"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Button,
  Switch,
  Card,
  CardBody,
  Divider,
  Tabs,
  Tab,
} from "@heroui/react";
import { Input } from "@heroui/react";
import type { OrganizationResource } from "@clerk/types";
import { OnboardingContextType } from "../OnboardingClient";

interface FinalStepProps {
  context: OnboardingContextType;
}

export function FinalStep({ context }: FinalStepProps) {
  const [notificationSettings, setNotificationSettings] = useState({
    emailReportAssigned: true,
    emailReportStatusChanged: true,
    emailReportComment: false,
    inAppReportAssigned: true,
    inAppReportStatusChanged: true,
    inAppReportComment: true,
    enableDailyDigest: false,
    enableWeeklyDigest: true,
  });

  const [activeTab, setActiveTab] = useState("organization");
  const [organizationCreated, setOrganizationCreated] = useState(false);

  // Save notification settings to localStorage to persist across redirect
  useEffect(() => {
    localStorage.setItem(
      "onboarding_notifications",
      JSON.stringify(notificationSettings)
    );
  }, [notificationSettings]);

  const handleSettingChange = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleOrganizationCreated = () => {
    // Instead of redirecting, show success and switch to notifications tab
    setOrganizationCreated(true);
    setTimeout(() => {
      setActiveTab("notifications");
    }, 1500);
  };

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const createOrg = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (res.ok) {
        handleOrganizationCreated();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleFinishOnboarding = async () => {
    context.setIsCreatingOrganization(true);

    try {
      // Save notification settings
      await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationSettings),
      });

      // Clear localStorage
      localStorage.removeItem("onboarding_notifications");

      // Complete onboarding
      window.location.href = "/app";
    } catch (error) {
      console.error("Error saving notification settings:", error);
      // Still redirect even if notification settings fail
      window.location.href = "/app";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">{organizationCreated ? "✅" : "🏢"}</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {organizationCreated
            ? "¡Organización creada!"
            : "Crear tu organización"}
        </h2>
        <p className="text-gray-600">
          {organizationCreated
            ? "Ahora configura tus notificaciones para finalizar"
            : "Último paso: crea tu organización y configura tus notificaciones"}
        </p>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
        classNames={{
          tabList: "grid w-full grid-cols-2",
        }}
      >
        <Tab
          key="organization"
          title="Crear Organización"
          isDisabled={organizationCreated}
        >
          <Card>
            <CardBody className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Información de tu organización
                </h3>
                {context.organizationData && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Nombre:</span>{" "}
                      {context.organizationData.organizationName}
                    </p>
                    {context.organizationData.description && (
                      <p className="text-sm text-blue-700 mt-1">
                        <span className="font-medium">Descripción:</span>{" "}
                        {context.organizationData.description}
                      </p>
                    )}
                    <p className="text-sm text-blue-700 mt-1">
                      <span className="font-medium">Tipo:</span>{" "}
                      {context.organizationData.organizationType}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      <span className="font-medium">Tamaño:</span>{" "}
                      {context.organizationData.teamSize}
                    </p>
                  </div>
                )}
              </div>

              {organizationCreated ? (
                <div className="text-center py-8 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">✓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    ¡Organización creada exitosamente!
                  </h3>
                  <p className="text-green-700">
                    Ahora ve a la pestaña de notificaciones para finalizar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input label="Nombre de la organización" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input label="Slug (opcional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                  <Button color="primary" isLoading={creating} onPress={createOrg}>Crear organización</Button>
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="notifications"
          title="Notificaciones"
          isDisabled={!organizationCreated}
        >
          <Card>
            <CardBody className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notificaciones por Email
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Casos asignados
                        </p>
                        <p className="text-sm text-gray-600">
                          Cuando te asignen un nuevo caso
                        </p>
                      </div>
                      <Switch
                        isSelected={notificationSettings.emailReportAssigned}
                        onValueChange={(value) =>
                          handleSettingChange("emailReportAssigned", value)
                        }
                        color="primary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Cambios de estado
                        </p>
                        <p className="text-sm text-gray-600">
                          Cuando un caso cambie de estado
                        </p>
                      </div>
                      <Switch
                        isSelected={
                          notificationSettings.emailReportStatusChanged
                        }
                        onValueChange={(value) =>
                          handleSettingChange("emailReportStatusChanged", value)
                        }
                        color="primary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Nuevos comentarios
                        </p>
                        <p className="text-sm text-gray-600">
                          Cuando alguien comente en un caso
                        </p>
                      </div>
                      <Switch
                        isSelected={notificationSettings.emailReportComment}
                        onValueChange={(value) =>
                          handleSettingChange("emailReportComment", value)
                        }
                        color="primary"
                      />
                    </div>
                  </div>

                  <Divider className="my-6" />

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notificaciones en la Plataforma
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Casos asignados
                        </p>
                        <p className="text-sm text-gray-600">
                          Alertas dentro de la plataforma
                        </p>
                      </div>
                      <Switch
                        isSelected={notificationSettings.inAppReportAssigned}
                        onValueChange={(value) =>
                          handleSettingChange("inAppReportAssigned", value)
                        }
                        color="primary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Cambios de estado
                        </p>
                        <p className="text-sm text-gray-600">
                          Alertas dentro de la plataforma
                        </p>
                      </div>
                      <Switch
                        isSelected={
                          notificationSettings.inAppReportStatusChanged
                        }
                        onValueChange={(value) =>
                          handleSettingChange("inAppReportStatusChanged", value)
                        }
                        color="primary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Nuevos comentarios
                        </p>
                        <p className="text-sm text-gray-600">
                          Alertas dentro de la plataforma
                        </p>
                      </div>
                      <Switch
                        isSelected={notificationSettings.inAppReportComment}
                        onValueChange={(value) =>
                          handleSettingChange("inAppReportComment", value)
                        }
                        color="primary"
                      />
                    </div>
                  </div>

                  <Divider className="my-6" />

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resúmenes
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Resumen diario
                        </p>
                        <p className="text-sm text-gray-600">
                          Email con actividad del día
                        </p>
                      </div>
                      <Switch
                        isSelected={notificationSettings.enableDailyDigest}
                        onValueChange={(value) =>
                          handleSettingChange("enableDailyDigest", value)
                        }
                        color="primary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Resumen semanal
                        </p>
                        <p className="text-sm text-gray-600">
                          Email con actividad de la semana
                        </p>
                      </div>
                      <Switch
                        isSelected={notificationSettings.enableWeeklyDigest}
                        onValueChange={(value) =>
                          handleSettingChange("enableWeeklyDigest", value)
                        }
                        color="primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Finish Button in Notifications Tab */}
                <div className="pt-6 border-t border-gray-200">
                  <Button
                    color="primary"
                    size="lg"
                    onPress={handleFinishOnboarding}
                    isLoading={context.isCreatingOrganization}
                    className="w-full"
                  >
                    {context.isCreatingOrganization
                      ? "Finalizando..."
                      : "Finalizar Configuración"}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Podrás cambiar estas configuraciones más tarde desde tu
                    perfil
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <div className="flex gap-4 justify-between mt-6">
        <Button
          variant="bordered"
          onPress={context.goToPreviousStep}
          className="px-8"
        >
          Anterior
        </Button>

        <div className="text-sm text-gray-600 self-center">
          {organizationCreated
            ? "¡Excelente! Ahora configura tus notificaciones →"
            : "Crea tu organización para continuar →"}
        </div>
      </div>
    </motion.div>
  );
}
