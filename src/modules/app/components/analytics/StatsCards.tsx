import React from "react";
import type { DashboardStats } from "@/types/dashboard.types";
import { MetricStrip } from "@/modules/app/components/ui";

interface StatsCardsProps {
  stats: DashboardStats;
  userRole?: string;
  showOnlyAssigned?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  userRole: _userRole = "ORG_MEMBER",
  showOnlyAssigned = false,
}) => {
  const getCardTitle = (key: string) => {
    if (showOnlyAssigned) {
      const titles = {
        newReports: "Asignadas a mí",
        inProgress: "En investigación",
        closedReports: "Cerradas",
        totalReports: "Total asignadas",
      };
      return titles[key as keyof typeof titles] || key;
    }

    const titles = {
      newReports: "Nuevas por revisar",
      inProgress: "En investigación",
      closedReports: "Cerradas",
      totalReports: "Total recibidas",
    };
    return titles[key as keyof typeof titles] || key;
  };

  const change = stats.percentageChange ?? 0;

  return (
    <MetricStrip
      metrics={[
        { key: "newReports", label: getCardTitle("newReports"), value: stats.newReports.toLocaleString(), tone: "signal" },
        { key: "inProgress", label: getCardTitle("inProgress"), value: stats.inProgress.toLocaleString(), tone: "amber" },
        { key: "closedReports", label: getCardTitle("closedReports"), value: stats.closedReports.toLocaleString(), tone: "moss" },
        {
          key: "totalReports",
          label: getCardTitle("totalReports"),
          value: stats.totalReports.toLocaleString(),
          tone: "slate",
          caption: (
            <span className="flex items-center gap-2">
              <span className={`ev-num font-medium ${change >= 0 ? "text-ev-moss" : "text-[#9C2F1F]"}`}>
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              vs. mes anterior
            </span>
          ),
        },
      ]}
    />
  );
};
