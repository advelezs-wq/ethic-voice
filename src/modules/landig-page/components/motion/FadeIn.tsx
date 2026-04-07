"use client";

import React, { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";

type FadeInProps = {
  children: React.ReactNode;
  /** Retardo antes de empezar la transición (ms) */
  delayMs?: number;
  /** Duración de la transición de opacidad (ms) */
  durationMs?: number;
  className?: string;
};

/**
 * Opacidad 0 → 1 tras un retardo (setTimeout + estado).
 * Respeta prefers-reduced-motion (visible al instante).
 */
export function FadeIn({
  children,
  delayMs = 0,
  durationMs = 1000,
  className,
}: FadeInProps) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(reduce);

  useEffect(() => {
    if (reduce) {
      setVisible(true);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs, reduce]);

  return (
    <div
      className={cn("transition-opacity", className)}
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: reduce ? "0ms" : `${durationMs}ms`,
      }}
    >
      {children}
    </div>
  );
}
