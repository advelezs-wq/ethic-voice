"use client";

import type { ReactNode } from "react";
import { cn } from "@heroui/react";

export interface PageHeroProps {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * Encabezado de página del dashboard, con el mismo lenguaje editorial del
 * sitio (BRAND.md): etiqueta de registro en mono, titular Geist con tracking
 * negativo y una regla fina debajo. Sobre papel, sin banda oscura: la
 * navegación ya aporta la tinta.
 */
export function PageHero({ kicker, title, description, actions, className, children }: PageHeroProps) {
  return (
    <header className={cn("mb-8 border-b border-ev-line pb-6", className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {kicker ? (
            <p className="ev-label flex items-center gap-2 text-ev-mute">
              <span className="h-1.5 w-1.5 shrink-0 bg-ev-signal" aria-hidden />
              {kicker}
            </p>
          ) : null}
          <h1 className="mt-3 text-[clamp(1.625rem,2.6vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-ev-night">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ev-mute">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}
