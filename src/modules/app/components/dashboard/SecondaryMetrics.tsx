import React from "react";
import type { DashboardStats } from "@/types/dashboard.types";
import { MetricStrip } from "@/modules/app/components/ui";

interface SecondaryMetricsProps {
  stats: DashboardStats;
}

export const SecondaryMetrics: React.FC<SecondaryMetricsProps> = ({ stats }) => {
  const total = stats.totalReports ?? 0;
  const anonymousPct = total > 0 ? (((stats.anonymousReports ?? 0) / total) * 100).toFixed(1) : "0";
  const days = stats.averageResolutionTime;

  return (
    <MetricStrip
      size="md"
      metrics={[
        {
          key: "anonymous",
          label: "Denuncias anónimas",
          value: (stats.anonymousReports ?? 0).toLocaleString(),
          tone: "slate",
          caption: `${anonymousPct}% del total`,
        },
        {
          key: "resolution",
          label: "Tiempo medio de resolución",
          value:
            (stats.closedReports ?? 0) === 0
              ? "—"
              : days < 1
                ? "< 1 día"
                : `${days} día${days !== 1 ? "s" : ""}`,
          tone: "amber",
          caption:
            (stats.closedReports ?? 0) === 0
              ? "Se calcula cuando cierres la primera denuncia"
              : "Desde que llega hasta que se cierra",
        },
        {
          key: "critical",
          label: "Prioritarias",
          value: (stats.criticalReports ?? 0).toLocaleString(),
          tone: "coral",
          caption: "Prioridad alta, urgente o severidad alta",
        },
      ]}
    />
  );
};
