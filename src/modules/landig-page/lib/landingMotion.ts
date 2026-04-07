import type { Transition, Variants } from "framer-motion";

/** Curva suave tipo ease-out (sutil, no brusca) */
export const LANDING_EASE = [0.22, 1, 0.36, 1] as const;

export const LANDING_DURATION = 0.5;

/** Disparo temprano pero con margen inferior para no animar fuera de pantalla */
export const LANDING_VIEWPORT = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -32px 0px",
} as const;

export function landingTransition(delay = 0): Transition {
  return {
    duration: LANDING_DURATION,
    ease: LANDING_EASE,
    delay,
  };
}

export function staggerContainerVariants(reducedMotion: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.08,
        delayChildren: reducedMotion ? 0 : 0.05,
      },
    },
  };
}

export function staggerItemVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: LANDING_DURATION, ease: LANDING_EASE },
    },
  };
}
