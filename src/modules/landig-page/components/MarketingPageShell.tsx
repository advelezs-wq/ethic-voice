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

type MarketingPageShellProps = {
  children: ReactNode;
  /** Por defecto igual que la home (CTA verde + enlaces). */
  showFooter?: boolean;
  showWhatsApp?: boolean;
  /** Se fusiona con las clases base del <main> (p. ej. `!pt-16` en auth). */
  mainClassName?: string;
};

function ShellInner({
  children,
  showFooter,
  showWhatsApp,
  mainClassName,
}: MarketingPageShellProps) {
  const { isOpen } = useMobileNavDrawer();
  const phone = process.env.NEXT_PUBLIC_WPP_NUMBER || "";

  return (
    <div className="relative min-h-screen bg-white">
      <Header />
      {showWhatsApp && phone && !isOpen && (
        <FloatingWhatsApp
          phoneNumber={phone}
          accountName="Ethic Voice"
          avatar="/brand/wpp_logo.png"
          chatMessage={`Hola! 🤝 
¿Cómo puedo ayudarte?`}
        />
      )}
      <main
        className={cn(
          "w-full min-w-0 overflow-x-hidden pt-20",
          mainClassName
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
  mainClassName,
}: MarketingPageShellProps) {
  return (
    <MobileNavProvider>
      <ShellInner
        showFooter={showFooter}
        showWhatsApp={showWhatsApp}
        mainClassName={mainClassName}
      >
        {children}
      </ShellInner>
    </MobileNavProvider>
  );
}
