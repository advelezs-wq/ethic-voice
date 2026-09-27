"use client";

import { DistributionList } from "../dashboard/DistributionList";

interface StatusDistributionChartProps {
  data: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

const STATUS: Record<string, { label: string; color: string; hint: string }> = {
  pending: { label: "Pendientes", color: "#E09A2B", hint: "Recibidas, aún sin revisar ni asignar" },
  in_progress: { label: "En investigación", color: "#244850", hint: "Con responsable asignado, en curso" },
  resolved: { label: "Resueltas", color: "#5E9427", hint: "Con conclusión, pendientes de cierre formal" },
  closed: { label: "Cerradas", color: "#5A6D70", hint: "Caso terminado y documentado" },
  archived: { label: "Archivadas", color: "#8FA2A5", hint: "Fuera del flujo activo" },
};

/**
 * En qué etapa está cada denuncia. Una sola lista con explicación de cada
 * estado (antes: dona + barras con el mismo dato y un texto automático).
 */
export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <DistributionList
      emptyText="Aún no hay denuncias."
      rows={data.map((d) => {
        const s = STATUS[d.status.toLowerCase()] ?? { label: d.status, color: "#8FA2A5", hint: "" };
        return { label: s.label, count: d.count, color: s.color, hint: s.hint };
      })}
    />
  );
}
