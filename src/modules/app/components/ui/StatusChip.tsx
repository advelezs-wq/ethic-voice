"use client";

import { Chip, cn, type ChipProps } from "@heroui/react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSNAMES: Record<StatusTone, string> = {
  success: "bg-ev-signal-wash text-ev-moss",
  warning: "bg-[#FBF0DC] text-[#8C5C15]",
  danger: "bg-[#FBE6E1] text-[#9C2F1F]",
  info: "bg-[#E4ECEC] text-ev-slate",
  neutral: "bg-ev-bone text-ev-mute",
};

export interface StatusChipProps extends Omit<ChipProps, "color"> {
  tone?: StatusTone;
}

/** Etiqueta de estado (estado del caso, severidad, estado de la organización…). */
export function StatusChip({ tone = "neutral", className, variant = "flat", ...props }: StatusChipProps) {
  return (
    <Chip
      variant={variant}
      radius="full"
      size="sm"
      className={cn("h-6 px-1 text-xs font-medium", TONE_CLASSNAMES[tone], className)}
      {...props}
    />
  );
}
