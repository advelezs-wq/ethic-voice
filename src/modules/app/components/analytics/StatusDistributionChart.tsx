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

interface StatusDistributionChartProps {
  data: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export function StatusDistributionChart({
  data,
}: StatusDistributionChartProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "pendiente":
        return "#f59e0b"; // yellow-500
      case "in_progress":
      case "en_proceso":
        return "#3b82f6"; // blue-500
      case "resolved":
      case "resuelto":
        return "#10b981"; // green-500
      case "closed":
      case "cerrado":
        return "#6b7280"; // gray-500
      default:
        return "#9ca3af"; // gray-400
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En Proceso";
      case "resolved":
        return "Resuelto";
      case "closed":
        return "Cerrado";
      case "archived":
        return "Archivado";
      default:
        return "Desconocido";
    }
  };

  // Prepare data for pie chart
  const pieData = data.map((item) => ({
    ...item,
    name: getStatusLabel(item.status),
    value: item.count,
    fill: getStatusColor(item.status),
  }));

  // Prepare data for bar chart
  const barData = data.map((item) => ({
    ...item,
    name: getStatusLabel(item.status),
    count: item.count,
    fill: getStatusColor(item.status),
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

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
        {data.map((item) => {
          const bgClass =
            {
              pending: "bg-yellow-50 text-yellow-800",
              in_progress: "bg-blue-50 text-blue-800",
              resolved: "bg-green-50 text-green-800",
              closed: "bg-gray-50 text-gray-800",
            }[item.status.toLowerCase()] || "bg-gray-50 text-gray-800";

          return (
            <div
              key={item.status}
              className={`rounded-lg p-4 text-center ${bgClass}`}
            >
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-sm font-medium">
                {getStatusLabel(item.status)}
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
            Distribución por Estado
          </h4>
          <p className="text-sm text-gray-600">
            Visualización proporcional de estados de reportes
          </p>
        </div>

        <div className="relative h-80">
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

          {/* Center total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart Alternative View */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Comparación por Estado
          </h4>
          <p className="text-sm text-gray-600">
            Vista comparativa de cantidad de reportes por estado
          </p>
        </div>

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
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <i className="icon-[lucide--info] size-5 text-blue-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-800">Análisis de Estado</h5>
            <p className="text-sm text-blue-700 mt-1">
              {(() => {
                const pendingPercentage =
                  data.find((d) => d.status.toLowerCase().includes("pending"))
                    ?.percentage ?? 0;
                const resolvedPercentage =
                  data.find((d) => d.status.toLowerCase().includes("resolved"))
                    ?.percentage ?? 0;

                if (pendingPercentage > 50) {
                  return "Alto porcentaje de casos pendientes. Considera asignar más recursos de investigación.";
                } else if (resolvedPercentage > 60) {
                  return "Excelente tasa de resolución. El equipo está manejando efectivamente los casos.";
                } else {
                  return "Distribución balanceada de estados. Continúa monitoreando el flujo de trabajo.";
                }
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
