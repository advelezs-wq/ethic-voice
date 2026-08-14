"use client";

import React from "react";
import { Progress } from "@heroui/progress";
import { StatTile } from "@/modules/app/components/ui";
import { Report } from "@/types/dashboard.types";

interface MemberStatsCardsProps {
  assignedReports: Report[];
  totalReports: number;
}

export const MemberStatsCards: React.FC<MemberStatsCardsProps> = ({
  assignedReports,
  totalReports,
}) => {
  // Calculate member-specific stats
  const assignedCount = assignedReports.length;
  const completedCount = assignedReports.filter(report =>
    report.status === "closed" || report.status === "archived"
  ).length;
  const inProgressCount = assignedReports.filter(report =>
    report.status === "progress"
  ).length;
  const newCount = assignedReports.filter(report =>
    report.status === "new"
  ).length;

  const completionRate = assignedCount > 0 ? (completedCount / assignedCount) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 transition-all">
      <StatTile
        label="Mis casos asignados"
        value={assignedCount}
        tone="sky"
        icon={<i className="icon-[lucide--user-check] size-6" role="img" aria-hidden="true" />}
        footer={<p className="mt-2 text-sm text-slate-500">de {totalReports} totales</p>}
      />
      <StatTile
        label="Nuevos"
        value={newCount}
        tone="amber"
        icon={<i className="icon-[lucide--file-plus] size-6" role="img" aria-hidden="true" />}
        footer={<p className="mt-2 text-sm text-slate-500">por revisar</p>}
      />
      <StatTile
        label="En progreso"
        value={inProgressCount}
        tone="lime"
        icon={<i className="icon-[lucide--clock] size-6" role="img" aria-hidden="true" />}
        footer={<p className="mt-2 text-sm text-slate-500">trabajando</p>}
      />
      <StatTile
        label="Completados"
        value={completedCount}
        tone="emerald"
        icon={<i className="icon-[lucide--check-circle] size-6" role="img" aria-hidden="true" />}
        footer={
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-slate-500">Eficiencia</span>
              <span className="text-sm font-semibold text-emerald-700">
                {(completionRate ?? 0).toFixed(0)}%
              </span>
            </div>
            <Progress value={completionRate} color="success" size="sm" />
          </div>
        }
      />
    </div>
  );
};
