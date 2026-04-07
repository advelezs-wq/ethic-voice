"use client";

import { useEffect } from "react";
import { Header } from "./layout/Header";
import {
  MobileNavProvider,
  useMobileNavDrawer,
} from "./mobile-nav-context";
import { ClientLogos } from "./ClientLogos";
import { FAQSection } from "./FAQSection";
import { FooterCTA } from "./FooterCTA";
import { Hero } from "./Hero";
import { WhyEthicVoice } from "./WhyEthicVoice";
import { ServicesSection } from "./ServicesSection";
import { HowItWorks } from "./HowItWorks";
import { PlatformPreviewShowcaseSection } from "./PlatformPreview";
import { TrustSecuritySection } from "./TrustSecuritySection";
import { useIsClient } from "@/modules/app/hooks/useIsClient";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { StickyCalendlyToast } from "./StickyCalendlyToast";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";

function LandingContent() {
  const isClient = useIsClient();
  const { isOpen: mobileNavOpen } = useMobileNavDrawer();
  const cookie = useCookieConsentOptional();
  const allowFunctional =
    cookie?.hydrated && !!cookie.consent?.functional && !cookie.needsInteraction;

  useEffect(() => {
    if (!isClient) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-reveal");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -100px 0px" }
    );

    const timeoutId = setTimeout(() => {
      document.querySelectorAll("section").forEach((section) => {
        observer.observe(section);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.querySelectorAll("section").forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, [isClient]);

  return (
    <>
      <Header />

      {!mobileNavOpen && allowFunctional && (
        <FloatingWhatsApp
          phoneNumber={process.env.NEXT_PUBLIC_WPP_NUMBER || ""}
          accountName="Ethic Voice"
          avatar="/brand/wpp_logo.png"
          chatMessage={`Hola! 🤝 
¿Cómo puedo ayudarte?`}
        />
      )}

      {!mobileNavOpen && <StickyCalendlyToast />}

      <main className="w-full min-w-0 overflow-x-hidden pb-28 sm:pb-24">
        {/* 1. Hero — fondo verde oscuro */}
        <Hero />

        {/* 2. Logos de clientes */}
        <ClientLogos />

        {/* 3. ¿Por qué EthicVoice? — pain points */}
        <WhyEthicVoice />

        {/* 4. Nuestros servicios éticos */}
        <ServicesSection />

        {/* 5. Cómo funciona — 3 pasos */}
        <HowItWorks />

        {/* 6. Preview de plataforma (mock + islas flotantes) */}
        <PlatformPreviewShowcaseSection />

        {/* 7. Seguridad y confianza (sin certificaciones que no poseemos) */}
        <TrustSecuritySection />

        {/* 8. FAQ */}
        <FAQSection />

        {/* 9. CTA final + footer integrado */}
        <FooterCTA />
      </main>
    </>
  );
}

export const Landing = () => {
  return (
    <MobileNavProvider>
      <div className="relative min-h-screen bg-white">
        <LandingContent />
      </div>
    </MobileNavProvider>
  );
};
