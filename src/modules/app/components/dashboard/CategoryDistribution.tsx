import React from "react";
import type { CategoryData } from "@/types/dashboard.types";
import { getReportTypeLabel } from "../../utils/dashboard.utils";
import { ChartCard } from "./ChartCard";
import { DistributionList } from "./DistributionList";

interface CategoryDistributionProps {
  categoryData: CategoryData[];
}

/** Tipos de conducta más denunciados, de mayor a menor. */
export const CategoryDistribution: React.FC<CategoryDistributionProps> = ({ categoryData }) => {
  const rows = (Array.isArray(categoryData) ? categoryData : [])
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((c) => ({ label: getReportTypeLabel(c.name), count: c.value, color: c.color || "#244850" }));

  return (
    <ChartCard title="Denuncias por tipo" description="Las conductas más reportadas, de mayor a menor">
      <DistributionList rows={rows} emptyText="Aún no hay denuncias con tipo asignado." />
    </ChartCard>
  );
};
