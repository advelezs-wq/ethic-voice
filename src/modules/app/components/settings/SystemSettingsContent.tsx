"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Tabs, Tab } from "@heroui/react";
import { LogoUploadSection } from "./LogoUploadSection";
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
      <p className="text-slate-500 mb-4">{message}</p>
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
                  <h3 className="text-xl font-semibold text-[#0d212c]">
                    Logo de la Organización
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Personaliza el logo que aparece en el header del dashboard
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <LogoUploadSection organizationId={organizationId} />
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="layout" title="Diseño del Dashboard">
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-xl font-semibold text-[#0d212c]">
                    Configuración de Elementos
                  </h3>
                  <p className="text-slate-500 text-sm">
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
                  <h3 className="text-xl font-semibold text-[#0d212c]">
                    Configuraciones Adicionales
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Opciones avanzadas de personalización
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="text-center py-8">
                  <i className="icon-[lucide--settings] size-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">
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
