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
        "pointer-events-none fixed inset-x-0 z-[95] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 transition-[bottom] duration-300",
        cookie?.isPrimaryBannerVisible
          ? "bottom-[min(38vh,280px)] sm:bottom-[min(32vh,240px)]"
          : "bottom-0"
      )}
      role="region"
      aria-label="Llamada a la acción"
    >
      <div
        className="pointer-events-auto flex max-w-[min(100%,28rem)] flex-col items-stretch gap-2 rounded-2xl border border-[#0a1f14]/12 bg-white/95 px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md ring-1 ring-lime-400/35 sm:max-w-none sm:flex-row sm:items-center sm:gap-4 sm:rounded-full sm:px-5 sm:py-2"
      >
        <p className="text-center text-xs font-medium leading-snug text-[#0a1f14] sm:text-left sm:text-sm">
          ¿Quieres ver cómo funciona en tu equipo?
        </p>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={openCalendly}
            disabled={!isClient}
            className="shrink-0 rounded-full bg-lime-400 px-5 py-2.5 text-center text-sm font-bold text-[#0a1f14] shadow-[0_0_20px_rgba(163,230,53,0.35)] transition hover:bg-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:opacity-60"
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
            className="shrink-0 text-center text-xs font-semibold text-[#051a24] underline underline-offset-2 hover:text-[#0a3d52] sm:text-sm"
          >
            Denunciar
          </Link>
        </div>
      </div>
    </div>
  );
}
