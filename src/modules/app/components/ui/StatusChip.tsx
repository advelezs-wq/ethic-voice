"use client";

import { Chip, cn, type ChipProps } from "@heroui/react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSNAMES: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-rose-50 text-rose-700 border border-rose-200",
  info: "bg-sky-50 text-sky-700 border border-sky-200",
  neutral: "bg-slate-100 text-slate-600 border border-slate-200",
};

export interface StatusChipProps extends Omit<ChipProps, "color"> {
  tone?: StatusTone;
}

/** Small pill status label (report status, org status, severity, ...). */
export function StatusChip({ tone = "neutral", className, variant = "flat", ...props }: StatusChipProps) {
  return (
    <Chip
      variant={variant}
      radius="full"
      className={cn("font-medium", TONE_CLASSNAMES[tone], className)}
      {...props}
    />
  );
}
