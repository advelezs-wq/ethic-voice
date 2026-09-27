"use client";

import type { ReactNode } from "react";
import { cn } from "@heroui/react";
import { Card } from "./Card";

export type StatTileTone = "lime" | "emerald" | "sky" | "amber" | "rose" | "slate";

// El tono ya no pinta un chip pastel: marca el punto de estado junto a la etiqueta.
const TONE_DOT: Record<StatTileTone, string> = {
  lime: "bg-ev-signal",
  emerald: "bg-ev-moss",
  sky: "bg-ev-slate",
  amber: "bg-ev-amber",
  rose: "bg-ev-coral",
  slate: "bg-ev-haze",
};

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatTileTone;
  className?: string;
  /** Contenido opcional bajo la cifra — una leyenda o una barra de progreso. */
  footer?: ReactNode;
}

/** Métrica: etiqueta de registro en mono + cifra grande tabular (BRAND.md § Tipografía). */
export function StatTile({ label, value, icon, tone = "emerald", className, footer }: StatTileProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="ev-label flex min-w-0 items-center gap-2 text-ev-mute">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[tone])} aria-hidden />
          <span className="truncate">{label}</span>
        </p>
        {icon ? <span className="shrink-0 text-ev-haze [&_i]:size-[18px]">{icon}</span> : null}
      </div>
      <p className="ev-num mt-4 text-[2rem] font-semibold leading-none text-ev-night">{value}</p>
      {footer}
    </Card>
  );
}
