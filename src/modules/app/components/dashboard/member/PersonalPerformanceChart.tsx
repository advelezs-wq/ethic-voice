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
  // Generate performance data for the last 7 days
  const generatePerformanceData = () => {
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayReports = reports.filter((report) => {
        const reportDate = new Date(report.submittedAt);
        return (
          reportDate.getDate() === date.getDate() &&
          reportDate.getMonth() === date.getMonth() &&
          reportDate.getFullYear() === date.getFullYear()
        );
      });

      const completedToday = dayReports.filter(
        (report) => report.status === "closed" || report.status === "archived"
      ).length;

      data.push({
        name: format(date, "EEE", { locale: es }),
        completados: completedToday,
        asignados: dayReports.length,
      });
    }

    return data;
  };

  const performanceData = generatePerformanceData();

  // Calculate totals
  const totalCompleted = reports.filter(
    (report) => report.status === "closed" || report.status === "archived"
  ).length;
  const totalAssigned = reports.length;
  const completionRate =
    totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start px-6 pt-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Mi Rendimiento Semanal
        </h3>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Asignados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Completados</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            Tasa de éxito: {(completionRate ?? 0).toFixed(1)}%
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="asignados"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="completados"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};
