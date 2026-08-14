"use client";

import React from "react";
import { Button } from "@heroui/button";
import { DashboardData } from "@/types/dashboard.types";
import { AssignedReportsTable } from "../AssignedReportsTable";
import { MemberStatsCards } from "./MemberStatsCards";
import { TaskProgress } from "../TaskProgress";
import { PersonalPerformanceChart } from "../PersonalPerformanceChart";
import { DownloadPDFButton } from "../../analytics/DownloadPDFButton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MemberDashboardProps {
  data: DashboardData;
  userId: string;
  onRefresh: () => void;
  refreshing: boolean;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  data,
  userId,
  onRefresh,
  refreshing,
}) => {
  // Los datos ya vienen filtrados por el servidor a los reportes asignados a
  // este investigador (ver ReportsDashboard -> loadDashboardData con scope de
  // usuario). Se revalida contra `assignments` como respaldo defensivo, ya
  // que `assigneeId` quedó obsoleto desde que se migró a asignaciones múltiples.
  const assignedReports = data.recentReports.filter(
    (report) =>
      report.assigneeId === userId ||
      report.assignments?.some((a) => a.userId === userId)
  );

  return (
    <div className="md:p-6 space-y-6 bg-[#f7faf9] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Bienvenido a tu Panel de Trabajo
            </h1>
            <p className="text-sky-100">
              Aquí puedes ver y gestionar los casos que te han sido asignados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DownloadPDFButton
            reportType="member"
            data={{
              dashboardData: data,
              userId,
              organization: { name: 'Mi Organización' }, // This would need organization data
              averageResolutionTime: 0 // This would need to be calculated
            }}
            filename={`mi-reporte-${format(new Date(), 'yyyy-MM-dd', { locale: es })}`}
            buttonText="Mi Reporte PDF"
            size="sm"
            memberName="Mi Usuario" // This would need actual user name
          />
        <Button
          variant="light"
          size="sm"
          isIconOnly
          onPress={onRefresh}
          isLoading={refreshing}
        >
          <i className="icon-[lucide--refresh-ccw] size-4" />
        </Button>
        </div>
      </div>

      {/* Member-specific stats */}
      <MemberStatsCards
        assignedReports={assignedReports}
        totalReports={data.stats.totalReports}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalPerformanceChart reports={assignedReports} />
        <TaskProgress reports={assignedReports} />
      </div>

      {/* Assigned Reports */}
      <AssignedReportsTable reports={assignedReports} />
    </div>
  );
};
