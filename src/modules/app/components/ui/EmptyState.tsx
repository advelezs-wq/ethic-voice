"use client";

import type { ReactNode } from "react";
import { cn } from "@heroui/react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Estado vacío consistente para listas y tablas. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ev-line bg-white/50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ev-bone text-ev-mute [&_i]:size-5">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold tracking-[-0.015em] text-ev-night">{title}</p>
      {description ? <p className="max-w-sm text-sm leading-relaxed text-ev-mute">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
