"use client";

import type { ReactNode } from "react";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { StickyDemoBar } from "./StickyDemoBar";
import { ClosingCta } from "./ClosingCta";
import { RevealController } from "./RevealController";

type SiteShellProps = {
  children: ReactNode;
  /** Bloque lima de cierre antes del footer (páginas de venta). */
  closingCta?: boolean;
  /** Barra flotante "Agendar demo" (no en flujos de denunciante). */
  stickyCta?: boolean;
  whatsApp?: boolean;
  /** Oculta la franja superior "¿Vienes a reportar?" (p. ej. en /submit). */
  hideUtility?: boolean;
  footer?: boolean;
  mainClassName?: string;
};

/**
 * Cromo único del sitio público: nav, footer, CTA persistente y WhatsApp.
 * Reemplaza a MarketingPageShell y LandingSiteChrome (que ahora delegan aquí).
 */
export function SiteShell({
  children,
  closingCta = true,
  stickyCta = true,
  whatsApp = true,
  hideUtility = false,
  footer = true,
  mainClassName = "",
}: SiteShellProps) {
  const phone = process.env.NEXT_PUBLIC_WPP_NUMBER || "";
  const cookie = useCookieConsentOptional();
  const allowFunctional =
    cookie?.hydrated && !!cookie.consent?.functional && !cookie.needsInteraction;

  return (
    <div className="ev-site min-h-screen">
      <RevealController />
      <SiteNav hideUtility={hideUtility} />
      {whatsApp && phone && allowFunctional ? (
        <FloatingWhatsApp
          phoneNumber={phone}
          accountName="EthicVoice"
          avatar="/brand/wpp_logo.png"
          chatMessage="Hola, ¿en qué podemos ayudarte con tu canal de denuncias?"
          className="floating-whatsapp ev-floating-whatsapp"
        />
      ) : null}
      {stickyCta ? <StickyDemoBar /> : null}
      <main className={`w-full min-w-0 overflow-x-clip ${mainClassName}`}>
        {children}
      </main>
      {closingCta ? <ClosingCta /> : null}
      {footer ? <SiteFooter /> : null}
    </div>
  );
}
