"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Button,
  Container,
  RevealHeading,
  Voice,
  reveal,
} from "@/modules/brand/components/primitives";
import { trackCta, useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import type { LandingVariant } from "@/modules/landig-page/lib/landingConversion";

const REPORT_TEXT =
  "Observé pagos recurrentes a un proveedor vinculado al jefe de compras. Tengo las facturas.";

/** Escribe el texto de la denuncia cuando la tarjeta entra en pantalla. */
function useTyping(text: string, startDelay = 900) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setCount(text.length);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    let interval: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(() => {
          interval = window.setInterval(() => {
            setCount((c) => {
              if (c >= text.length) {
                window.clearInterval(interval);
                return c;
              }
              return c + 1;
            });
          }, 26);
        }, startDelay);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [text, startDelay]);

  return { ref, typed: text.slice(0, count), done: count >= text.length };
}

function CaseCard() {
  const { ref, typed, done } = useTyping(REPORT_TEXT);

  return (
    <div
      ref={ref}
      className="relative w-full max-w-[25rem] rounded-[1.25rem] border border-ev-night/10 bg-white p-1.5 shadow-[0_28px_56px_-28px_rgba(11,29,33,0.32),0_2px_6px_rgba(11,29,33,0.06)]"
    >
      <div className="flex items-center justify-between rounded-[0.9rem] bg-ev-paper px-4 py-3">
        <span className="ev-label text-ev-night">EV-2026-0148</span>
        <span className="ev-label flex items-center gap-1.5 text-ev-mute">
          <span className="ev-blink h-1.5 w-1.5 rounded-full bg-ev-signal" />
          Recibida 09:42
        </span>
      </div>

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="ev-label rounded-full bg-ev-night px-2.5 py-1 text-white">
            Anónima
          </span>
          <span className="ev-label rounded-full border border-ev-line px-2.5 py-1 text-ev-mute">
            Formulario web
          </span>
        </div>

        <p className="mt-4 min-h-[4.5rem] text-[0.9375rem] leading-relaxed tracking-[-0.01em] text-ev-ink">
          {typed}
          {!done && (
            <span className="ev-blink ml-px inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-ev-night" />
          )}
        </p>

        <div
          className={`mt-4 border-t border-dashed border-ev-line pt-4 transition-[opacity,transform] duration-700 ease-ev-out ${
            done ? "opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <p className="ev-label text-ev-moss">Análisis IA</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-ev-signal-wash px-2 py-1 text-xs font-medium text-ev-night">
              Conflicto de intereses
            </span>
            <span className="rounded-md bg-[#FBE6E1] px-2 py-1 text-xs font-medium text-[#9C2F1F]">
              Riesgo alto
            </span>
            <span className="rounded-md bg-ev-bone px-2 py-1 text-xs font-medium text-ev-ink">
              Área: Compras
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-ev-night px-3.5 py-2.5 text-white">
            <span className="text-[0.8125rem] text-white/70">
              Sugerido: <span className="text-white">Comité de ética</span>
            </span>
            <span className="ev-label text-ev-signal">Asignar →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// `top` coincide con la altura de cada línea del isotipo (y / 51 del viewBox).
const ANNOTATIONS = [
  { n: "01", label: "Identidad protegida", top: "23.5%" },
  { n: "02", label: "Cifrado AES-256", top: "40.2%" },
  { n: "03", label: "Clasificada por IA", top: "56.9%" },
] as const;

const BUBBLE_PATH =
  "M11 0H37C43.075 0 48 4.925 48 11V29C48 35.075 43.075 40 37 40H17.5C14.2 40 11.6 42.2 9.6 45.6L8.1 48.2C6.9 50.3 3.9 49.8 3.4 47.4C3 45.4 1.9 42.6 1 40.4C0.35 38.8 0 37 0 35.2V11C0 4.925 4.925 0 11 0Z";

/**
 * Composición del hero: el isotipo a escala monumental, fiel al logotipo
 * (burbuja pizarra, líneas lima). Aparece la burbuja, sus tres líneas se
 * "escriben", y la denuncia real se apoya debajo con anotaciones de registro.
 */
function HeroSignal() {
  return (
    <div className="relative" data-inview>
      {/* Burbuja monumental; a su derecha queda el margen de anotación */}
      <div className="relative ml-auto w-[72%] sm:ml-0 sm:w-[58%]">
        <svg
          viewBox="0 0 48 51"
          fill="none"
          className="ev-hero-bubble block h-auto w-full overflow-visible"
          aria-hidden
        >
          <defs>
            {/* Volumen: la luz cae desde arriba a la izquierda sobre el pizarra del logo */}
            <linearGradient id="ev-bubble-fill" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor="#2C5663" />
              <stop offset="0.55" stopColor="#244850" />
              <stop offset="1" stopColor="#1A3940" />
            </linearGradient>
            <radialGradient id="ev-bubble-sheen" cx="0.22" cy="0.08" r="0.75">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ev-bubble-edge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={BUBBLE_PATH} fill="url(#ev-bubble-fill)" />
          <path d={BUBBLE_PATH} fill="url(#ev-bubble-sheen)" />
          {/* Canto iluminado de 1px: separa la burbuja del papel sin borde duro */}
          <path d={BUBBLE_PATH} stroke="url(#ev-bubble-edge)" strokeWidth="0.14" />

          {(
            [
              { d: "M10.5 12H37.5", delay: 650 },
              { d: "M10.5 20.5H37.5", delay: 850 },
              { d: "M10.5 29H23", delay: 1050 },
            ] as const
          ).map((l) => (
            <path
              key={l.d}
              d={l.d}
              stroke="#98D050"
              strokeWidth="4.4"
              strokeLinecap="round"
              pathLength={1}
              data-draw
              style={{ "--d": l.delay } as CSSProperties}
            />
          ))}
          <circle cx="30.6" cy="29" r="2.5" fill="#98D050" className="ev-hero-dot" style={{ "--d": 1450 } as CSSProperties} />
          <circle cx="37.4" cy="29" r="2.5" fill="#98D050" className="ev-hero-dot" style={{ "--d": 1600 } as CSSProperties} />
        </svg>

        {/* Anotaciones de registro: nacen en el canto de la burbuja, a la altura de cada línea */}
        <ul
          className="pointer-events-none absolute inset-y-0 left-full hidden w-[58%] sm:block"
          aria-hidden
        >
          {ANNOTATIONS.map((a, i) => (
            <li
              key={a.n}
              {...reveal(1500 + i * 160)}
              className="absolute inset-x-0 -mt-3.5 flex items-center"
              style={{ top: a.top, "--d": 1500 + i * 160 } as CSSProperties}
            >
              <span className="h-2 w-2 shrink-0 -translate-x-1 rounded-full border-2 border-ev-paper bg-ev-signal" />
              <span className="h-px w-5 shrink-0 bg-ev-night/25" />
              <span className="ev-label ml-2 whitespace-nowrap rounded-full border border-ev-night/10 bg-white/80 px-2.5 py-1.5 text-ev-night backdrop-blur">
                <span className="text-ev-moss">{a.n}</span> {a.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* La denuncia, apoyada bajo la burbuja: deja ver las tres líneas del isotipo */}
      <div
        {...reveal(500)}
        className="relative -mt-[16%] w-[92%] sm:-mt-[20%] sm:ml-[26%] sm:w-[66%]"
      >
        <CaseCard />
      </div>
    </div>
  );
}

export function Hero({ variant }: { variant: LandingVariant }) {
  const demo = useDemoCta();

  const lines =
    variant === "trust"
      ? [
          "Cumplimiento que",
          <>
            se gana la <Voice>confianza.</Voice>
          </>,
        ]
      : [
          "Cada denuncia",
          <>
            cuenta una <Voice>historia.</Voice>
          </>,
        ];

  return (
    <section className="relative isolate overflow-hidden bg-ev-paper">
      <Container className="relative pb-16 pt-10 sm:pt-14 lg:pb-20 lg:pt-16">
        <div
          {...reveal(0)}
          className="ev-label flex items-center justify-between border-b border-ev-line pb-4 text-ev-mute"
        >
          <span>
            <span className="text-ev-moss">(EV)</span> Línea ética · Latinoamérica
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-ev-signal" />
            Canal activo 24/7
          </span>
        </div>

        <RevealHeading
          as="h1"
          className="ev-display-xl relative z-10 mt-10 text-ev-night sm:mt-14"
          lines={lines}
          delay={80}
        />

        <div className="mt-12 grid gap-16 lg:mt-4 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 lg:pt-24">
            <p {...reveal(300)} className="ev-lead max-w-md text-ev-ink/80">
              Canal de denuncias anónimo, investigación y analítica con IA en
              una sola plataforma. Tu línea ética, activa en días.
            </p>

            <div
              {...reveal(420)}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button
                variant="signal"
                size="lg"
                arrow
                onClick={demo("hero_demo", "hero")}
              >
                Agendar demo gratis
              </Button>
              <Link
                href="#como-funciona"
                onClick={() => trackCta("hero_product", "hero")}
                className="ev-press inline-flex h-14 items-center justify-center rounded-full px-5 text-base font-medium text-ev-night underline decoration-ev-night/25 underline-offset-[6px] hover:decoration-ev-night"
              >
                Ver cómo funciona
              </Link>
            </div>
            <p {...reveal(500)} className="ev-label mt-5 text-ev-haze">
              30 min · Sin compromiso · En español
            </p>

            <dl
              {...reveal(600)}
              className="mt-14 grid max-w-md grid-cols-3 border-t border-ev-line pt-6"
            >
              {[
                { v: "+100", l: "Organizaciones" },
                { v: "Días", l: "Para activar" },
                { v: "24/7", l: "Canal activo" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col-reverse pr-3">
                  <dt className="ev-label mt-2 text-ev-mute">{s.l}</dt>
                  <dd className="ev-num text-3xl font-semibold text-ev-night">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:col-span-7 lg:mt-4">
            <div className="mx-auto w-full max-w-[42rem] lg:ml-auto lg:mr-0">
              <HeroSignal />
            </div>
          </div>
        </div>
      </Container>

    </section>
  );
}
