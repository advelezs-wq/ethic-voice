"use client";

import { useCallback } from "react";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { trackGA4Event } from "@/lib/google-analytics";

/**
 * CTA principal del sitio: abre Calendly (respetando el consentimiento de
 * cookies) y registra `landing_cta_click` con el nombre y la ubicación.
 */
export function useDemoCta() {
  const { openCalendly } = useCalendlyGate();

  return useCallback(
    (ctaName: string, placement: string) =>
      (e?: { preventDefault?: () => void }) => {
        trackGA4Event("landing_cta_click", { cta_name: ctaName, placement });
        openCalendly(e);
      },
    [openCalendly],
  );
}

export function trackCta(ctaName: string, placement: string) {
  trackGA4Event("landing_cta_click", { cta_name: ctaName, placement });
}
