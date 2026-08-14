import React from "react";
import { CardHeader, CardBody } from "@heroui/card";
import { Card } from "@/modules/app/components/ui";
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import type { ChartDataPoint } from "@/types/dashboard.types";

interface WeeklyTrendChartProps {
  weeklyData: ChartDataPoint[];
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({
  weeklyData,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-lg rounded-lg border border-emerald-100">
          <p className="text-sm font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-slate-500">{payload[0].value} reportes</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold text-[#0d212c]">Tendencia Semanal</h3>
          <i
            className="icon-[lucide--trending-up] size-5 text-emerald-600"
            role="img"
            aria-hidden="true"
          />
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-[250px] mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecfdf5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="reports"
                stroke="#10b981"
                fill="#d1fae5"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
