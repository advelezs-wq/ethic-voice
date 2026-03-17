import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import type { DashboardStats } from "@/types/dashboard.types";

interface StatsCardsProps {
  stats: DashboardStats;
  userRole?: string;
  showOnlyAssigned?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  userRole = "ORG_MEMBER",
  showOnlyAssigned = false,
}) => {
  const getCardTitle = (key: string) => {
    if (showOnlyAssigned) {
      const titles = {
        newReports: "Reportes asignados",
        inProgress: "En progreso",
        closedReports: "Completados",
        totalReports: "Total asignados",
      };
      return titles[key as keyof typeof titles] || key;
    }

    const titles = {
      newReports: "Nuevos reportes",
      inProgress: "En progreso",
      closedReports: "Cerrados",
      totalReports: "Total reportes",
    };
    return titles[key as keyof typeof titles] || key;
  };

  const cards = [
    {
      key: "newReports",
      title: getCardTitle("newReports"),
      value: stats.newReports,
      icon: (
        <i
          className="icon-[lucide--file-text] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-blue-900",
      iconBgColor: "bg-blue-800",
      textColor: "text-white",
      subtitleColor: "text-blue-100",
    },
    {
      key: "inProgress",
      title: getCardTitle("inProgress"),
      value: stats.inProgress,
      icon: (
        <i
          className="icon-[lucide--clock] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-orange-600",
      iconBgColor: "bg-orange-700",
      textColor: "text-white",
      subtitleColor: "text-orange-100",
    },
    {
      key: "closedReports",
      title: getCardTitle("closedReports"),
      value: stats.closedReports,
      icon: (
        <i
          className="icon-[lucide--circle-check-big] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-green-600",
      iconBgColor: "bg-green-700",
      textColor: "text-white",
      subtitleColor: "text-green-100",
    },
    {
      key: "totalReports",
      title: getCardTitle("totalReports"),
      value: stats.totalReports,
      icon: (
        <i
          className="icon-[lucide--trending-up] size-6 text-gray-900"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-white",
      iconBgColor: "bg-gray-100",
      textColor: "text-gray-900",
      subtitleColor: "text-gray-600",
      extra: (
        <div className="flex items-center gap-2 mt-1">
          <Chip
            size="sm"
            color={(stats.percentageChange ?? 0) >= 0 ? "success" : "danger"}
            variant="flat"
          >
            {(stats.percentageChange ?? 0) > 0 ? "+" : ""}
            {(stats.percentageChange ?? 0).toFixed(1)}%
          </Chip>
          <span className="text-sm text-gray-500">este mes</span>
        </div>
      ),
    },
  ];

  // Additional stats for admins
  // Note: adminCards moved to SecondaryMetrics; keep for reference if needed in future
  const adminCards = [
    {
      key: "criticalReports",
      title: "Críticos",
      value: stats.criticalReports,
      icon: (
        <i
          className="icon-[lucide--alert-triangle] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-red-600",
      iconBgColor: "bg-red-700",
      textColor: "text-white",
      subtitleColor: "text-red-100",
      extra: null,
    },
    {
      key: "anonymousReports",
      title: "Anónimos",
      value: stats.anonymousReports,
      icon: (
        <i
          className="icon-[lucide--user-minus] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-purple-600",
      iconBgColor: "bg-purple-700",
      textColor: "text-white",
      subtitleColor: "text-purple-100",
      extra: null,
    },
  ];

  // ✅ Always show only the 4 basic cards - admin metrics are now in SecondaryMetrics component
  const displayCards = cards;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 transition-all">
      {displayCards.map((card) => {
        return (
          <Card key={card.key} className={card.bgColor}>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p
                    className={`${card.subtitleColor} text-sm font-medium mb-1`}
                  >
                    {card.title}
                  </p>
                  <p className={`text-3xl font-bold ${card.textColor}`}>
                    {card.value.toLocaleString()}
                  </p>
                  {card.extra}
                </div>
                <div className={`p-3 ${card.iconBgColor} rounded-lg`}>
                  {card.icon}
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};
