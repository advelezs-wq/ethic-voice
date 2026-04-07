"use client";

import React from "react";
import { ReportsStats as ReportsStatsType } from "@/types/reports";
import { Card, CardBody, Progress } from "@heroui/react";

// Extend the base ReportsStats type with additional fields
interface ExtendedReportsStats extends ReportsStatsType {
  inProgressReports?: number;
  underReviewReports?: number;
  closedReports?: number;
  highSeverityReports?: number;
  mediumSeverityReports?: number;
  lowSeverityReports?: number;
  anonymousReports?: number;
  ethicLineReports?: number;
  customFormReports?: number;
  assignmentRate?: number;
  overdueReports?: number;
  newReportsLast7Days?: number;
  newReportsLast7DaysChange?: string;
}

interface ReportsStatsProps {
  stats: ExtendedReportsStats;
}

export function ReportsStats({ stats }: ReportsStatsProps) {
  // Calculate additional meaningful stats
  const resolutionRate =
    stats.totalReports > 0
      ? ((stats.resolvedReports / stats.totalReports) * 100).toFixed(1)
      : "0";

  const overdueReports = stats.overdueReports || 0;
  const anonymousRate =
    stats.totalReports > 0 && stats.anonymousReports
      ? ((stats.anonymousReports / stats.totalReports) * 100).toFixed(1)
      : "0";

  const inProgressRate =
    stats.totalReports > 0 && stats.inProgressReports
      ? ((stats.inProgressReports / stats.totalReports) * 100).toFixed(1)
      : "0";

  const statsData = [
    {
      title: "Informes totales",
      value: stats.totalReports.toString(),
      subtitle: `${stats.totalReportsChange} frente al periodo anterior`,
      icon: (
        <i
          className="icon-[lucide--file-text] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      color: "primary",
      bgColor: "bg-primary-100",
      textColor: "text-primary-600",
    },
    {
      title: "Pendientes",
      value: stats.pendingReports.toString(),
      subtitle:
        overdueReports > 0
          ? `${overdueReports} vencido${overdueReports > 1 ? "s" : ""}`
          : "Sin vencimientos",
      icon: (
        <i
          className="icon-[lucide--clock] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      color: "warning",
      bgColor: "bg-warning-100",
      textColor: "text-warning-600",
      showProgress: true,
      progress: stats.pendingReports
        ? ((stats.pendingReports / stats.totalReports) * 100).toFixed(1)
        : "0",
    },
    {
      title: "En Progreso",
      value: (stats.inProgressReports || 0).toString(),
      subtitle: `${inProgressRate}% del total`,
      icon: (
        <i
          className="icon-[lucide--loader-circle] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      color: "secondary",
      bgColor: "bg-secondary-100",
      textColor: "text-secondary-600",
    },
    {
      title: "Resueltos",
      value: stats.resolvedReports.toString(),
      subtitle: `${resolutionRate}% tasa de resolución`,
      icon: (
        <i
          className="icon-[lucide--circle-check-big] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      color: "success",
      bgColor: "bg-success-100",
      textColor: "text-success-600",
      showProgress: true,
      progress: parseFloat(resolutionRate),
    },
    {
      title: "Alta Severidad",
      value: (stats.highSeverityReports || 0).toString(),
      subtitle: `${stats.highPriorityReports} urgentes`,
      icon: (
        <i
          className="icon-[lucide--triangle-alert] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      color: "danger",
      bgColor: "bg-danger-100",
      textColor: "text-danger-600",
    },
    {
      title: "Reportes Anónimos",
      value: (stats.anonymousReports || 0).toString(),
      subtitle: `${anonymousRate}% del total`,
      icon: (
        <i
          className="icon-[lucide--user-round-x] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      color: "default",
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
    },
  ];

  // Key performance indicators
  const kpiData = [
    {
      label: "Tiempo Promedio de Resolución",
      value: `${(stats.averageResolutionTime || 0).toFixed(1)} días`,
      trend: "-1.3 días",
      trendType: "positive" as const,
    },
    {
      label: "Nuevos Reportes (7 días)",
      value: stats.newReportsLast7Days?.toString() || "0",
      trend: stats.newReportsLast7DaysChange || "+0%",
      trendType: stats.newReportsLast7DaysChange?.includes("+")
        ? "negative"
        : "positive",
    },
    {
      label: "Tasa de Asignación",
      value: `${stats.assignmentRate?.toFixed(1) || "0"}%`,
      trend: "+5%",
      trendType: "positive" as const,
    },
  ];

  const getTrendIcon = (type: "positive" | "negative") => {
    return type === "positive" ? (
      <i className="icon-[lucide--trending-down] size-4 text-green-600" />
    ) : (
      <i className="icon-[lucide--trending-up] size-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {statsData.map((stat, index) => (
          <Card
            key={index}
            className="hover:shadow-md transition-shadow min-w-0"
          >
            <CardBody className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <div className={stat.textColor}>{stat.icon}</div>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1 whitespace-normal break-words text-pretty">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1 whitespace-normal break-words text-pretty">
                  {stat.subtitle}
                </p>
                {stat.showProgress && (
                  <Progress
                    value={Number(stat.progress)}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    color={stat.color as any}
                    className="mt-2"
                    size="sm"
                  />
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="bg-gray-50">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {kpi.value}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(kpi.trendType as "positive" | "negative")}
                  <span
                    className={`text-sm font-medium ${
                      kpi.trendType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
