"use client";

import type { ReactNode } from "react";
import { cn } from "@heroui/react";
import { Card } from "./Card";

export type StatTileTone = "lime" | "emerald" | "sky" | "amber" | "rose" | "slate";

const TONE_CLASSNAMES: Record<StatTileTone, string> = {
  lime: "bg-lime-50 text-lime-700",
  emerald: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
};

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatTileTone;
  className?: string;
  /** Optional content below the value/icon row — a caption or a progress bar. */
  footer?: ReactNode;
}

/** Metric card: soft pastel icon chip + big number + label — used in stat rows across the dashboard. */
export function StatTile({ label, value, icon, tone = "emerald", className, footer }: StatTileProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#0d212c]">{value}</p>
        </div>
        {icon ? (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONE_CLASSNAMES[tone])}>
            {icon}
          </div>
        ) : null}
      </div>
      {footer}
    </Card>
  );
}
