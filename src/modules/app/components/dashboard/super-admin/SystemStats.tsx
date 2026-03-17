"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";

interface SystemStatsProps {
  stats: {
    totalOrganizations: number;
    totalUsers: number;
    totalReports: number;
    activeOrganizations: number;
    totalRevenue?: number;
  };
}

export function SystemStats({ stats }: SystemStatsProps) {
  const statCards = [
    {
      title: "Total Organizaciones",
      value: stats.totalOrganizations,
      icon: "icon-[lucide--building-2]",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Organizaciones Activas",
      value: stats.activeOrganizations,
      icon: "icon-[lucide--check-circle]",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      icon: "icon-[lucide--users]",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Reportes",
      value: stats.totalReports,
      icon: "icon-[lucide--file-text]",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <i className={`${stat.icon} size-6 ${stat.color}`} />
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
