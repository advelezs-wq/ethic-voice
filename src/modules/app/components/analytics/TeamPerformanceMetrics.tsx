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
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface TeamPerformanceMetricsProps {
  data: {
    activeInvestigators: number;
    averageResolutionTime: number;
    productivityScore: number;
    assignments: Array<{
      investigator: string;
      email: string;
      role: string;
      assignedCount: number;
      resolvedCount: number;
      avgTime: number;
      productivityScore: number;
    }>;
  };
}

export function TeamPerformanceMetrics({ data }: TeamPerformanceMetricsProps) {
  const {
    activeInvestigators,
    averageResolutionTime,
    productivityScore,
    assignments,
  } = data;

  // Prepare data for charts
  const performanceData = assignments.map((member) => ({
    name: member.investigator.split(" ")[0], // First name only for better display
    fullName: member.investigator,
    email: member.email,
    role: member.role,
    assigned: member.assignedCount,
    resolved: member.resolvedCount,
    avgTime: member.avgTime,
    productivity: member.productivityScore,
    efficiency:
      member.assignedCount > 0
        ? (member.resolvedCount / member.assignedCount) * 100
        : 0,
  }));

  // Role distribution
  const roleDistribution = assignments.reduce(
    (acc, member) => {
      const roleLabel = member.role === "ADMIN" ? "Admin" : "Miembro";
      acc[roleLabel] = (acc[roleLabel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const roleData = Object.entries(roleDistribution).map(([role, count]) => ({
    name: role,
    value: count,
    fill: role === "Admin" ? "#3b82f6" : "#10b981",
  }));

  // Performance categories
  const performanceCategories = {
    excellent: assignments.filter((m) => m.productivityScore >= 80).length,
    good: assignments.filter(
      (m) => m.productivityScore >= 60 && m.productivityScore < 80
    ).length,
    average: assignments.filter(
      (m) => m.productivityScore >= 40 && m.productivityScore < 60
    ).length,
    needsImprovement: assignments.filter((m) => m.productivityScore < 40)
      .length,
  };

  const categoryData = [
    {
      name: "Excelente (80%+)",
      value: performanceCategories.excellent,
      fill: "#10b981",
    },
    {
      name: "Bueno (60-79%)",
      value: performanceCategories.good,
      fill: "#3b82f6",
    },
    {
      name: "Promedio (40-59%)",
      value: performanceCategories.average,
      fill: "#f59e0b",
    },
    {
      name: "Necesita Mejora (<40%)",
      value: performanceCategories.needsImprovement,
      fill: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600">Email: {data.email}</p>
          <p className="text-sm text-gray-600">
            Rol: {data.role === "ADMIN" ? "Administrador" : "Miembro"}
          </p>
          <p className="text-sm text-gray-600">Asignados: {data.assigned}</p>
          <p className="text-sm text-gray-600">Resueltos: {data.resolved}</p>
          <p className="text-sm text-gray-600">
            Tiempo Promedio: {data.avgTime}d
          </p>
          <p className="text-sm text-gray-600">
            Productividad: {data.productivity}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">
            {activeInvestigators}
          </div>
          <div className="text-sm text-blue-600">Investigadores Activos</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-900">
            {averageResolutionTime}d
          </div>
          <div className="text-sm text-green-600">
            Tiempo Promedio de Resolución
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-900">
            {productivityScore}%
          </div>
          <div className="text-sm text-purple-600">
            Score Global de Productividad
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Individual Performance Bar Chart */}
          <div className="bg-white border rounded-lg p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Productividad Individual
              </h4>
              <p className="text-sm text-gray-600">
                Score de productividad por miembro del equipo
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={{ stroke: "#d1d5db" }}
                    axisLine={{ stroke: "#d1d5db" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={{ stroke: "#d1d5db" }}
                    axisLine={{ stroke: "#d1d5db" }}
                    width={80}
                  />
                  <Tooltip content={renderTooltip} />
                  <Bar
                    dataKey="productivity"
                    radius={[0, 4, 4, 0]}
                    stroke="#ffffff"
                    strokeWidth={1}
                  >
                    {performanceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.productivity >= 80
                            ? "#10b981"
                            : entry.productivity >= 60
                              ? "#3b82f6"
                              : entry.productivity >= 40
                                ? "#f59e0b"
                                : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Distribution Pie Chart */}
          <div className="bg-white border rounded-lg p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Distribución de Performance
              </h4>
              <p className="text-sm text-gray-600">
                Categorización del equipo por nivel de productividad
              </p>
            </div>

            {categoryData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="icon-[lucide--pie-chart] size-12 mx-auto mb-2" />
                  <p>No hay datos de distribución</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Distribution and Workload */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role Distribution */}
          <div className="bg-white border rounded-lg p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Distribución por Rol
              </h4>
              <p className="text-sm text-gray-600">
                Composición del equipo por tipo de rol
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workload Distribution */}
          <div className="bg-white border rounded-lg p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Distribución de Carga de Trabajo
              </h4>
              <p className="text-sm text-gray-600">
                Casos asignados vs resueltos por miembro
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
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
                    dataKey="assigned"
                    fill="#93c5fd"
                    radius={[4, 4, 0, 0]}
                    name="Asignados"
                  />
                  <Bar
                    dataKey="resolved"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Resueltos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Performance Table */}
      {assignments.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Rendimiento Individual Detallado
            </h4>
            <p className="text-sm text-gray-600">
              Métricas detalladas por miembro del equipo
            </p>
          </div>

          <div className="space-y-3">
            {assignments.map((member, index) => {
              const efficiencyRate =
                member.assignedCount > 0
                  ? (member.resolvedCount / member.assignedCount) * 100
                  : 0;

              const performanceColor =
                member.productivityScore >= 80
                  ? "text-green-600"
                  : member.productivityScore >= 60
                    ? "text-blue-600"
                    : member.productivityScore >= 40
                      ? "text-yellow-600"
                      : "text-red-600";

              const performanceBg =
                member.productivityScore >= 80
                  ? "bg-green-50 border-green-200"
                  : member.productivityScore >= 60
                    ? "bg-blue-50 border-blue-200"
                    : member.productivityScore >= 40
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-red-50 border-red-200";

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${performanceBg}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                        style={{
                          backgroundColor: index < 3 ? "#10b981" : "#6b7280",
                        }}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {member.investigator}
                        </span>
                        <span className="ml-2 text-xs px-2 py-1 bg-gray-200 rounded-full">
                          {member.role === "ADMIN" ? "Admin" : "Miembro"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${performanceColor}`}>
                        {member.productivityScore}%
                      </div>
                      <div className="text-xs text-gray-600">Productividad</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {member.assignedCount}
                      </div>
                      <div className="text-gray-600">Asignados</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {member.resolvedCount}
                      </div>
                      <div className="text-gray-600">Resueltos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {member.avgTime}d
                      </div>
                      <div className="text-gray-600">Tiempo Prom.</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {(efficiencyRate ?? 0).toFixed(1)}%
                      </div>
                      <div className="text-gray-600">Eficiencia</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${member.productivityScore}%`,
                          backgroundColor:
                            member.productivityScore >= 80
                              ? "#10b981"
                              : member.productivityScore >= 60
                                ? "#3b82f6"
                                : member.productivityScore >= 40
                                  ? "#f59e0b"
                                  : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Data State */}
      {assignments.length === 0 && (
        <div className="bg-white border rounded-lg p-12 text-center">
          <i className="icon-[lucide--users] size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay datos de rendimiento disponibles
          </h3>
          <p className="text-gray-600">
            Los datos de rendimiento aparecerán cuando haya miembros con
            reportes asignados.
          </p>
        </div>
      )}

      {/* Team Insights */}
      {assignments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <i className="icon-[lucide--users] size-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-800">Análisis del Equipo</h5>
              <p className="text-sm text-blue-700 mt-1">
                {(() => {
                  const topPerformer = assignments[0];
                  const averageProductivity =
                    assignments.reduce(
                      (acc, member) => acc + member.productivityScore,
                      0
                    ) / assignments.length;

                  if (averageProductivity >= 80) {
                    return `Excelente rendimiento del equipo con un promedio de ${averageProductivity.toFixed(1)}% de productividad.`;
                  } else if (averageProductivity >= 60) {
                    return `Buen rendimiento general. ${topPerformer.investigator} lidera con ${topPerformer.productivityScore}% de productividad.`;
                  } else {
                    return `El equipo necesita mejorar. Considera capacitación adicional o redistribución de cargas de trabajo.`;
                  }
                })()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
