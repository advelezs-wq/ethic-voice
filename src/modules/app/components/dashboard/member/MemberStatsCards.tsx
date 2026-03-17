"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
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

  const cards = [
    {
      title: "Mis casos asignados",
      value: assignedCount,
      total: totalReports,
      icon: (
        <i
          className="icon-[lucide--user-check] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-blue-600",
      iconBgColor: "bg-blue-700",
      textColor: "text-white",
      subtitleColor: "text-blue-100",
      extra: (
        <p className="text-sm text-blue-100 mt-1">
          de {totalReports} totales
        </p>
      ),
    },
    {
      title: "Nuevos",
      value: newCount,
      icon: (
        <i
          className="icon-[lucide--file-plus] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-orange-600",
      iconBgColor: "bg-orange-700",
      textColor: "text-white",
      subtitleColor: "text-orange-100",
      extra: (
        <p className="text-sm text-orange-100 mt-1">
          por revisar
        </p>
      ),
    },
    {
      title: "En progreso",
      value: inProgressCount,
      icon: (
        <i
          className="icon-[lucide--clock] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-yellow-600",
      iconBgColor: "bg-yellow-700",
      textColor: "text-white",
      subtitleColor: "text-yellow-100",
      extra: (
        <p className="text-sm text-yellow-100 mt-1">
          trabajando
        </p>
      ),
    },
    {
      title: "Completados",
      value: completedCount,
      icon: (
        <i
          className="icon-[lucide--check-circle] size-6 text-white"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-green-600",
      iconBgColor: "bg-green-700",
      textColor: "text-white",
      subtitleColor: "text-green-100",
      extra: (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-green-100">Eficiencia</span>
            <span className="text-sm font-semibold text-green-100">
              {(completionRate ?? 0).toFixed(0)}%
            </span>
          </div>
          <Progress
            value={completionRate}
            color="success"
            size="sm"
            className="bg-green-700"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 transition-all">
      {cards.map((card, index) => (
        <Card key={index} className={card.bgColor}>
          <CardBody className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`${card.subtitleColor} text-sm font-medium mb-1`}>
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
                {card.extra}
              </div>
              <div className={`p-3 ${card.iconBgColor} rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
