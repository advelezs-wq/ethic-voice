"use client";

import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { trackGA4Event } from "@/lib/google-analytics";

type Props = {
  /** Nombre del evento GA4 `cta_name` */
  ctaName?: string;
  placement?: string;
};

/**
 * Franja “Siguiente paso / Agenda tu demo” igual que en {@link FooterCTA}
 * (fondo #f7faf9, guías, botón lima).
 */
export function FooterDemoCtaBand({
  ctaName = "footer_demo",
  placement = "footer",
}: Props) {
  const { openCalendly } = useCalendlyGate();

  return (
    <div className="relative overflow-hidden bg-[#f7faf9]">
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
      >
        {[25, 50, 75].map((left) => (
          <div
            key={left}
            className="absolute bottom-0 top-0 w-px bg-slate-200"
            style={{ left: `${left}%`, transform: "translateX(-50%)" }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(94,210,156,0.12),transparent_50%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 py-14 text-center md:px-8 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">
          Siguiente paso
        </p>
        <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[#0d212c] md:text-4xl">
          Agenda tu demo personalizada
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#273c46] md:text-base">
          Descubre cómo EthicVoice protege tu empresa.
        </p>
        <button
          type="button"
          onClick={(e) => {
            trackGA4Event("landing_cta_click", { cta_name: ctaName, placement });
            openCalendly(e);
          }}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-lime-400 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#052b24] shadow-[0_4px_20px_rgba(163,230,53,0.35)] transition-colors hover:bg-lime-500"
        >
          Solicitar demo
          <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
