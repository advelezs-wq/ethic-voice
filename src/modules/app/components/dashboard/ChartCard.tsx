"use client";

import type { ReactNode } from "react";

/**
 * Contenedor común de gráficos del dashboard: título en lenguaje simple,
 * una línea que explica qué se está viendo y, opcionalmente, la cifra clave.
 */
export function ChartCard({
  title,
  description,
  figure,
  figureLabel,
  children,
}: {
  title: string;
  description?: string;
  figure?: ReactNode;
  figureLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-ev-line bg-white">
      <header className="flex items-start justify-between gap-4 px-6 pt-5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">{title}</h3>
          {description ? <p className="mt-0.5 text-sm text-ev-mute">{description}</p> : null}
        </div>
        {figure !== undefined ? (
          <div className="shrink-0 text-right">
            <p className="ev-num text-2xl font-semibold leading-none text-ev-night">{figure}</p>
            {figureLabel ? <p className="ev-label mt-1.5 text-ev-mute">{figureLabel}</p> : null}
          </div>
        ) : null}
      </header>
      <div className="flex-1 px-4 pb-5 pt-4">{children}</div>
    </section>
  );
}

export const AXIS_TICK = { fontSize: 12, fill: "#5A6D70" };
export const GRID_STROKE = "#EAE8E0";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CountTooltip({ active, payload, unit = "denuncias" }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div className="rounded-lg border border-ev-line bg-white px-3 py-2 text-sm shadow-[0_8px_24px_-12px_rgba(11,29,33,0.3)]">
      <p className="font-medium text-ev-night">{payload[0].payload.name}</p>
      <p className="text-ev-mute">
        {v} {v === 1 ? unit.replace(/s$/, "") : unit}
      </p>
    </div>
  );
}
