"use client";

import Link from "next/link";
import { Button, RevealHeading, Voice } from "./primitives";
import { trackCta, useDemoCta } from "../hooks/useDemoCta";

/**
 * Cierre de página en lima de marca: el único bloque del sitio a sangre en
 * `signal`. Las tres barras del isotipo, a escala monumental, cruzan el fondo.
 */
export function ClosingCta({
  placement = "closing",
  title,
}: {
  placement?: string;
  title?: React.ReactNode[];
}) {
  const demo = useDemoCta();

  return (
    <section
      data-hide-sticky
      className="relative isolate overflow-hidden bg-ev-signal text-ev-night"
      aria-labelledby="closing-cta-title"
    >
      <svg
        className="pointer-events-none absolute -right-[34%] top-1/2 -z-10 hidden h-[120%] w-auto -translate-y-1/2 opacity-[0.16] lg:block xl:-right-[22%]"
        viewBox="0 0 48 40"
        fill="none"
        aria-hidden
        data-inview
      >
        <path
          d="M10.5 12H37.5M10.5 20.5H37.5M10.5 29H23"
          stroke="#0B1D21"
          strokeWidth="4.4"
          strokeLinecap="round"
          pathLength={1}
          data-draw
        />
        <circle cx="30.6" cy="29" r="2.5" fill="#0B1D21" />
        <circle cx="37.4" cy="29" r="2.5" fill="#0B1D21" />
      </svg>

      <div className="mx-auto max-w-[var(--ev-max)] px-[var(--ev-gutter)] py-24 sm:py-32 lg:py-40">
        <p className="ev-label text-ev-night/60">Siguiente paso</p>
        <RevealHeading
          id="closing-cta-title"
          className="ev-display mt-6 max-w-5xl"
          lines={
            title ?? [
              "Escucha a tiempo.",
              <>
                Actúa con <Voice>evidencia.</Voice>
              </>,
            ]
          }
        />
        <p className="mt-8 max-w-xl text-lg leading-relaxed tracking-[-0.01em] text-ev-night/75">
          En 30 minutos te mostramos la plataforma con casos de tu industria y
          resolvemos tus dudas de implementación. Sin compromiso, en español.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            variant="ink"
            size="lg"
            arrow
            onClick={demo("closing_demo", placement)}
          >
            Agendar demo gratis
          </Button>
          <Link
            href="/pricing"
            onClick={() => trackCta("closing_pricing", placement)}
            className="ev-press inline-flex h-14 items-center justify-center rounded-full border border-ev-night/25 px-7 text-base font-medium hover:border-ev-night/60"
          >
            Ver precios
          </Link>
        </div>
      </div>
    </section>
  );
}
