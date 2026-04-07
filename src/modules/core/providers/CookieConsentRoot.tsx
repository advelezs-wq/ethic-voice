"use client";

import type { ReactNode } from "react";
import { CookieConsentProvider } from "@/modules/core/providers/CookieConsentContext";
import { ConsentGatedScripts } from "@/modules/core/components/ConsentGatedScripts";
import { CalendlyWidgetScript } from "@/modules/core/components/CalendlyWidgetScript";
import { CookieConsentBanner } from "@/modules/landig-page/components/cookie-consent/CookieConsentBanner";

export function CookieConsentRoot({ children }: { children: ReactNode }) {
  return (
    <CookieConsentProvider>
      <ConsentGatedScripts />
      <CalendlyWidgetScript />
      {children}
      <CookieConsentBanner />
    </CookieConsentProvider>
  );
}
