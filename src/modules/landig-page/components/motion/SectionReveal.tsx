"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";
import {
  LANDING_DURATION,
  LANDING_EASE,
  LANDING_VIEWPORT,
} from "@/modules/landig-page/lib/landingMotion";

type SectionRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Desplazamiento vertical inicial (px) */
  y?: number;
};

/**
 * Entrada suave al entrar en viewport: opacidad + ligero movimiento Y.
 * Respeta prefers-reduced-motion (sin animación).
 */
export function SectionReveal({
  children,
  className,
  delay = 0,
  y = 12,
}: SectionRevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={cn(className)}>{children}</div>;
  }
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={LANDING_VIEWPORT}
      transition={{ duration: LANDING_DURATION, ease: LANDING_EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

type SectionRevealXProps = SectionRevealProps & {
  x?: number;
};

/** Variante horizontal (útil para columnas izquierda/derecha) */
export function SectionRevealX({
  children,
  className,
  delay = 0,
  x = 14,
}: SectionRevealXProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={cn(className)}>{children}</div>;
  }
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={LANDING_VIEWPORT}
      transition={{ duration: LANDING_DURATION, ease: LANDING_EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
