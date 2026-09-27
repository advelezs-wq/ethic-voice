"use client";

import { MetricStrip, type MetricTone } from "@/modules/app/components/ui";

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
      title: "Total de denuncias",
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
      title: "En investigación",
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
      title: "Resueltas",
      value: stats.resolvedReports.toString(),
      subtitle: `${resolutionRate}% del total`,
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
      title: "Severidad alta",
      value: (stats.highSeverityReports || 0).toString(),
      subtitle: `${stats.highPriorityReports} con prioridad urgente`,
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
      title: "Denuncias anónimas",
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
      bgColor: "bg-emerald-50",
      textColor: "text-slate-500",
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
      label: "Nuevas en los últimos 7 días",
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

  const TONE: Record<string, MetricTone> = {
    primary: "slate",
    warning: "amber",
    secondary: "signal",
    success: "moss",
    danger: "coral",
    default: "haze",
  };

  return (
    <div className="space-y-4">
      <MetricStrip
        size="md"
        // En la lista solo lo que ayuda a decidir qué abrir; el resto vive en Analíticas.
        metrics={statsData
          .filter((stat) => ["Pendientes", "En investigación", "Severidad alta", "Resueltas"].includes(stat.title))
          .map((stat) => ({
          key: stat.title,
          label: stat.title,
          value: stat.value,
          tone: TONE[stat.color] ?? "haze",
          caption: (
            <>
              <span className="text-[0.8125rem]">{stat.subtitle}</span>
              {stat.showProgress && (
                <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-ev-bone">
                  <span
                    className={`block h-full rounded-full ${
                      stat.color === "success" ? "bg-ev-moss" : stat.color === "warning" ? "bg-ev-amber" : "bg-ev-slate"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, Number(stat.progress) || 0))}%` }}
                  />
                </span>
              )}
            </>
          ),
        }))}
      />

    </div>
  );
}
