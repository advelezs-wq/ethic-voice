"use client";

import { useState } from "react";
import { VideoModal } from "@/modules/landig-page/components/VideoModal";
import { Container, Eyebrow, reveal } from "@/modules/brand/components/primitives";
import { trackCta } from "@/modules/brand/hooks/useDemoCta";

const VIDEO_SRC = "/demo-video.mp4";
const POSTER_SRC = "/platform/ethicvoice-hero-frame.jpg";

const CASES = [
  { id: "EV-0152", t: "Pagos sin orden de compra", tag: "Riesgo alto", tone: "bg-[#DB4F3A]" },
  { id: "EV-0149", t: "Trato irrespetuoso en planta", tag: "Acoso laboral", tone: "bg-[#E09A2B]" },
  { id: "EV-0148", t: "Proveedor vinculado a compras", tag: "Conflicto", tone: "bg-[#98D050]" },
  { id: "EV-0141", t: "Uso indebido de activos", tag: "Cerrado", tone: "bg-white/30" },
] as const;

/**
 * Póster del recorrido construido en código: una vista abstracta del panel
 * (sin datos reales de ningún cliente) en lugar de una foto de stock.
 */
function TourPoster() {
  return (
    <span className="absolute inset-0 flex flex-col bg-[#10252A] text-left">
      <span className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ev-label ml-3 rounded-full bg-white/[0.06] px-3 py-1 text-white/45">
          ethicvoice.co/app
        </span>
      </span>
      <span className="flex min-h-0 flex-1">
        <span className="hidden w-[18%] flex-col gap-3 border-r border-white/10 p-5 sm:flex">
          {[70, 55, 62, 48, 58].map((w, i) => (
            <span
              key={i}
              className={`h-2 rounded-full ${i === 0 ? "bg-ev-signal" : "bg-white/10"}`}
              style={{ width: `${w}%` }}
            />
          ))}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
          <span className="grid grid-cols-3 gap-3">
            {[
              { l: "Nuevas", v: "12" },
              { l: "En investigación", v: "5" },
              { l: "Resueltas", v: "28" },
            ].map((k) => (
              <span key={k.l} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                <span className="ev-label block text-white/40">{k.l}</span>
                <span className="ev-num mt-2 block text-2xl font-semibold text-white sm:text-4xl">{k.v}</span>
              </span>
            ))}
          </span>
          <span className="flex flex-col divide-y divide-white/[0.07] rounded-xl border border-white/10">
            {CASES.map((c) => (
              <span key={c.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${c.tone}`} />
                <span className="ev-label shrink-0 text-white/40">{c.id}</span>
                <span className="truncate text-xs text-white/80 sm:text-sm">{c.t}</span>
                <span className="ev-label ml-auto hidden shrink-0 text-white/40 sm:block">{c.tag}</span>
              </span>
            ))}
          </span>
        </span>
      </span>
    </span>
  );
}

/** Recorrido en video: un solo gesto — el botón de reproducir a escala. */
export function ProductTour() {
  const [open, setOpen] = useState(false);

  return (
    <section className="ev-grain ev-grain-dark relative overflow-hidden bg-ev-night py-24 text-white sm:py-32">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow index="04" tone="dark">
              Recorrido del producto
            </Eyebrow>
            <h2 className="ev-h2 mt-6 max-w-2xl">
              Míralo en <em className="ev-serif text-ev-signal">acción.</em>
            </h2>
          </div>
          <p className="max-w-sm text-[0.975rem] leading-relaxed text-white/55">
            Del formulario del denunciante al informe del comité, en un solo
            panel. Intuitivo para quien reporta y para quien investiga.
          </p>
        </div>

        <button
          type="button"
          {...reveal(100)}
          onClick={() => {
            trackCta("product_tour_play", "product_tour");
            setOpen(true);
          }}
          className="group relative mt-14 block aspect-video w-full overflow-hidden rounded-[1.75rem] ring-1 ring-white/10"
          aria-label="Reproducir recorrido del producto"
        >
          <TourPoster />
          <span className="absolute inset-0 bg-ev-night/30 transition-colors duration-500 group-hover:bg-ev-night/10" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ev-signal text-ev-night shadow-[0_20px_60px_-10px_rgba(152,208,80,0.6)] transition-transform duration-300 ease-ev-out group-hover:scale-105 group-active:scale-95 sm:h-28 sm:w-28">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 sm:h-9 sm:w-9" aria-hidden>
                <path d="M7 4.5v15l12.5-7.5L7 4.5Z" fill="currentColor" />
              </svg>
            </span>
          </span>
          <span className="ev-label absolute bottom-5 left-5 text-white/70 sm:bottom-7 sm:left-7">
            EthicVoice · Product tour
          </span>
        </button>
      </Container>

      <VideoModal
        videoSrc={VIDEO_SRC}
        posterSrc={POSTER_SRC}
        embedOnly
        isOpen={open}
        onOpenChange={setOpen}
      />
    </section>
  );
}
