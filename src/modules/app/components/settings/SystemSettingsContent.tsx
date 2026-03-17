"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Tabs, Tab } from "@heroui/react";
import { LogoUploadSection } from "./LogoUploadSection";
import { EnhancedThemeSelector } from "./EnhancedThemeSelector";
import { EnhancedDashboardLayoutSection } from "./EnhancedDashboardLayoutSection";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { Button, Card as UiCard } from "@heroui/react";

interface SystemSettingsContentProps {
  organizationId: string;
}

export function SystemSettingsContent({
  organizationId,
}: SystemSettingsContentProps) {
  const [activeTab, setActiveTab] = useState("appearance");
  const { permissions, planInfo, isLoading } = usePlanPermissions();

  const UpgradeBlock = ({ message }: { message: string }) => (
    <div className="text-center py-8">
      <p className="text-gray-600 mb-4">{message}</p>
      <Button
        color="primary"
        onPress={() => (window.location.href = "/app/billing")}
      >
        Actualizar plan
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
        variant="solid"
        classNames={{
          tabContent: "hover:bg:secondary data-[hover=true]:bg-secondary",
          tab: "rounded-sm data-[hover=true]:bg-transparent",
        }}
      >
        <Tab key="appearance" title="Apariencia">
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Logo de la Organización
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Personaliza el logo que aparece en el header del dashboard
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <LogoUploadSection organizationId={organizationId} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Esquema de Colores
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Selecciona el tema de colores para tu dashboard
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {permissions?.canCustomizeColors ? (
                  <EnhancedThemeSelector />
                ) : (
                  <UpgradeBlock message="Tu plan no permite personalizar colores. Disponible en GROW o superior." />
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="layout" title="Diseño del Dashboard">
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Configuración de Elementos
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Personaliza la disposición y orden de los elementos del
                    dashboard
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {permissions?.canAccessUnlimitedCustomization ? (
                  <EnhancedDashboardLayoutSection
                    organizationId={organizationId}
                  />
                ) : (
                  <UpgradeBlock message="Tu plan no permite cambiar el diseño del dashboard. Disponible en GROW o superior." />
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="advanced" title="Configuración Avanzada">
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Configuraciones Adicionales
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Opciones avanzadas de personalización
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="text-center py-8">
                  <i className="icon-[lucide--settings] size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Configuraciones avanzadas próximamente
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
