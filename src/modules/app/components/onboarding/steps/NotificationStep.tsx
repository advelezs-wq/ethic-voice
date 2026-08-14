"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button, Switch, Card, CardBody, Divider } from "@heroui/react";
import { OnboardingContextType } from "../OnboardingClient";

interface NotificationStepProps {
  context: OnboardingContextType;
}

export function NotificationStep({ context }: NotificationStepProps) {
  const {
    notificationSettings,
    setNotificationSettings,
    goToNextStep,
    goToPreviousStep,
  } = context;

  const handleSettingChange = (key: string, value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: value,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔔</span>
        </div>
        <h2 className="text-2xl font-bold text-[#0d212c] mb-2">
          Configuración de Notificaciones
        </h2>
        <p className="text-slate-500">
          Personaliza cómo y cuándo quieres recibir notificaciones sobre los
          casos
        </p>
      </div>

      <Card className="mb-6">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-[#0d212c] mb-4">
            Notificaciones por Email
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0d212c]">Casos asignados</p>
                <p className="text-sm text-slate-500">
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
                <p className="font-medium text-[#0d212c]">Cambios de estado</p>
                <p className="text-sm text-slate-500">
                  Cuando un caso cambie de estado
                </p>
              </div>
              <Switch
                isSelected={notificationSettings.emailReportStatusChanged}
                onValueChange={(value) =>
                  handleSettingChange("emailReportStatusChanged", value)
                }
                color="primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0d212c]">Nuevos comentarios</p>
                <p className="text-sm text-slate-500">
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

          <h3 className="text-lg font-semibold text-[#0d212c] mb-4">
            Notificaciones en la Plataforma
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0d212c]">Casos asignados</p>
                <p className="text-sm text-slate-500">
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
                <p className="font-medium text-[#0d212c]">Cambios de estado</p>
                <p className="text-sm text-slate-500">
                  Alertas dentro de la plataforma
                </p>
              </div>
              <Switch
                isSelected={notificationSettings.inAppReportStatusChanged}
                onValueChange={(value) =>
                  handleSettingChange("inAppReportStatusChanged", value)
                }
                color="primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0d212c]">Nuevos comentarios</p>
                <p className="text-sm text-slate-500">
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

          <h3 className="text-lg font-semibold text-[#0d212c] mb-4">
            Resúmenes
          </h3>

          <div className="space-y-4">
            {/*
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0d212c]">Resumen diario</p>
                <p className="text-sm text-slate-500">
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
            */}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0d212c]">Resumen semanal</p>
                <p className="text-sm text-slate-500">
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
        </CardBody>
      </Card>

      <div className="flex gap-4 justify-between">
        <Button variant="bordered" onPress={goToPreviousStep} className="px-8">
          Anterior
        </Button>

        <Button color="primary" onPress={goToNextStep} className="px-8">
          Continuar
        </Button>
      </div>
    </motion.div>
  );
}
