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

/** Consistent empty/zero-state block for lists and tables. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold text-[#0d212c]">{title}</p>
      {description ? <p className="max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
