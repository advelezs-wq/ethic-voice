import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import type { DepartmentData } from "@/types/dashboard.types";

interface DepartmentAnalysisProps {
  departments: DepartmentData[];
}

export const DepartmentAnalysis: React.FC<DepartmentAnalysisProps> = ({
  departments,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <i
            className="icon-[lucide--building-2] size-5 text-gray-600"
            role="img"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold">Análisis por Departamento</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {departments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay datos de departamentos disponibles
            </p>
          ) : (
            departments.map((dept, index) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {dept.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {dept.count} reportes
                    </span>
                    <span className="text-sm font-medium">
                      {(dept.percentage ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={dept.percentage}
                  color={
                    index === 0 ? "danger" : index === 1 ? "warning" : "primary"
                  }
                  size="md"
                />
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};
