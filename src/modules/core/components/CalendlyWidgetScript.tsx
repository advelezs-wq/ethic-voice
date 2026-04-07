"use client";

import Script from "next/script";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";

/**
 * Un único punto de carga del widget Calendly cuando hay consentimiento funcional.
 */
export function CalendlyWidgetScript() {
  const ctx = useCookieConsentOptional();
  if (!ctx?.consent?.functional) return null;

  return (
    <Script
      src="https://assets.calendly.com/assets/external/widget.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof document === "undefined") return;
        const href = "https://assets.calendly.com/assets/external/widget.css";
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }}
    />
  );
}
