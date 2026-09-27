"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricStrip } from "@/modules/app/components/ui";
import { AXIS_TICK, CountTooltip, GRID_STROKE } from "../dashboard/ChartCard";

interface TotalReportsChartProps {
  data: {
    current: number;
    trend: Array<{ date: string; count: number }>;
    change: number;
  };
}

/**
 * Denuncias recibidas en los últimos 12 meses: cifras resumidas en lenguaje
 * simple y un único gráfico de barras (antes el mismo dato se repetía en
 * barras y en línea, con textos automáticos poco útiles).
 */
export function TotalReportsChart({ data }: TotalReportsChartProps) {
  const { current, trend, change } = data;
  const chartData = trend.map((item) => ({ name: item.date, reports: item.count }));
  const monthsWithData = chartData.length || 1;
  const average = chartData.reduce((s, d) => s + d.reports, 0) / monthsWithData;
  const peak = chartData.reduce(
    (best, d) => (d.reports > best.reports ? d : best),
    { name: "—", reports: 0 },
  );
  const pct = change ?? 0;

  return (
    <div className="space-y-6">
      <MetricStrip
        size="md"
        metrics={[
          { key: "total", label: "Total recibidas", value: current, tone: "slate", caption: "Últimos 12 meses" },
          {
            key: "change",
            label: "Frente al mes anterior",
            value: `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`,
            tone: pct > 0 ? "amber" : "moss",
            caption:
              pct > 0
                ? "Llegaron más denuncias que el mes pasado"
                : pct < 0
                  ? "Llegaron menos denuncias que el mes pasado"
                  : "Igual que el mes pasado",
          },
          {
            key: "avg",
            label: "Promedio mensual",
            value: average < 1 && average > 0 ? "< 1" : Math.round(average),
            tone: "haze",
            caption: "Denuncias por mes",
          },
          {
            key: "peak",
            label: "Mes con más denuncias",
            value: peak.reports > 0 ? peak.name : "—",
            tone: "signal",
            caption: peak.reports > 0 ? `${peak.reports} denuncias` : "Aún sin datos",
          },
        ]}
      />

      <div className="rounded-xl border border-ev-line bg-white p-5">
        <p className="text-sm font-medium text-ev-night">Denuncias recibidas por mes</p>
        <p className="text-sm text-ev-mute">El mes actual aparece en verde.</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
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
      </div>
    </div>
  );
}
