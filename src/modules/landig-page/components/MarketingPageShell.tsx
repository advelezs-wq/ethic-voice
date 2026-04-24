"use client";

import { cn } from "@heroui/react";
import { Header } from "@/modules/landig-page/components/layout/Header";
import { FooterCTA } from "@/modules/landig-page/components/FooterCTA";
import {
  MobileNavProvider,
  useMobileNavDrawer,
} from "@/modules/landig-page/components/mobile-nav-context";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import type { ReactNode } from "react";
import { StickyCalendlyToast } from "@/modules/landig-page/components/StickyCalendlyToast";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";

type MarketingPageShellProps = {
  children: ReactNode;
  /** Por defecto igual que la home (CTA verde + enlaces). */
  showFooter?: boolean;
  showWhatsApp?: boolean;
  /** Barra fija inferior con CTA a Calendly (páginas públicas). */
  showStickyCta?: boolean;
  /** Se fusiona con las clases base del <main> (p. ej. `!pt-16` en auth). */
  mainClassName?: string;
};

function ShellInner({
  children,
  showFooter,
  showWhatsApp,
  showStickyCta,
  mainClassName,
}: MarketingPageShellProps) {
  const { isOpen } = useMobileNavDrawer();
  const phone = process.env.NEXT_PUBLIC_WPP_NUMBER || "";
  const cookie = useCookieConsentOptional();
  const allowFunctional =
    cookie?.hydrated && !!cookie.consent?.functional && !cookie.needsInteraction;

  return (
    <div className="relative min-h-screen bg-white">
      <Header />
      {showWhatsApp && phone && !isOpen && allowFunctional && (
        <FloatingWhatsApp
          phoneNumber={phone}
          accountName="Ethic Voice"
          avatar="/brand/wpp_logo.png"
          chatMessage={`Hola! 🤝 
¿Cómo puedo ayudarte?`}
          className="floating-whatsapp ev-floating-whatsapp"
        />
      )}
      {showStickyCta !== false && !isOpen && <StickyCalendlyToast />}
      <main
        className={cn(
          "w-full min-w-0 overflow-x-hidden pt-20",
          mainClassName,
          showStickyCta !== false && "!pb-28"
        )}
      >
        {children}
      </main>
      {showFooter !== false && <FooterCTA />}
    </div>
  );
}

export function MarketingPageShell({
  children,
  showFooter = true,
  showWhatsApp = true,
  showStickyCta = true,
  mainClassName,
}: MarketingPageShellProps) {
  return (
    <MobileNavProvider>
      <ShellInner
        showFooter={showFooter}
        showWhatsApp={showWhatsApp}
        showStickyCta={showStickyCta}
        mainClassName={mainClassName}
      >
        {children}
      </ShellInner>
    </MobileNavProvider>
  );
}
