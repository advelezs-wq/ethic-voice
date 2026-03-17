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
  // Filter reports assigned to this member
  const assignedReports = data.recentReports.filter(
    (report) => report.assigneeId === userId
  );

  return (
    <div className="md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Bienvenido a tu Panel de Trabajo
            </h1>
            <p className="text-blue-100">
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
