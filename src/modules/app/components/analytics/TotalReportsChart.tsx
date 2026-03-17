"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface TotalReportsChartProps {
  data: {
    current: number;
    trend: Array<{ date: string; count: number }>;
    change: number;
  };
}

export function TotalReportsChart({ data }: TotalReportsChartProps) {
  const { current, trend, change } = data;

  // Format trend data for recharts
  const chartData = trend.map((item) => ({
    name: item.date,
    reports: item.count,
  }));

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return "icon-[lucide--trending-up]";
    if (change < 0) return "icon-[lucide--trending-down]";
    return "icon-[lucide--minus]";
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-900">{current}</div>
          <div className="text-sm text-blue-600">Total de Reportes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className={`text-3xl font-bold ${getTrendColor(change ?? 0)}`}>
            {(change ?? 0) > 0 ? "+" : ""}
            {(change ?? 0).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">
            Cambio vs Período Anterior
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <i className={`${getTrendIcon(change ?? 0)} size-6`} />
            <span className="text-lg font-medium">
              {(change ?? 0) > 0
                ? "Incremento"
                : (change ?? 0) < 0
                  ? "Decremento"
                  : "Estable"}
            </span>
          </div>
          <div className="text-sm opacity-90">Tendencia Actual</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Tendencia de Reportes (Últimos 12 Meses)
          </h4>
          <p className="text-sm text-gray-600">
            Distribución mensual de reportes recibidos
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
                axisLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
                axisLine={{ stroke: "#d1d5db" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "#374151", fontWeight: "500" }}
                formatter={(value: number) => [value, "Reportes"]}
              />
              <Bar
                dataKey="reports"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                stroke="#2563eb"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Análisis de Tendencia
          </h4>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
                axisLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
                axisLine={{ stroke: "#d1d5db" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "#374151", fontWeight: "500" }}
                formatter={(value: number) => [value, "Reportes"]}
              />
              <Line
                type="monotone"
                dataKey="reports"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <i className="icon-[lucide--bar-chart-3] size-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-800">Pico de Actividad</h5>
              <p className="text-sm text-blue-700 mt-1">
                {Math.max(...chartData.map((d) => d.reports)) > 0
                  ? `El mes con más reportes fue ${chartData.find((d) => d.reports === Math.max(...chartData.map((item) => item.reports)))?.name} con ${Math.max(...chartData.map((d) => d.reports))} reportes.`
                  : "No hay datos suficientes para determinar picos de actividad."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <i className="icon-[lucide--trending-up] size-5 text-green-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-green-800">Promedio Mensual</h5>
              <p className="text-sm text-green-700 mt-1">
                El promedio mensual es de{" "}
                {(
                  chartData.reduce((sum, d) => sum + d.reports, 0) /
                  chartData.length
                ).toFixed(1)}{" "}
                reportes por mes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
