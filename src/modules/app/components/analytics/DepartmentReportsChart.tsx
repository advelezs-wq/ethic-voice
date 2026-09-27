"use client";

import { DistributionList } from "../dashboard/DistributionList";

interface DepartmentReportsChartProps {
  data: Array<{
    department: string;
    count: number;
    percentage?: number;
    [key: string]: unknown;
  }>;
}

/**
 * Dónde se concentran las denuncias. Si nada tiene departamento aún, lo dice
 * y explica cómo resolverlo, en lugar de mostrar un gráfico vacío.
 */
export function DepartmentReportsChart({ data }: DepartmentReportsChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const onlyUnassigned = sorted.length > 0 && sorted.every((d) => /sin departamento/i.test(d.department));

  return (
    <div className="space-y-4">
      {onlyUnassigned && (
        <p className="rounded-xl border border-dashed border-ev-line bg-ev-paper px-4 py-3 text-sm text-ev-mute">
          Ninguna denuncia tiene departamento todavía. Asígnalo desde el detalle de cada denuncia
          (o crea departamentos en <span className="text-ev-night">Organización</span>) para ver
          dónde se concentran los casos.
        </p>
      )}
      <DistributionList
        emptyText="Aún no hay denuncias."
        rows={sorted.map((d) => ({
          label: d.department,
          count: d.count,
          color: /sin departamento/i.test(d.department) ? "#8FA2A5" : "#244850",
        }))}
      />
    </div>
  );
}
