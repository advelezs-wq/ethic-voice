"use client";

import type { CSSProperties, MouseEvent } from "react";

/**
 * Efecto "spotlight" que sigue al cursor — extraído del landing de
 * referencia (ethicvoice-web-completa): un halo radial que se posiciona
 * mediante variables CSS actualizadas en cada `pointermove`, en vez de
 * re-renderizar React. Úsalo junto a `<SpotlightGlow />` dentro de una
 * tarjeta con clase `group relative`.
 */
export function handleSpotlightMove(event: MouseEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;
  event.currentTarget.style.setProperty("--spotlight-x", `${x}%`);
  event.currentTarget.style.setProperty("--spotlight-y", `${y}%`);
}

/** Valor inicial para que el halo no aparezca en una esquina antes del primer `pointermove`. */
export const SPOTLIGHT_INITIAL_STYLE: CSSProperties = {
  ["--spotlight-x" as string]: "50%",
  ["--spotlight-y" as string]: "50%",
};

/**
 * Halo radial decorativo. Colocar como primer hijo de una tarjeta con
 * `group relative overflow-hidden` — permanece invisible hasta el hover.
 */
export function SpotlightGlow({
  color,
  size = 420,
}: {
  /** Color del halo, p. ej. "rgba(16,185,129,0.16)" */
  color: string;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        background: `radial-gradient(${size}px circle at var(--spotlight-x) var(--spotlight-y), ${color}, transparent 42%)`,
      }}
    />
  );
}
