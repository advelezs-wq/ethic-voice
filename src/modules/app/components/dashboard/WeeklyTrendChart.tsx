import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartDataPoint } from "@/types/dashboard.types";
import { AXIS_TICK, ChartCard, CountTooltip, GRID_STROKE } from "./ChartCard";

interface WeeklyTrendChartProps {
  weeklyData: ChartDataPoint[];
}

/** Denuncias recibidas por día en la última semana (barras: son conteos). */
export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ weeklyData }) => {
  const total = weeklyData.reduce((sum, d) => sum + (d.reports || 0), 0);
  return (
    <ChartCard
      title="Denuncias recibidas por día"
      description="Últimos 7 días"
      figure={total}
      figureLabel="Esta semana"
    >
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<CountTooltip />} cursor={{ fill: "#F4F3EE" }} />
            <Bar dataKey="reports" fill="#244850" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};
