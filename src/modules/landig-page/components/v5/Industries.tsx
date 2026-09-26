import type { CSSProperties } from "react";
import { INDUSTRIES } from "./content";

/**
 * Cinta tipográfica de industrias. Una sola línea a escala display,
 * separadas por el punto del isotipo. Se detiene con movimiento reducido.
 */
export function Industries() {
  const row = [...INDUSTRIES, ...INDUSTRIES];
  return (
    <section
      aria-label="Industrias"
      className="overflow-hidden border-y border-ev-line bg-ev-paper py-10 sm:py-14"
    >
      <p className="ev-label mx-auto mb-8 max-w-[var(--ev-max)] px-[var(--ev-gutter)] text-ev-mute">
        Hecho para cualquier sector
      </p>
      <div className="flex [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <ul
          className="ev-marquee flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12"
          style={{ "--dur": "60s" } as CSSProperties}
        >
          {row.map((name, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= INDUSTRIES.length}
              className="flex shrink-0 items-center gap-8 whitespace-nowrap text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-none tracking-[-0.05em] text-ev-night sm:gap-12"
            >
              {name}
              <span className="h-3 w-3 rounded-full bg-ev-signal sm:h-4 sm:w-4" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
