import React from "react";
import type { DashboardStats } from "@/types/dashboard.types";
import { Card } from "@/modules/app/components/ui";

interface SecondaryMetricsProps {
  stats: DashboardStats;
}

export const SecondaryMetrics: React.FC<SecondaryMetricsProps> = ({
  stats,
}) => {
  const metrics = [
    {
      title: "Denuncias Anónimas",
      value: stats.anonymousReports,
      subtitle: `${(stats.totalReports ?? 0) > 0 ? (((stats.anonymousReports ?? 0) / (stats.totalReports ?? 1)) * 100).toFixed(1) : 0}% del total`,
      icon: <i className="icon-[lucide--user-minus] size-5" />,
      iconBg: "bg-sky-50 text-sky-700",
    },
    {
      title: "Tiempo Promedio de Resolución",
      value:
        stats.averageResolutionTime === 0
          ? "0 días"
          : `${stats.averageResolutionTime} día${stats.averageResolutionTime !== 1 ? "s" : ""}`,
      subtitle: "Promedio histórico",
      icon: <i className="icon-[lucide--clock] size-5" />,
      iconBg: "bg-amber-50 text-amber-700",
    },
    {
      title: "Reportes Críticos",
      value: stats.criticalReports,
      subtitle: "Requieren atención inmediata",
      icon: <i className="icon-[lucide--alert-triangle] size-5" />,
      iconBg: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 mb-1">
                {metric.title}
              </p>
              <p className="text-xl font-bold text-[#0d212c] mb-1">
                {typeof metric.value === "number"
                  ? metric.value.toLocaleString()
                  : metric.value}
              </p>
              <p className="text-xs text-slate-400">{metric.subtitle}</p>
            </div>
            <div className={`ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.iconBg}`}>
              {metric.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
