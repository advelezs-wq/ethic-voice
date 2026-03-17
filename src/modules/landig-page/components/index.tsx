"use client";

import { useEffect } from "react";
import { Footer } from "./layout/Footer";
import { Header } from "./layout/Header";
import { ClientLogos } from "./ClientLogos";
import { ReportChannelsSection } from "./ReportChannelsSection";
import { PlatformPreviewSection } from "./PlatformPreview";
import { FAQSection } from "./FAQSection";
import { FooterCTA } from "./FooterCTA";
import { Hero } from "./Hero";
import Script from "next/script";
import { useIsClient } from "@/modules/app/hooks/useIsClient";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { BackgroundCurves } from "./layout/BackgroundCurves";

export const Landing = () => {
  const isClient = useIsClient();

  useEffect(() => {
    // Only run DOM manipulation after client-side hydration is complete
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

    // Use a small timeout to ensure DOM is fully ready
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
    <div className="min-h-screen bg-white bg-curves relative">
      <div className="absolute inset-0 -z-[1]">
        <BackgroundCurves />
      </div>
      {/* Calendly Widget Script - Load after interactive */}
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Add Calendly CSS only after script loads
          if (typeof document !== "undefined") {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href =
              "https://assets.calendly.com/assets/external/widget.css";
            document.head.appendChild(link);
          }
        }}
      />
      <Header />
      <FloatingWhatsApp
        phoneNumber={process.env.NEXT_PUBLIC_WPP_NUMBER || ""}
        accountName="Ethic Voice"
        avatar="/brand/wpp_logo.png"
        chatMessage="Hola! 🤝 
Cómo puedo ayudarte?"
      />
      <main className="pt-20">
        <Hero />
        <ClientLogos />
        <ReportChannelsSection />
        <PlatformPreviewSection />
        <FAQSection />
        <FooterCTA />
      </main>
      <Footer />
    </div>
  );
};
