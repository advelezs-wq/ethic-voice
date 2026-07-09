"use client";

import { useCallback } from "react";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import { ETHICVOICE_CALENDLY_URL } from "./calendly-url";

declare global {
  interface Window {
    Calendly?: { initPopupWidget: (options: { url: string }) => void };
  }
}

/**
 * Calendly es un servicio de terceros: solo con cookies funcionales aceptadas.
 */
export function useCalendlyGate() {
  const ctx = useCookieConsentOptional();
  const allowed = !!ctx?.consent?.functional;

  const openCalendly = useCallback(
    (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.();
      if (!ctx) return;
      if (!allowed) {
        ctx.openCookieSettings();
        return;
      }
      if (typeof window === "undefined") return;
      if (window.Calendly) {
        try {
          window.Calendly.initPopupWidget({ url: ETHICVOICE_CALENDLY_URL });
          // Si el widget no logra montar su iframe (script/CSS bloqueados),
          // el overlay queda "pensando": verificamos y abrimos en pestaña nueva.
          window.setTimeout(() => {
            const overlayLoaded = document.querySelector(
              ".calendly-overlay iframe"
            );
            if (!overlayLoaded) {
              document.querySelector(".calendly-overlay")?.remove();
              window.open(
                ETHICVOICE_CALENDLY_URL,
                "_blank",
                "noopener,noreferrer"
              );
            }
          }, 2000);
        } catch {
          window.open(ETHICVOICE_CALENDLY_URL, "_blank", "noopener,noreferrer");
        }
      } else {
        window.open(ETHICVOICE_CALENDLY_URL, "_blank", "noopener,noreferrer");
      }
    },
    [allowed, ctx]
  );

  return { openCalendly, calendlyAllowed: allowed };
}
