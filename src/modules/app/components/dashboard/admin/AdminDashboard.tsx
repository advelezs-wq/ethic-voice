"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { DashboardData } from "@/types/dashboard.types";
import { DynamicDashboard } from "../DynamicDashboard";
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
  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {isSuperAdmin
                ? "Panel de Super Administrador"
                : "Panel de Control"}
            </h1>
            {DEMO_MODE && (
              <Chip
                color="warning"
                variant="flat"
                size="sm"
                startContent={<i className="icon-[lucide--test-tube] size-3" />}
              >
                Modo Demo
              </Chip>
            )}
          </div>
          <p className="text-gray-600 text-sm md:text-base">
            {isSuperAdmin
              ? "Gestión global del sistema"
              : "Gestión de denuncias y reportes de tu organización"}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            variant="light"
            size="sm"
            isIconOnly
            onPress={onRefresh}
            isLoading={refreshing}
          >
            <i className="icon-[lucide--refresh-ccw] size-4" />
          </Button>
          <Button variant="bordered" size="sm">
            <i className="icon-[lucide--filter] size-4 mr-2" />
            Filtrar
          </Button>
          <DownloadPDFButton
            reportType="organization"
            data={{
              organization: {
                name: isSuperAdmin
                  ? "Todas las Organizaciones"
                  : "Mi Organización",
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
        </div>
      </div>

      {/* Dynamic Dashboard Content */}
      <DynamicDashboard data={data} organizationId={data.organizationId} />
    </div>
  );
};
