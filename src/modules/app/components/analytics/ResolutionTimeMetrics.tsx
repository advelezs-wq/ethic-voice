"use client";

import { useState, useEffect } from "react";
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
  Cell,
} from "recharts";

interface ResolutionTimeMetricsProps {
  organizationId: string;
}

interface ResolutionTimeData {
  averageTime: number;
  fastestResolution: number;
  slowestResolution: number;
  timeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    avgTime: number;
    count: number;
  }>;
  totalResolved: number;
}

export function ResolutionTimeMetrics({
  organizationId,
}: ResolutionTimeMetricsProps) {
  const [data, setData] = useState<ResolutionTimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResolutionData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/resolution-time?orgId=${organizationId}`
        );

        if (response.ok) {
          const resolutionData = await response.json();
          setData(resolutionData);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error("Error fetching resolution time data:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResolutionData();
  }, [organizationId]);

  const getEfficiencyLevel = (avgTime: number) => {
    if (avgTime <= 7)
      return {
        level: "Excelente",
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    if (avgTime <= 14)
      return { level: "Bueno", color: "text-blue-600", bgColor: "bg-blue-50" };
    if (avgTime <= 21)
      return {
        level: "Regular",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      };
    return {
      level: "Necesita Mejora",
      color: "text-red-600",
      bgColor: "bg-red-50",
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">
            {data.range || data.month}
          </p>
          {data.count && (
            <p className="text-sm text-gray-600">
              Casos: <span className="font-medium">{data.count}</span>
            </p>
          )}
          {data.percentage && (
            <p className="text-sm text-gray-600">
              Porcentaje:{" "}
              <span className="font-medium">{data.percentage}%</span>
            </p>
          )}
          {data.avgTime && (
            <p className="text-sm text-gray-600">
              Tiempo Promedio:{" "}
              <span className="font-medium">{data.avgTime} días</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <i className="icon-[lucide--clock] size-12 mx-auto mb-2" />
        <p>No se pudieron cargar los datos de tiempo de resolución</p>
      </div>
    );
  }

  const efficiency = getEfficiencyLevel(data.averageTime);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-lg p-4 text-center ${efficiency.bgColor}`}>
          <div className={`text-2xl font-bold ${efficiency.color}`}>
            {data.averageTime}d
          </div>
          <div className="text-sm font-medium text-gray-700">
            Tiempo Promedio
          </div>
          <div className={`text-xs ${efficiency.color}`}>
            {efficiency.level}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-900">
            {data.fastestResolution}d
          </div>
          <div className="text-sm text-green-600">Más Rápido</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-900">
            {data.slowestResolution}d
          </div>
          <div className="text-sm text-orange-600">Más Lento</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">
            {data.totalResolved}
          </div>
          <div className="text-sm text-blue-600">Total Resueltos</div>
        </div>
      </div>

      {/* Time Distribution Bar Chart */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Distribución por Tiempo de Resolución
          </h4>
          <p className="text-sm text-gray-600">
            Cantidad de casos resueltos por rango de tiempo
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.timeDistribution}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="range"
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
              <Tooltip content={renderTooltip} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                stroke="#ffffff"
                strokeWidth={1}
              >
                {data.timeDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === 0
                        ? "#10b981" // 0-7 days - green
                        : index === 1
                          ? "#3b82f6" // 8-14 days - blue
                          : index === 2
                            ? "#f59e0b" // 15-30 days - yellow
                            : "#ef4444" // 30+ days - red
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend Line Chart */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Tendencia Mensual de Tiempo de Resolución
          </h4>
          <p className="text-sm text-gray-600">
            Evolución del tiempo promedio de resolución por mes
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.monthlyTrend}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
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
              <Tooltip content={renderTooltip} />
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "#3b82f6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Distribution List */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Análisis Detallado por Tiempo
          </h4>
          <p className="text-sm text-gray-600">
            Desglose detallado de la distribución de tiempos de resolución
          </p>
        </div>

        <div className="space-y-3">
          {data.timeDistribution.map((item, index) => {
            const colors = [
              {
                bg: "bg-green-100",
                text: "text-green-800",
                bar: "bg-green-500",
              },
              { bg: "bg-blue-100", text: "text-blue-800", bar: "bg-blue-500" },
              {
                bg: "bg-yellow-100",
                text: "text-yellow-800",
                bar: "bg-yellow-500",
              },
              { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500" },
            ];
            const color = colors[index] || colors[0];

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 border rounded-lg ${color.bg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${color.bar}`} />
                  <span className={`font-medium ${color.text}`}>
                    {item.range}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`font-bold ${color.text}`}>
                      {item.count}
                    </div>
                    <div className="text-xs text-gray-600">casos</div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${color.bar}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div
                    className={`text-sm font-medium ${color.text} w-12 text-right`}
                  >
                    {item.percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Insights */}
      <div className={`border rounded-lg p-4 ${efficiency.bgColor}`}>
        <div className="flex items-start gap-3">
          <i
            className="icon-[lucide--clock] size-5 mt-0.5"
            style={{ color: efficiency.color.replace("text-", "") }}
          />
          <div>
            <h5 className={`font-medium ${efficiency.color}`}>
              Análisis de Tiempo de Resolución
            </h5>
            <p className="text-sm text-gray-700 mt-1">
              {(() => {
                if (data.averageTime <= 7) {
                  return `Excelente tiempo de resolución promedio de ${data.averageTime} días. El equipo está trabajando muy eficientemente.`;
                } else if (data.averageTime <= 14) {
                  return `Buen tiempo de resolución promedio de ${data.averageTime} días. Mantén el buen trabajo del equipo.`;
                } else if (data.averageTime <= 21) {
                  return `Tiempo de resolución promedio de ${data.averageTime} días es aceptable, pero hay margen de mejora.`;
                } else {
                  return `El tiempo promedio de ${data.averageTime} días es alto. Considera revisar los procesos y asignar más recursos.`;
                }
              })()}
            </p>

            {/* Quick recommendations */}
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Recomendación: </span>
              {data.timeDistribution[0].percentage > 50
                ? "Mantén la eficiencia actual en casos rápidos."
                : data.timeDistribution[3].percentage > 20
                  ? "Reduce casos que toman más de 30 días."
                  : "Busca optimizar procesos para casos de mediano plazo."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
