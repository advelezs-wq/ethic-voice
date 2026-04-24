"use client";

import type { ReactNode } from "react";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { StickyCalendlyToast } from "@/modules/landig-page/components/StickyCalendlyToast";
import { LandingNav } from "@/modules/landig-page/components/LandingNavBar";
import { LandingMinimalFooter } from "@/modules/landig-page/components/LandingMinimalFooter";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";

type Props = {
  children: ReactNode;
};

/** Mismo cromo que la home V2: nav fija, CTA Calendly, WhatsApp y footer compacto. */
export function LandingSiteChrome({ children }: Props) {
  const phone = process.env.NEXT_PUBLIC_WPP_NUMBER || "";
  const cookie = useCookieConsentOptional();
  const allowFunctional =
    cookie?.hydrated &&
    !!cookie.consent?.functional &&
    !cookie.needsInteraction;

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      {phone && allowFunctional && (
        <FloatingWhatsApp
          phoneNumber={phone}
          accountName="Ethic Voice"
          avatar="/brand/wpp_logo.png"
          chatMessage={"Hola! ¿Cómo puedo ayudarte con tu canal de denuncias?"}
        />
      )}
      <StickyCalendlyToast />
      <main className="w-full min-w-0 overflow-x-hidden pb-28 pt-20 sm:pb-24 sm:pt-24">
        {children}
      </main>
      <LandingMinimalFooter />
    </div>
  );
}
