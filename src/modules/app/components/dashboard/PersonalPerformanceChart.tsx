"use client";

import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Report } from "@/types/dashboard.types";
import { subDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface PersonalPerformanceChartProps {
  reports: Report[];
}

export const PersonalPerformanceChart: React.FC<
  PersonalPerformanceChartProps
> = ({ reports }) => {
  // Calculate daily resolution rate for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");

    const dayReports = reports.filter(
      (report) => format(new Date(report.submittedAt), "yyyy-MM-dd") === dateStr
    );

    const closedReports = dayReports.filter(
      (r) => r.status === "closed"
    ).length;

    return {
      name: format(date, "EEE", { locale: es }),
      resueltos: closedReports,
      asignados: dayReports.length,
    };
  });

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Mi Rendimiento Semanal</h3>
      </CardHeader>
      <CardBody>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="resueltos"
                stroke="#10b981"
                name="Resueltos"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="asignados"
                stroke="#3b82f6"
                name="Asignados"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
