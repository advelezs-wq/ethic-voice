"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DepartmentReportsChartProps {
  data: Array<{
    department: string;
    count: number;
  }>;
}

export function DepartmentReportsChart({ data }: DepartmentReportsChartProps) {
  // Sort data by count (descending)
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // Color palette for departments
  const colors = [
    "#3b82f6", // blue-500
    "#10b981", // green-500
    "#f59e0b", // yellow-500
    "#ef4444", // red-500
    "#8b5cf6", // purple-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
    "#84cc16", // lime-500
    "#ec4899", // pink-500
    "#6b7280", // gray-500
  ];

  // Assign colors to departments
  const chartData = sortedData.map((item, index) => ({
    ...item,
    name: item.department,
    value: item.count,
    fill: colors[index % colors.length],
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.department}</p>
          <p className="text-sm text-gray-600">
            Reportes: <span className="font-medium">{data.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const maxCount = Math.max(...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">{data.length}</div>
          <div className="text-sm text-blue-600">Departamentos</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-900">{total}</div>
          <div className="text-sm text-green-600">Total Reportes</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-900">
            {data.length > 0 ? (total / data.length).toFixed(1) : 0}
          </div>
          <div className="text-sm text-purple-600">Promedio por Depto.</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Reportes por Departamento
          </h4>
          <p className="text-sm text-gray-600">
            Distribución de reportes por área organizacional
          </p>
        </div>

        {data.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={{ stroke: "#d1d5db" }}
                  axisLine={{ stroke: "#d1d5db" }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={{ stroke: "#d1d5db" }}
                  axisLine={{ stroke: "#d1d5db" }}
                  width={120}
                />
                <Tooltip content={renderTooltip} />
                <Bar
                  dataKey="count"
                  radius={[0, 4, 4, 0]}
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <i className="icon-[lucide--bar-chart-3] size-12 mx-auto mb-4" />
            <p className="text-lg font-medium">No hay datos disponibles</p>
            <p className="text-sm">
              No se encontraron reportes por departamento
            </p>
          </div>
        )}
      </div>

      {/* Department Performance Table */}
      {data.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Rendimiento por Departamento
            </h4>
            <p className="text-sm text-gray-600">
              Tabla detallada de reportes por departamento
            </p>
          </div>

          <div className="space-y-3">
            {sortedData.map((item, index) => {
              const percentage =
                maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const color = colors[index % colors.length];

              return (
                <div key={item.department} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {item.department}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {item.count}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({((item.count / total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <i className="icon-[lucide--building-2] size-5 text-blue-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-800">
              Análisis de Departamentos
            </h5>
            <p className="text-sm text-blue-700 mt-1">
              {(() => {
                if (data.length === 0) {
                  return "No hay datos de departamentos disponibles.";
                }

                const topDept = sortedData[0];
                const spread =
                  maxCount - (sortedData[sortedData.length - 1]?.count || 0);

                if (spread > maxCount * 0.7) {
                  return `${topDept.department} lidera significativamente con ${topDept.count} reportes. Considera revisar los patrones en este departamento.`;
                } else if (
                  data.length > 1 &&
                  sortedData[0].count === sortedData[1].count
                ) {
                  return "Distribución equilibrada entre departamentos principales. Monitoreo balanceado recomendado.";
                } else {
                  return `${topDept.department} tiene la mayor cantidad de reportes (${topDept.count}). Distribución relativamente balanceada.`;
                }
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
