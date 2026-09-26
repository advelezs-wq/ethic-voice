"use client";

import { useState } from "react";
import { Container, Eyebrow } from "@/modules/brand/components/primitives";
import { TESTIMONIALS } from "./content";

/**
 * Una sola cita a la vez, a escala editorial. Los nombres funcionan como
 * pestañas — sin estrellas ni carrusel automático.
 */
export function Testimonials() {
  const [active, setActive] = useState(0);
  const t = TESTIMONIALS[active]!;

  return (
    <section className="relative bg-white py-28 sm:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="07">Voces del cumplimiento</Eyebrow>
            <div
              role="tablist"
              aria-label="Testimonios"
              className="mt-10 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible"
            >
              {TESTIMONIALS.map((item, i) => (
                <button
                  key={item.author}
                  type="button"
                  role="tab"
                  aria-selected={active === i}
                  onClick={() => setActive(i)}
                  className={`ev-press shrink-0 rounded-full border px-4 py-2 text-left text-sm transition-colors lg:rounded-none lg:border-0 lg:border-t lg:px-0 lg:py-4 ${
                    active === i
                      ? "border-ev-night text-ev-night"
                      : "border-ev-line text-ev-haze hover:text-ev-mute"
                  }`}
                >
                  <span className="ev-label mr-2 hidden lg:inline">0{i + 1}</span>
                  {item.author.split(" ").slice(0, 2).join(" ")}
                </button>
              ))}
            </div>
          </div>

          <figure className="lg:col-span-9" role="tabpanel">
            <svg viewBox="0 0 48 36" className="h-10 w-auto text-ev-signal sm:h-14" aria-hidden>
              <path
                d="M0 36V22C0 9.8 6.3 2.4 18.8 0l2 5.2C13.9 7.3 10.6 11.4 10.4 17H20v19H0Zm27 0V22C27 9.8 33.3 2.4 45.8 0l2 5.2C40.9 7.3 37.6 11.4 37.4 17H47v19H27Z"
                fill="currentColor"
              />
            </svg>
            <blockquote
              key={active}
              className="mt-8 animate-[ev-quote_600ms_var(--ev-ease-out)_both] text-[clamp(1.6rem,3.2vw,2.9rem)] font-medium leading-[1.14] tracking-[-0.035em] text-ev-night"
            >
              {t.quote}
            </blockquote>
            <figcaption className="mt-12 flex items-center gap-4 border-t border-ev-line pt-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ev-night font-wordmark text-sm text-ev-signal">
                {t.initials}
              </span>
              <span>
                <span className="block text-base font-medium tracking-[-0.01em] text-ev-night">
                  {t.author}
                </span>
                <span className="ev-label mt-1 block text-ev-mute">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
