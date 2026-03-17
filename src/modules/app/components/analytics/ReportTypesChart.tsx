/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface ReportTypesChartProps {
  data: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export function ReportTypesChart({ data }: ReportTypesChartProps) {
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  const getSeverityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "high":
      case "alta":
      case "alto":
        return "#ef4444"; // red-500
      case "medium":
      case "media":
      case "medio":
        return "#f59e0b"; // yellow-500
      case "low":
      case "baja":
      case "bajo":
        return "#10b981"; // green-500
      case "unknown":
      case "desconocido":
      case "sin clasificar":
        return "#6b7280"; // gray-500
      default:
        return "#3b82f6"; // blue-500
    }
  };

  const getSeverityLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      case "unknown":
        return "Sin Clasificar";
      default:
        return type;
    }
  };

  // Prepare data for pie chart
  const pieData = sortedData.map((item) => ({
    ...item,
    name: getSeverityLabel(item.type),
    value: item.count,
    fill: getSeverityColor(item.type),
  }));

  // Prepare data for bar chart
  const barData = sortedData.map((item) => ({
    ...item,
    name: getSeverityLabel(item.type),
    count: item.count,
    fill: getSeverityColor(item.type),
  }));

  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Cantidad: <span className="font-medium">{data.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Porcentaje: <span className="font-medium">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {props.payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sortedData.map((item) => {
          const bgClass =
            {
              high: "bg-red-50 text-red-800",
              medium: "bg-yellow-50 text-yellow-800",
              low: "bg-green-50 text-green-800",
              unknown: "bg-gray-50 text-gray-800",
            }[item.type.toLowerCase()] || "bg-blue-50 text-blue-800";

          return (
            <div
              key={item.type}
              className={`rounded-lg p-4 text-center ${bgClass}`}
            >
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-sm font-medium">
                {getSeverityLabel(item.type)}
              </div>
              <div className="text-xs opacity-75">{item.percentage}%</div>
            </div>
          );
        })}
      </div>

      {/* Pie Chart */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Distribución por Severidad
          </h4>
          <p className="text-sm text-gray-600">
            Clasificación de reportes según nivel de gravedad
          </p>
        </div>

        {data.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={renderTooltip} />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <i className="icon-[lucide--pie-chart] size-12 mx-auto mb-4" />
            <p className="text-lg font-medium">No hay datos disponibles</p>
            <p className="text-sm">No se encontraron tipos de reportes</p>
          </div>
        )}
      </div>

      {/* Bar Chart Alternative View */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Comparación por Severidad
          </h4>
          <p className="text-sm text-gray-600">
            Vista comparativa de reportes por nivel de severidad
          </p>
        </div>

        {data.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
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
                <Tooltip content={renderTooltip} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="icon-[lucide--bar-chart-3] size-12 mx-auto mb-4" />
            <p>No hay datos disponibles</p>
          </div>
        )}
      </div>

      {/* Detailed List */}
      {data.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Detalle por Tipo
            </h4>
            <p className="text-sm text-gray-600">
              Lista detallada de tipos de reportes
            </p>
          </div>

          <div className="space-y-3">
            {sortedData.map((item, index) => {
              const color = getSeverityColor(item.type);
              const bgClass =
                {
                  high: "bg-red-50 border-red-200",
                  medium: "bg-yellow-50 border-yellow-200",
                  low: "bg-green-50 border-green-200",
                  unknown: "bg-gray-50 border-gray-200",
                }[item.type.toLowerCase()] || "bg-blue-50 border-blue-200";

              return (
                <div
                  key={item.type}
                  className={`flex items-center justify-between p-4 border rounded-lg ${bgClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">
                      {getSeverityLabel(item.type)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{item.count}</div>
                    <div className="text-sm text-gray-600">
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Analysis */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <i className="icon-[lucide--shield-alert] size-5 text-orange-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-orange-800">Análisis de Riesgo</h5>
            <p className="text-sm text-orange-700 mt-1">
              {(() => {
                if (data.length === 0) {
                  return "No hay datos de severidad disponibles para análisis.";
                }

                const highSeverity =
                  sortedData.find((d) => d.type.toLowerCase() === "high")
                    ?.percentage || 0;
                const unknownSeverity =
                  sortedData.find((d) => d.type.toLowerCase() === "unknown")
                    ?.percentage || 0;

                if (highSeverity > 30) {
                  return `Alto riesgo detectado: ${highSeverity}% de reportes son de severidad alta. Prioriza la resolución inmediata.`;
                } else if (unknownSeverity > 20) {
                  return `${unknownSeverity}% de reportes no tienen severidad clasificada. Mejora el proceso de clasificación.`;
                } else if (highSeverity === 0) {
                  return "Excelente distribución de riesgo: no hay reportes de severidad alta detectados.";
                } else {
                  return "Distribución de severidad dentro de rangos normales. Continúa el monitoreo regular.";
                }
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
