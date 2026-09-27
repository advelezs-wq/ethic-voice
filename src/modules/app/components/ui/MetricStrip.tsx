"use client";

import type { ReactNode } from "react";
import { cn } from "@heroui/react";

export type MetricTone = "signal" | "moss" | "slate" | "amber" | "coral" | "haze";

const DOT: Record<MetricTone, string> = {
  signal: "bg-ev-signal",
  moss: "bg-ev-moss",
  slate: "bg-ev-slate",
  amber: "bg-ev-amber",
  coral: "bg-ev-coral",
  haze: "bg-ev-haze",
};

export interface Metric {
  key: string;
  label: ReactNode;
  value: ReactNode;
  tone?: MetricTone;
  caption?: ReactNode;
}

/**
 * Tira de métricas: una sola superficie dividida por reglas finas, cifras
 * grandes tabulares y etiqueta de registro en mono — el mismo lenguaje de las
 * cifras de la landing (BRAND.md § Tipografía), en lugar de N tarjetas con
 * iconos pastel.
 */
export function MetricStrip({
  metrics,
  size = "lg",
  className,
}: {
  metrics: Metric[];
  size?: "lg" | "md";
  className?: string;
}) {
  const cols =
    metrics.length >= 6
      ? "grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
      : metrics.length >= 4
        ? "grid-cols-2 xl:grid-cols-4"
        : metrics.length === 3
          ? "sm:grid-cols-3"
          : "sm:grid-cols-2";
  // gap-px sobre fondo de línea: las reglas entre celdas funcionan con cualquier ajuste de filas.
  return (
    <div className={cn("grid gap-px overflow-hidden rounded-2xl border border-ev-line bg-ev-line", cols, className)}>
      {metrics.map((m) => (
        <div key={m.key} className="flex flex-col justify-between gap-5 bg-white p-5 sm:p-6">
          <p className="ev-label flex items-center gap-2 text-ev-mute">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[m.tone ?? "haze"])} aria-hidden />
            {m.label}
          </p>
          <div>
            <p
              className={cn(
                "ev-num font-semibold leading-none text-ev-night",
                size === "lg" ? "text-[2.75rem]" : "text-[2rem]",
              )}
            >
              {m.value}
            </p>
            {m.caption ? <div className="mt-2 text-sm text-ev-mute">{m.caption}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
