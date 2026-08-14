/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

export interface TypologyIntelligenceData {
  activeTypologies: number;
  totalReports: number;
  typologiesWithRecurrence: number;
  top3Concentration: number;
  distribution: Array<{
    typology: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrend: {
    months: string[];
    series: Array<{ typology: string; data: number[] }>;
  };
}

interface TypologyIntelligenceSectionProps {
  data: TypologyIntelligenceData;
}

const PALETTE = [
  "#059669", // emerald-600
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#6b7280", // gray-500
];

function colorFor(index: number) {
  return PALETTE[index % PALETTE.length];
}

export function TypologyIntelligenceSection({
  data,
}: TypologyIntelligenceSectionProps) {
  const { distribution, monthlyTrend } = data;

  const pieData = distribution.map((d, i) => ({
    name: d.typology,
    value: d.count,
    percentage: d.percentage,
    fill: colorFor(i),
  }));

  const rankingData = distribution.map((d, i) => ({
    name: d.typology,
    count: d.count,
    percentage: d.percentage,
    fill: colorFor(i),
  }));

  const trendData = monthlyTrend.months.map((month, monthIdx) => {
    const point: Record<string, string | number> = { month };
    monthlyTrend.series.forEach((s) => {
      point[s.typology] = s.data[monthIdx] ?? 0;
    });
    return point;
  });

  const renderPieTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const d = props.payload[0].payload;
      return (
        <div className="bg-white p-3 border border-emerald-100 rounded-lg shadow-lg">
          <p className="font-medium text-[#0d212c]">{d.name}</p>
          <p className="text-sm text-slate-500">
            Denuncias: <span className="font-medium">{d.value}</span> (
            {d.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (distribution.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-10 text-center">
        <i className="icon-[lucide--shapes] mx-auto mb-3 size-8 text-slate-300" />
        <p className="text-sm text-slate-400">
          Aún no hay denuncias clasificadas para calcular tipologías.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-4 text-center bg-emerald-50 text-emerald-800">
          <div className="text-2xl font-bold">{data.activeTypologies}</div>
          <div className="text-sm font-medium">Tipologías activas</div>
        </div>
        <div className="rounded-lg p-4 text-center bg-sky-50 text-sky-700">
          <div className="text-2xl font-bold">{data.totalReports}</div>
          <div className="text-sm font-medium">Denuncias recibidas</div>
        </div>
        <div className="rounded-lg p-4 text-center bg-violet-50 text-violet-800">
          <div className="text-2xl font-bold">
            {data.typologiesWithRecurrence}
          </div>
          <div className="text-sm font-medium">Con mayor recurrencia</div>
        </div>
        <div className="rounded-lg p-4 text-center bg-amber-50 text-amber-800">
          <div className="text-2xl font-bold">{data.top3Concentration}%</div>
          <div className="text-sm font-medium">Concentración Top 3</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut: distribución por tipología */}
        <div className="bg-white border rounded-lg p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-[#0d212c]">
              Distribución por Tipología
            </h4>
            <p className="text-sm text-slate-500">
              Participación porcentual de cada categoría de denuncia
            </p>
          </div>
          <div className="relative h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`typology-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={renderPieTooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0d212c]">
                  {data.totalReports}
                </div>
                <div className="text-sm text-slate-500">Total</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-xs text-slate-600">
                  {entry.name} · {entry.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking de tipologías */}
        <div className="bg-white border rounded-lg p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-[#0d212c]">
              Ranking de Tipologías
            </h4>
            <p className="text-sm text-slate-500">
              Categorías con mayor recurrencia
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rankingData}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 8, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 12, fill: "#374151" }}
                />
                <Tooltip
                  formatter={(value: any, _name, props: any) => [
                    `${value} (${props.payload.percentage}%)`,
                    "Denuncias",
                  ]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {rankingData.map((entry, index) => (
                    <Cell key={`rank-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tendencia mensual por tipología */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-[#0d212c]">
            Tendencia Mensual por Tipología
          </h4>
          <p className="text-sm text-slate-500">
            Evolución de las tipologías con mayor recurrencia (últimos 6 meses)
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {monthlyTrend.series.map((s, i) => (
                <Line
                  key={s.typology}
                  type="monotone"
                  dataKey={s.typology}
                  stroke={colorFor(i)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
