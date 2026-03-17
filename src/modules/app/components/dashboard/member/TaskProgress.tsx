import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Report } from "@/types/dashboard.types";

interface TaskProgressProps {
  reports: Report[];
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ reports }) => {
  // Calculate progress by status
  const statusCounts = {
    new: reports.filter(r => r.status === "new").length,
    progress: reports.filter(r => r.status === "progress").length,
    closed: reports.filter(r => r.status === "closed" || r.status === "archived").length,
  };

  const total = reports.length;
  const progressData = [
    {
      label: "Nuevos",
      count: statusCounts.new,
      percentage: total > 0 ? (statusCounts.new / total) * 100 : 0,
      color: "danger",
      bgColor: "bg-red-500",
    },
    {
      label: "En Progreso",
      count: statusCounts.progress,
      percentage: total > 0 ? (statusCounts.progress / total) * 100 : 0,
      color: "warning",
      bgColor: "bg-yellow-500",
    },
    {
      label: "Completados",
      count: statusCounts.closed,
      percentage: total > 0 ? (statusCounts.closed / total) * 100 : 0,
      color: "success",
      bgColor: "bg-green-500",
    },
  ];

  // Priority breakdown
  const priorityCounts = {
    urgent: reports.filter(r => r.severity === "URGENT").length,
    high: reports.filter(r => r.severity === "HIGH").length,
    normal: reports.filter(r => r.severity === "NORMAL").length,
    low: reports.filter(r => r.severity === "LOW").length,
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">
          Estado de Mis Tareas
        </h3>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Progreso General
            </span>
            <span className="text-sm text-gray-500">
              {statusCounts.closed}/{total} completados
            </span>
          </div>
          <Progress
            value={total > 0 ? (statusCounts.closed / total) * 100 : 0}
            color="success"
            size="lg"
            className="w-full"
          />
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Distribución por Estado
          </h4>
          {progressData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.bgColor}`}></div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {item.count}
                </span>
                <Chip
                  size="sm"
                  color={item.color as "danger" | "warning" | "success" | "default" | "primary" | "secondary"}
                  variant="flat"
                >
                  {(item.percentage ?? 0).toFixed(0)}%
                </Chip>
              </div>
            </div>
          ))}
        </div>

        {/* Priority Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Prioridad de Casos Pendientes
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {priorityCounts.urgent}
              </div>
              <div className="text-xs text-red-600 font-medium">
                Urgente
              </div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {priorityCounts.high}
              </div>
              <div className="text-xs text-orange-600 font-medium">
                Alta
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {priorityCounts.normal}
              </div>
              <div className="text-xs text-yellow-600 font-medium">
                Normal
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {priorityCounts.low}
              </div>
              <div className="text-xs text-green-600 font-medium">
                Baja
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 text-center">
            {statusCounts.new > 0
              ? `Tienes ${statusCounts.new} caso${statusCounts.new > 1 ? 's' : ''} nuevo${statusCounts.new > 1 ? 's' : ''} por revisar`
              : "¡Excelente! No tienes casos nuevos pendientes"}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}; 