import React from "react";
import type { DashboardStats } from "@/types/dashboard.types";
import { Card } from "@/modules/app/components/ui";
import { StatusChip } from "@/modules/app/components/ui";

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

  // Soft pastel icon-chip treatment — matches the landing page's card language
  // (see decor.tsx / PricingSection) instead of solid-color blocks.
  const cards = [
    {
      key: "newReports",
      title: getCardTitle("newReports"),
      value: stats.newReports,
      icon: <i className="icon-[lucide--file-text] size-5" role="img" aria-hidden="true" />,
      iconBg: "bg-sky-50 text-sky-700",
    },
    {
      key: "inProgress",
      title: getCardTitle("inProgress"),
      value: stats.inProgress,
      icon: <i className="icon-[lucide--clock] size-5" role="img" aria-hidden="true" />,
      iconBg: "bg-amber-50 text-amber-700",
    },
    {
      key: "closedReports",
      title: getCardTitle("closedReports"),
      value: stats.closedReports,
      icon: <i className="icon-[lucide--circle-check-big] size-5" role="img" aria-hidden="true" />,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "totalReports",
      title: getCardTitle("totalReports"),
      value: stats.totalReports,
      icon: <i className="icon-[lucide--trending-up] size-5" role="img" aria-hidden="true" />,
      iconBg: "bg-lime-50 text-lime-700",
      extra: (
        <div className="flex items-center gap-2 mt-1">
          <StatusChip tone={(stats.percentageChange ?? 0) >= 0 ? "success" : "danger"}>
            {(stats.percentageChange ?? 0) > 0 ? "+" : ""}
            {(stats.percentageChange ?? 0).toFixed(1)}%
          </StatusChip>
          <span className="text-sm text-slate-500">este mes</span>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 transition-all">
      {cards.map((card) => (
        <Card key={card.key} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-[#0d212c]">
                {card.value.toLocaleString()}
              </p>
              {"extra" in card ? card.extra : null}
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
