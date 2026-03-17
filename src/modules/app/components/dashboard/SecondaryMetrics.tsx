import React from "react";
import { Card, CardBody } from "@heroui/card";
import type { DashboardStats } from "@/types/dashboard.types";

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
      icon: <i className="icon-[lucide--user-minus] size-5 text-gray-600" />,
    },
    {
      title: "Tiempo Promedio de Resolución",
      value:
        stats.averageResolutionTime === 0
          ? "0 días"
          : `${stats.averageResolutionTime} día${stats.averageResolutionTime !== 1 ? "s" : ""}`,
      subtitle: "Promedio histórico",
      icon: <i className="icon-[lucide--clock] size-5 text-gray-600" />,
    },
    {
      title: "Reportes Críticos",
      value: stats.criticalReports,
      subtitle: "Requieren atención inmediata",
      icon: (
        <i className="icon-[lucide--alert-triangle] size-5 text-gray-600" />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-white border">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  {metric.title}
                </p>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {typeof metric.value === "number"
                    ? metric.value.toLocaleString()
                    : metric.value}
                </p>
                <p className="text-xs text-gray-500">{metric.subtitle}</p>
              </div>
              <div className="ml-3">{metric.icon}</div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
