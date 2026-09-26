"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Container,
  Eyebrow,
  RevealHeading,
  Voice,
} from "@/modules/brand/components/primitives";
import { STEPS } from "./content";

// ─── Paneles de producto (UI construida en código, no screenshots) ──────────

function Frame({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-ev-night/10 bg-white shadow-[0_50px_100px_-40px_rgba(11,29,33,0.35)]">
      <div className="flex items-center justify-between border-b border-ev-line bg-ev-paper/70 px-5 py-3.5">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-ev-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-ev-line" />
          <span className="ml-2 text-sm font-medium tracking-[-0.01em] text-ev-night">{title}</span>
        </span>
        <span className="ev-label text-ev-mute">{meta}</span>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </div>
  );
}

export function PanelRecibe() {
  return (
    <Frame title="Nueva denuncia" meta="Paso 1 de 3">
      <div className="space-y-4">
        <div>
          <p className="ev-label text-ev-mute">Canal</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {["Web", "Correo", "WhatsApp", "Teléfono"].map((c, i) => (
              <span
                key={c}
                className={`truncate rounded-lg border px-1 py-2.5 text-center text-[0.8125rem] ${
                  i === 0 ? "border-ev-night bg-ev-night text-white" : "border-ev-line text-ev-mute"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="ev-label text-ev-mute">¿Qué ocurrió?</p>
          <div className="mt-2 rounded-lg border border-ev-line bg-ev-paper/60 p-3.5 text-sm leading-relaxed text-ev-ink">
            Durante el cierre de mes se aprobaron facturas sin orden de compra…
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-ev-line px-3.5 py-3">
          <span className="ev-label rounded bg-ev-bone px-1.5 py-1 text-ev-ink">PDF</span>
          <span className="text-sm text-ev-ink">facturas_marzo.pdf</span>
          <span className="ev-label ml-auto text-ev-moss">Cifrado</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-ev-signal-wash px-3.5 py-3">
          <span className="text-sm font-medium text-ev-night">Mantener mi anonimato</span>
          <span className="flex h-6 w-10 items-center rounded-full bg-ev-night px-0.5">
            <span className="ml-auto h-5 w-5 rounded-full bg-ev-signal" />
          </span>
        </div>
      </div>
    </Frame>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ev-ink">{label}</span>
        <span className="ev-num text-sm font-semibold text-ev-night">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ev-bone">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function PanelClasifica() {
  return (
    <Frame title="Análisis de IA" meta="EV-2026-0152">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-md bg-ev-signal-wash px-2.5 py-1.5 text-sm text-ev-night">Fraude financiero</span>
        <span className="rounded-md bg-[#FBE6E1] px-2.5 py-1.5 text-sm text-[#9C2F1F]">Severidad alta</span>
        <span className="rounded-md bg-ev-bone px-2.5 py-1.5 text-sm text-ev-ink">Finanzas</span>
      </div>
      <div className="mt-6 space-y-4">
        <Meter label="Nivel de riesgo" value={82} tone="bg-ev-coral" />
        <Meter label="Prioridad sugerida" value={90} tone="bg-ev-amber" />
        <Meter label="Confianza del análisis" value={96} tone="bg-ev-signal" />
      </div>
      <div className="mt-6 rounded-xl bg-ev-night p-4 text-white">
        <p className="ev-label text-ev-signal">Acción recomendada</p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/85">
          Asignar investigador senior y preservar registros contables del período.
        </p>
      </div>
    </Frame>
  );
}

export function PanelInvestiga() {
  return (
    <Frame title="Caso EV-2026-0148" meta="En investigación">
      <div className="space-y-3">
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-ev-paper px-4 py-3 text-sm leading-relaxed text-ev-ink">
          ¿Puedes indicarnos en qué fechas ocurrieron los pagos?
          <span className="ev-label mt-1.5 block text-ev-haze">Investigador · 10:14</span>
        </div>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-ev-night px-4 py-3 text-sm leading-relaxed text-white">
          Entre el 3 y el 17 de marzo. Adjunto el extracto.
          <span className="ev-label mt-1.5 block text-white/40">Anónimo · 10:31</span>
        </div>
      </div>
      <ol className="mt-6 space-y-0 border-t border-ev-line pt-5">
        {[
          { t: "Denuncia recibida", d: "12 may · 09:42", s: "done" },
          { t: "Asignada a Comité de ética", d: "12 may · 10:05", s: "done" },
          { t: "Evidencia adicional recibida", d: "Hoy · 10:31", s: "now" },
        ].map((e) => (
          <li key={e.t} className="flex items-center gap-3 py-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                e.s === "now" ? "ev-blink bg-ev-signal" : "bg-ev-night"
              }`}
            />
            <span className="text-sm text-ev-ink">{e.t}</span>
            <span className="ev-label ml-auto text-ev-haze">{e.d}</span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

export function PanelReporta() {
  const bars = [34, 52, 41, 66, 58, 81, 72];
  return (
    <Frame title="Informe para comité" meta="Trimestre actual">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Casos abiertos", v: "12" },
          { l: "Cierre medio", v: "9 d" },
          { l: "SLA cumplido", v: "98%" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-ev-line p-3.5">
            <p className="ev-label text-ev-mute">{k.l}</p>
            <p className="ev-num mt-2 text-2xl font-semibold text-ev-night">{k.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-ev-line p-4">
        <p className="ev-label text-ev-mute">Denuncias por mes</p>
        <div className="mt-4 flex h-28 items-end gap-2">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t ${i === bars.length - 2 ? "bg-ev-signal" : "bg-ev-slate/20"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-ev-mute">Listo para auditoría</span>
        <span className="ev-label rounded-full bg-ev-night px-3 py-1.5 text-white">Exportar PDF ↓</span>
      </div>
    </Frame>
  );
}

const PANELS = [PanelRecibe, PanelClasifica, PanelInvestiga, PanelReporta];

// ─── Sección ─────────────────────────────────────────────────────────────

/**
 * Relato con scroll: los pasos avanzan a la izquierda mientras el panel de
 * producto queda fijo a la derecha y cambia con cada paso (escritorio).
 * En móvil, cada paso lleva su panel debajo.
 */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.step);
            setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="como-funciona" className="relative scroll-mt-20 bg-ev-paper py-28 sm:py-36">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="03">Cómo funciona</Eyebrow>
          </div>
          <RevealHeading
            className="ev-h2 text-ev-night lg:col-span-9"
            lines={[
              "Un caso entra. La IA lo lee.",
              <>
                Tu equipo lo <Voice>resuelve.</Voice>
              </>,
            ]}
          />
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Pasos */}
          <div className="lg:col-span-5">
            {STEPS.map((step, i) => {
              const Panel = PANELS[i]!;
              const isActive = active === i;
              return (
                <article
                  key={step.key}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  data-step={i}
                  className="border-t border-ev-line py-10 lg:flex lg:min-h-[78vh] lg:flex-col lg:justify-center lg:border-t-0 lg:py-0"
                >
                  <div
                    className={`transition-opacity duration-500 lg:opacity-30 ${
                      isActive ? "lg:!opacity-100" : ""
                    }`}
                  >
                    <p className="ev-label text-ev-moss">Paso 0{i + 1}</p>
                    <h3 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-none tracking-[-0.05em] text-ev-night">
                      {step.title}
                    </h3>
                    <p className="ev-lead mt-5 max-w-md">{step.body}</p>
                    <ul className="mt-7 flex flex-wrap gap-2">
                      {step.points.map((p) => (
                        <li
                          key={p}
                          className="rounded-full border border-ev-night/15 px-3.5 py-1.5 text-sm text-ev-ink"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-10 lg:hidden">
                    <Panel />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Panel fijo (escritorio) */}
          <div className="hidden lg:col-span-6 lg:col-start-7 lg:block">
            <div className="sticky top-[calc(50vh-17rem)]">
              <div className="relative h-[34rem]">
                {PANELS.map((Panel, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 transition-[opacity,transform,filter] duration-700 ease-ev-out"
                    style={{
                      opacity: active === i ? 1 : 0,
                      transform:
                        active === i
                          ? "none"
                          : `translate3d(0, ${i < active ? -24 : 24}px, 0) scale(0.98)`,
                      filter: active === i ? "none" : "blur(4px)",
                      pointerEvents: active === i ? "auto" : "none",
                    }}
                    aria-hidden={active !== i}
                  >
                    <Panel />
                  </div>
                ))}
              </div>
              {/* Progreso */}
              <div className="mt-8 flex items-center gap-3">
                {STEPS.map((s, i) => (
                  <span key={s.key} className="flex items-center gap-3">
                    <span
                      className={`ev-label transition-colors duration-300 ${
                        active === i ? "text-ev-night" : "text-ev-haze"
                      }`}
                    >
                      0{i + 1} {s.title}
                    </span>
                    {i < STEPS.length - 1 && <span className="h-px w-6 bg-ev-line" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
