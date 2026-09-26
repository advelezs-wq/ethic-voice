"use client";

import type { CSSProperties } from "react";
import {
  Button,
  Container,
  Eyebrow,
  RevealHeading,
  reveal,
} from "@/modules/brand/components/primitives";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import { SECURITY_SPECS } from "./content";

const MONO = "var(--font-mono), ui-monospace, monospace";

/**
 * Diagrama del anonimato: el denunciante y el investigador se comunican a
 * través del caso; la identidad nunca cruza el sello cifrado.
 */
function AnonymityDiagram() {
  return (
    <svg
      viewBox="0 0 800 280"
      className="h-auto w-full min-w-[640px]"
      role="img"
      aria-label="El denunciante envía su reporte cifrado al caso; el investigador responde por el mismo canal sin ver la identidad."
      data-inview
    >
      <defs>
        <path id="ev-flow-a" d="M128 140 H322" />
        <path id="ev-flow-b" d="M672 140 H478" />
      </defs>

      {/* Conectores */}
      {[
        { d: "M128 140 H322", delay: 200 },
        { d: "M478 140 H672", delay: 500 },
      ].map((c) => (
        <path
          key={c.d}
          d={c.d}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.25"
          strokeDasharray="0"
          pathLength={1}
          data-draw
          style={{ "--d": c.delay } as CSSProperties}
        />
      ))}

      {/* Paquetes en tránsito */}
      <circle r="4" fill="#98D050" className="ev-packet">
        <animateMotion dur="3.2s" repeatCount="indefinite" rotate="auto">
          <mpath href="#ev-flow-a" />
        </animateMotion>
      </circle>
      <circle r="4" fill="#ffffff" className="ev-packet">
        <animateMotion dur="3.2s" begin="1.6s" repeatCount="indefinite" rotate="auto">
          <mpath href="#ev-flow-b" />
        </animateMotion>
      </circle>

      <text x="225" y="122" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" letterSpacing="0.08em" style={{ fontFamily: MONO }}>
        AES-256 · TLS
      </text>
      <text x="575" y="122" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" letterSpacing="0.08em" style={{ fontFamily: MONO }}>
        CHAT CONFIDENCIAL
      </text>

      {/* Denunciante */}
      <g>
        <circle cx="90" cy="140" r="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.25" />
        <circle cx="90" cy="130" r="9" fill="rgba(255,255,255,0.85)" />
        <path d="M72 158c3-10 10-14 18-14s15 4 18 14" fill="rgba(255,255,255,0.85)" />
        <text x="90" y="206" textAnchor="middle" fill="#fff" fontSize="12" letterSpacing="0.08em" style={{ fontFamily: MONO }}>
          DENUNCIANTE
        </text>
        <text x="90" y="226" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" style={{ fontFamily: MONO }}>
          ████████
        </text>
      </g>

      {/* Caso sellado */}
      <g>
        <rect x="322" y="78" width="156" height="124" rx="18" fill="#98D050" />
        <rect x="386" y="104" width="28" height="22" rx="4" fill="#0B1D21" />
        <path d="M392 104v-7a8 8 0 0 1 16 0v7" stroke="#0B1D21" strokeWidth="3.5" fill="none" />
        <text x="400" y="158" textAnchor="middle" fill="#0B1D21" fontSize="13" fontWeight="600" letterSpacing="0.04em" style={{ fontFamily: MONO }}>
          EV-2026-0148
        </text>
        <text x="400" y="178" textAnchor="middle" fill="rgba(11,29,33,0.6)" fontSize="10" letterSpacing="0.08em" style={{ fontFamily: MONO }}>
          IDENTIDAD: SELLADA
        </text>
        <text x="400" y="232" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" letterSpacing="0.08em" style={{ fontFamily: MONO }}>
          REGISTRO AUDITABLE
        </text>
      </g>

      {/* Investigador */}
      <g>
        <rect x="672" y="102" width="76" height="76" rx="18" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.25" />
        <path d="M694 124h32M694 140h32M694 156h18" stroke="rgba(255,255,255,0.85)" strokeWidth="4" strokeLinecap="round" />
        <text x="710" y="206" textAnchor="middle" fill="#fff" fontSize="12" letterSpacing="0.08em" style={{ fontFamily: MONO }}>
          INVESTIGADOR
        </text>
        <text x="710" y="226" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" style={{ fontFamily: MONO }}>
          PERMISO POR ROL
        </text>
      </g>
    </svg>
  );
}

export function Security() {
  const demo = useDemoCta();

  return (
    <section
      id="seguridad"
      className="ev-grain ev-grain-dark relative scroll-mt-20 overflow-hidden bg-ev-night py-28 text-white sm:py-36"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="06" tone="dark">
              Seguridad y privacidad
            </Eyebrow>
          </div>
          <RevealHeading
            className="ev-h2 lg:col-span-9"
            lines={[
              "Anonimato por diseño,",
              <>
                no por <em className="ev-serif pr-[0.06em] text-ev-signal">promesa.</em>
              </>,
            ]}
          />
        </div>

        <div {...reveal(100)} className="mt-16 overflow-x-auto rounded-[1.75rem] border border-white/10 bg-white/[0.02] px-4 py-8 sm:px-10 sm:py-12">
          <AnonymityDiagram />
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="max-w-sm text-lg leading-relaxed tracking-[-0.01em] text-white/70">
              Confidencialidad, gobernanza y comunicación segura entre todas
              las partes. Cada acción queda registrada con fecha y responsable.
            </p>
            <Button
              variant="outline-dark"
              arrow
              className="mt-8"
              onClick={demo("security_expert", "security")}
            >
              Hablar con un experto
            </Button>
          </div>

          <dl className="lg:col-span-8">
            {SECURITY_SPECS.map((s, i) => (
              <div
                key={s.k}
                {...reveal(i * 60)}
                className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-white/10 py-4 last:border-b sm:grid-cols-[10rem_1fr]"
              >
                <dt className="ev-label pt-1 text-white/40">{s.k}</dt>
                <dd className="text-[1.0625rem] tracking-[-0.015em] text-white/90">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
