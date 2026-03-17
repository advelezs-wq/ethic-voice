import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ChartDataPoint } from "@/types/dashboard.types";

interface StatisticsChartProps {
  chartData: ChartDataPoint[];
  totalReports: number;
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  chartData,
  totalReports,
}) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Estadísticas Mensuales</h3>
      </CardHeader>
      <CardBody>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total de Reportes</span>
            <span className="text-2xl font-bold">{totalReports}</span>
          </div>
          <div className="text-xs text-gray-500">Últimos 6 meses</div>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="reports" fill="#1e40af" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
