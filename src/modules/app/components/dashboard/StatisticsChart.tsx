import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartDataPoint } from "@/types/dashboard.types";
import { AXIS_TICK, ChartCard, CountTooltip, GRID_STROKE } from "./ChartCard";

interface StatisticsChartProps {
  chartData: ChartDataPoint[];
  totalReports: number;
}

/** Denuncias por mes (últimos 6). El mes en curso se resalta en lima. */
export const StatisticsChart: React.FC<StatisticsChartProps> = ({ chartData, totalReports }) => {
  return (
    <ChartCard
      title="Denuncias por mes"
      description="Últimos 6 meses · el mes actual en verde"
      figure={totalReports}
      figureLabel="Total histórico"
    >
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<CountTooltip />} cursor={{ fill: "#F4F3EE" }} />
            <Bar dataKey="reports" radius={[6, 6, 0, 0]} maxBarSize={44}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === chartData.length - 1 ? "#98D050" : "#244850"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};
