import React from "react";
import { ChartCard } from "./ChartCard";
import { DistributionList } from "./DistributionList";

interface SeverityIndicatorProps {
  distribution: {
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
}

/** Qué tan graves son las denuncias recibidas, según la clasificación. */
export const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({ distribution }) => (
  <ChartCard
    title="Denuncias por severidad"
    description="Qué tan grave es cada caso, según la clasificación"
  >
    <DistributionList
      emptyText="Aún no hay denuncias clasificadas."
      rows={[
        { label: "Alta", count: distribution.high, color: "#DB4F3A", hint: "Fraude, soborno o riesgo para personas" },
        { label: "Media", count: distribution.medium, color: "#E09A2B" },
        { label: "Baja", count: distribution.low, color: "#5E9427" },
        { label: "Sin clasificar", count: distribution.unknown, color: "#8FA2A5" },
      ]}
    />
  </ChartCard>
);
