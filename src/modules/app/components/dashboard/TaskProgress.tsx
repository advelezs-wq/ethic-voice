"use client";

import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Report } from "@/types/dashboard.types";

interface TaskProgressProps {
  reports: Report[];
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ reports }) => {
  const totalAssigned = reports.length;
  const completed = reports.filter((r) => r.status === "closed").length;
  const inProgress = reports.filter((r) => r.status === "progress").length;
  const pending = reports.filter((r) => r.status === "new").length;

  const completionRate =
    totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Progreso de Tareas</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Tasa de Completación</span>
            <span className="text-sm font-bold">
              {(completionRate ?? 0).toFixed(1)}%
            </span>
          </div>
          <Progress value={completionRate} color="success" size="lg" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="icon-[lucide--check-circle] size-5 text-green-600" />
              <span className="text-sm font-medium">Completados</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {completed}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="icon-[lucide--loader] size-5 text-blue-600" />
              <span className="text-sm font-medium">En Progreso</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
              {inProgress}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="icon-[lucide--clock] size-5 text-yellow-600" />
              <span className="text-sm font-medium">Pendientes</span>
            </div>
            <span className="text-lg font-bold text-yellow-600">{pending}</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Tiempo promedio de resolución</p>
          <p className="text-xl font-bold text-gray-900">3.5 días</p>
        </div>
      </CardBody>
    </Card>
  );
};
