"use client";

import React from "react";
import { Button } from "@heroui/button";
import { PageHero } from "@/modules/app/components/ui";
import { DashboardData } from "@/types/dashboard.types";
import { DynamicDashboard } from "../DynamicDashboard";
import { AttentionPanel } from "../AttentionPanel";
import { DownloadPDFButton } from "../../analytics/DownloadPDFButton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Demo mode flag
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || false;

interface AdminDashboardProps {
  data: DashboardData;
  onRefresh: () => void;
  refreshing: boolean;
  isSuperAdmin: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  onRefresh,
  refreshing,
  isSuperAdmin,
}) => {
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-6">
      <PageHero
        className="!mb-2"
        kicker={
          <>
            Resumen · <span className="normal-case">{today}</span>
            {DEMO_MODE ? <span className="ml-2 rounded bg-ev-amber/20 px-1.5 text-[#8C5C15]">Modo demo</span> : null}
          </>
        }
        title={isSuperAdmin ? "Panel de super administrador" : "Panel de control"}
        description={
          isSuperAdmin
            ? "Gestión global del sistema."
            : "Estado de las denuncias de tu organización, en tiempo real."
        }
        actions={
          <>
            <Button
              variant="light"
              size="sm"
              isIconOnly
              aria-label="Actualizar"
              className="text-ev-mute"
              onPress={onRefresh}
              isLoading={refreshing}
            >
              <i className="icon-[lucide--refresh-ccw] size-4" />
            </Button>
            <DownloadPDFButton
              reportType="organization"
              data={{
                organization: {
                  name: isSuperAdmin ? "Todas las organizaciones" : "Mi organización",
                },
                dashboardData: data,
                teamPerformance: [], // This would need to be passed from parent component
              }}
              filename={`reporte-organizacion-${format(new Date(), "yyyy-MM-dd", {
                locale: es,
              })}`}
              buttonText="Exportar PDF"
              size="sm"
            />
          </>
        }
      />

      <AttentionPanel data={data} />

      {/* Dynamic Dashboard Content */}
      <DynamicDashboard data={data} organizationId={data.organizationId} />
    </div>
  );
};
