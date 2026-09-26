"use client";

import type { CSSProperties } from "react";
import {
  Button,
  Container,
  Eyebrow,
  RevealHeading,
  Voice,
  reveal,
} from "@/modules/brand/components/primitives";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import { AFTER, BEFORE } from "./content";

/**
 * Del correo interno a EthicVoice. Cada práctica vieja se tacha con un trazo
 * SVG a mano alzada al entrar en pantalla — el gesto de "esto ya no".
 */
export function BeforeAfter() {
  const demo = useDemoCta();

  return (
    <section className="relative bg-white py-28 sm:py-36">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="02">Una evolución necesaria</Eyebrow>
          </div>
          <RevealHeading
            className="ev-h2 text-ev-night lg:col-span-9"
            lines={[
              "Del correo interno a un canal",
              <>
                que <Voice>trabaja por ti.</Voice>
              </>,
            ]}
          />
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-12 lg:gap-8">
          {/* Hoy */}
          <div className="lg:col-span-5 lg:col-start-1">
            <p className="ev-label flex items-center justify-between border-b border-ev-line pb-4 text-ev-mute">
              <span>Hoy · correo y planillas</span>
              <span className="text-ev-coral">✕</span>
            </p>
            <ul>
              {BEFORE.map((item, i) => (
                <li
                  key={item}
                  data-inview
                  className="relative border-b border-ev-line py-5 text-[1.1875rem] tracking-[-0.02em] text-ev-mute"
                >
                  <span className="ev-strike" style={{ "--d": 300 + i * 160 } as CSSProperties}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Flecha de evolución */}
          <div className="hidden items-center justify-center lg:col-span-2 lg:flex" aria-hidden>
            <svg viewBox="0 0 80 24" className="w-full max-w-[7rem]" data-inview>
              <path
                d="M2 12H76M66 3l10 9-10 9"
                stroke="#0B1D21"
                strokeWidth="1.25"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                data-draw
                style={{ "--d": 900 } as CSSProperties}
              />
            </svg>
          </div>

          {/* Con EthicVoice */}
          <div className="lg:col-span-5">
            <p className="ev-label flex items-center justify-between border-b border-ev-night pb-4 text-ev-night">
              <span>Con EthicVoice</span>
              <span className="text-ev-moss">✓</span>
            </p>
            <ul>
              {AFTER.map((item, i) => (
                <li
                  key={item}
                  {...reveal(600 + i * 110)}
                  className="flex items-baseline gap-4 border-b border-ev-line py-5 text-[1.1875rem] tracking-[-0.02em] text-ev-night"
                >
                  <span className="ev-label shrink-0 text-ev-moss">0{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
            <Button
              variant="ink"
              arrow
              className="mt-10"
              onClick={demo("before_after_demo", "before_after")}
            >
              Ver la diferencia en una demo
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
