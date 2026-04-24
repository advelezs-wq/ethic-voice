"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@heroui/react";
import { useIsClient } from "@/modules/app/hooks/useIsClient";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { trackGA4Event } from "@/lib/google-analytics";

export function StickyCalendlyToast() {
  const isClient = useIsClient();
  const cookie = useCookieConsentOptional();
  const { openCalendly } = useCalendlyGate();

  const allow =
    cookie?.hydrated &&
    !!cookie.consent?.functional &&
    !cookie.needsInteraction;

  if (!allow) return null;

  return (
    <div
      className={cn(
        // Móvil: a la izquierda + margen para WhatsApp. Tablet/desktop: centrado; la pastilla sigue con max-w-3xl (no ancho completo).
        "pointer-events-none fixed inset-x-0 z-[96] flex justify-start sm:justify-center px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1.5 transition-[bottom] duration-300 max-sm:pr-[4.5rem] sm:px-6 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pt-2",
        cookie?.isPrimaryBannerVisible
          ? "bottom-[min(38vh,280px)] sm:bottom-[min(32vh,240px)]"
          : "bottom-0"
      )}
      role="region"
      aria-label="Llamada a la acción"
    >
      <div
        className="pointer-events-auto flex w-full max-w-[min(100%,28rem)] flex-col items-stretch gap-1.5 rounded-2xl border border-[#0a1f14]/12 bg-white/95 px-2.5 py-2 shadow-[0_6px_24px_rgba(0,0,0,0.14)] backdrop-blur-md ring-1 ring-lime-400/35 max-sm:max-w-[min(26rem,calc(100vw-0.5rem-4.5rem))] sm:w-auto sm:max-w-3xl sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:px-5 sm:py-2.5 sm:shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      >
        <p className="text-center text-[11px] font-medium leading-snug text-[#0a1f14] max-sm:px-0.5 sm:text-left sm:text-sm">
          ¿Quieres ver cómo funciona en tu equipo?
        </p>
        <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={openCalendly}
            disabled={!isClient}
            className="shrink-0 rounded-full bg-lime-400 px-3.5 py-2 text-center text-xs font-bold text-[#0a1f14] shadow-[0_0_16px_rgba(163,230,53,0.28)] transition hover:bg-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:opacity-60 sm:px-5 sm:py-2.5 sm:text-sm sm:shadow-[0_0_20px_rgba(163,230,53,0.35)]"
          >
            Agendar prueba gratis
          </button>
          <Link
            href="/submit"
            onClick={() =>
              trackGA4Event("landing_cta_click", {
                cta_name: "sticky_report",
                placement: "sticky_cta",
              })
            }
            className="shrink-0 text-center text-[10px] font-semibold text-[#051a24] underline underline-offset-2 hover:text-[#0a3d52] sm:text-sm"
          >
            Denunciar
          </Link>
        </div>
      </div>
    </div>
  );
}
