"use client";

import React from "react";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";

type CalendlyCtaProps = {
  className?: string;
  children?: React.ReactNode;
};

export const CalendlyCta: React.FC<CalendlyCtaProps> = ({ className, children }) => {
  const { openCalendly, calendlyAllowed } = useCalendlyGate();

  return (
    <button
      type="button"
      onClick={openCalendly}
      className={className}
      title={
        calendlyAllowed
          ? undefined
          : "Activa las cookies opcionales para usar el agenda de Calendly"
      }
    >
      {children}
    </button>
  );
};
