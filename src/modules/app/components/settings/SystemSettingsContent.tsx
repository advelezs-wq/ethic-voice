"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Tabs, Tab } from "@heroui/react";
import { LogoUploadSection } from "./LogoUploadSection";
import { EnhancedDashboardLayoutSection } from "./EnhancedDashboardLayoutSection";
import { CaseRetentionSection } from "./CaseRetentionSection";
import { EthicsContextSection } from "./EthicsContextSection";
import { OrganizationStructureSection } from "./OrganizationStructureSection";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { Button, Card as UiCard, Chip } from "@heroui/react";

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
          tabContent: "data-[hover=true]:bg-ev-paper",
          tab: "rounded-sm data-[hover=true]:bg-transparent",
        }}
      >
        <Tab key="appearance" title="Logo">
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                    Logo de la Organización
                  </h3>
                  <p className="text-sm text-ev-mute">
                    Tu logo aparece en el panel y en el formulario público de denuncias.
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <LogoUploadSection organizationId={organizationId} />
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="layout" title="Panel de inicio">
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                    Qué se muestra en el inicio
                  </h3>
                  <p className="text-sm text-ev-mute">
                    Elige y ordena los bloques del panel de inicio.
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {permissions?.canAccessUnlimitedCustomization ? (
                  <EnhancedDashboardLayoutSection
                    organizationId={organizationId}
                  />
                ) : (
                  <UpgradeBlock message="Personalizar el panel de inicio está disponible desde el plan Grow." />
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="retention" title="Conservación de casos">
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                    Cuánto tiempo se conservan los casos
                  </h3>
                  <p className="text-sm text-ev-mute">
                    Define por cuánto tiempo guardar los casos cerrados, según tu política o la ley aplicable.
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <CaseRetentionSection />
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab
          key="ethics-context"
          title={
            <div className="flex items-center gap-2">
              <span>Contexto para la IA</span>
              <Chip size="sm" color="secondary" variant="flat">
                Plan Premium
              </Chip>
            </div>
          }
        >
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                    Contexto de tu organización para la IA
                  </h3>
                  <p className="text-sm text-ev-mute">
                    Cuéntale a la IA sobre tu código de ética, políticas y riesgos para que clasifique mejor cada denuncia.
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {permissions?.canUseEthicalContext ? (
                  <EthicsContextSection organizationId={organizationId} />
                ) : (
                  <UpgradeBlock message="Disponible en el plan Premium." />
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="advanced" title="Áreas y cargos">
          <div className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                    Áreas y cargos del formulario
                  </h3>
                  <p className="text-sm text-ev-mute">
                    Las opciones que ven los denunciantes al indicar dónde ocurrió y quién está involucrado.
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {isLoading ? null : permissions?.canAccessAreasPositionsCatalog ? (
                  <OrganizationStructureSection organizationId={organizationId} />
                ) : (
                  <UpgradeBlock message="Personalizar áreas y cargos está disponible desde el plan Grow." />
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
