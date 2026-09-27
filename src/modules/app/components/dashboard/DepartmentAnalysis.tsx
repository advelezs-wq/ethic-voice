import React from "react";
import type { DepartmentData } from "@/types/dashboard.types";
import { ChartCard } from "./ChartCard";
import { DistributionList } from "./DistributionList";

interface DepartmentAnalysisProps {
  departments: DepartmentData[];
}

/** En qué áreas de la organización se concentran las denuncias. */
export const DepartmentAnalysis: React.FC<DepartmentAnalysisProps> = ({ departments }) => {
  const onlyUnassigned =
    departments.length === 1 && /sin departamento/i.test(departments[0]?.name ?? "");
  return (
    <ChartCard
      title="Denuncias por departamento"
      description={
        onlyUnassigned
          ? "Asigna un departamento a cada denuncia para ver dónde se concentran."
          : "Áreas de la organización donde se concentran los casos"
      }
    >
      <DistributionList
        emptyText="Aún no hay denuncias con departamento asignado."
        rows={departments.map((d) => ({
          label: d.name,
          count: d.count,
          color: /sin departamento/i.test(d.name) ? "#8FA2A5" : "#244850",
        }))}
      />
    </ChartCard>
  );
};
