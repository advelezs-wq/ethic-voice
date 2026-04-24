"use client";

import type { ReactNode } from "react";
import { cn } from "@heroui/react";

type Guide = number | { percent: number; accent?: boolean };

type Props = {
  id?: string;
  className?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  guides?: readonly Guide[];
  surface?: boolean;
};

const DEFAULT_GUIDES: readonly Guide[] = [25, 50, 75];

function normalizeGuide(guide: Guide) {
  if (typeof guide === "number") return { percent: guide, accent: false };
  return { percent: guide.percent, accent: guide.accent ?? false };
}

export function MarketingSectionV2({
  id,
  className,
  eyebrow,
  title,
  subtitle,
  children,
  guides = DEFAULT_GUIDES,
  surface = false,
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden border-t border-slate-200 py-20 md:py-24",
        surface ? "bg-[#f7faf9]" : "bg-white",
        id && "scroll-mt-[max(5.5rem,calc(env(safe-area-inset-top)+4.25rem))]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        {guides.map((raw, i) => {
          const guide = normalizeGuide(raw);
          return (
            <div
              key={`${i}-${guide.percent}`}
              className={cn(
                "absolute bottom-0 top-0 w-px",
                guide.accent
                  ? "bg-gradient-to-b from-lime-500/35 via-lime-500/12 to-transparent"
                  : "bg-slate-200"
              )}
              style={{ left: `${guide.percent}%`, transform: "translateX(-50%)" }}
            />
          );
        })}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
        {(eyebrow || title || subtitle) && (
          <header className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
            {eyebrow ? (
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-lime-700">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-3xl font-extrabold uppercase tracking-tight text-[#0d212c] md:text-4xl lg:text-[2.5rem]">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#273c46] md:text-base">
                {subtitle}
              </p>
            ) : null}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
