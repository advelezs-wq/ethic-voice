import React from "react";
import { CardHeader, CardBody } from "@heroui/card";
import { Card } from "@/modules/app/components/ui";
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
        <h3 className="text-lg font-semibold text-[#0d212c]">Estadísticas Mensuales</h3>
      </CardHeader>
      <CardBody>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Total de Reportes</span>
            <span className="text-2xl font-bold text-[#0d212c]">{totalReports}</span>
          </div>
          <div className="text-xs text-slate-400">Últimos 6 meses</div>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecfdf5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #d1fae5",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="reports" fill="#a3e635" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
