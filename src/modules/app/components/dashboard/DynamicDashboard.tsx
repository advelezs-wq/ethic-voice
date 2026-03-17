"use client";

import React from "react";
import { DashboardData } from "@/types/dashboard.types";
import { useDashboardLayout } from "../../hooks/useDashboardLayout";
import { StatsCards } from "../analytics/StatsCards";
import { SecondaryMetrics } from "./SecondaryMetrics";
import { WeeklyTrendChart } from "./WeeklyTrendChart";
import { StatisticsChart } from "./StatisticsChart";
import { AssignedReportsTable } from "./AssignedReportsTable";
import { DepartmentAnalysis } from "./DepartmentAnalysis";
import { SeverityIndicator } from "./SeverityIndicator";
import { CategoryDistribution } from "./CategoryDistribution";
import { Spinner } from "@heroui/react";

interface DynamicDashboardProps {
  data: DashboardData;
  organizationId: string;
}

interface DashboardElement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isVisible: boolean;
  position: number;
  size: "small" | "medium" | "large";
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({
  data,
  organizationId,
}) => {
  const { elements, loading } = useDashboardLayout(organizationId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Filter and sort elements
  const visibleElements = elements
    .filter((element) => element.isVisible)
    .sort((a, b) => a.position - b.position);

  // Helper function to get grid class based on size
  const getGridClass = (size: string) => {
    switch (size) {
      case "small":
        return "col-span-1";
      case "medium":
        return "col-span-1 lg:col-span-2";
      case "large":
        return "col-span-1 lg:col-span-3";
      default:
        return "col-span-1";
    }
  };

  // Helper function to render dashboard component
  const renderElement = (element: DashboardElement) => {
    const className = getGridClass(element.size);

    switch (element.id) {
      case "stats-cards":
        return (
          <div key={element.id} className={`${className} w-full`}>
            <StatsCards stats={data.stats} />
          </div>
        );

      case "recent-reports":
        return (
          <div key={element.id} className={className}>
            <AssignedReportsTable reports={data.recentReports} />
          </div>
        );

      case "weekly-trend":
        return (
          <div key={element.id} className={className}>
            <WeeklyTrendChart weeklyData={data.weeklyTrend} />
          </div>
        );

      case "statistics-chart":
        return (
          <div key={element.id} className={className}>
            <StatisticsChart
              totalReports={data.stats.totalReports}
              chartData={data.chartData}
            />
          </div>
        );

      case "department-analysis":
        return (
          <div key={element.id} className={className}>
            <DepartmentAnalysis departments={data.departmentData} />
          </div>
        );

      case "severity-indicator":
        return (
          <div key={element.id} className={className}>
            <SeverityIndicator distribution={data.severityDistribution} />
          </div>
        );

      case "category-distribution":
        return (
          <div key={element.id} className={className}>
            <CategoryDistribution categoryData={data.categoryData} />
          </div>
        );

      case "secondary-metrics":
        return (
          <div key={element.id} className={`${className} w-full`}>
            <SecondaryMetrics stats={data.stats} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visibleElements.map((element) => renderElement(element))}
      </div>
    </div>
  );
};
