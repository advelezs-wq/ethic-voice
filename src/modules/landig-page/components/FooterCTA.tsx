"use client";

import React from "react";
import Link from "next/link";
import { useIsClient } from "@/modules/app/hooks/useIsClient";

declare global {
  interface Window {
    Calendly?: { initPopupWidget: (options: { url: string }) => void };
  }
}

const NAV_LINKS = [
  { label: "Servicios", href: "/servicios" },
  { label: "Empresa", href: "/empresa" },
  { label: "Soporte", href: "/soporte" },
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
];

export const FooterCTA = () => {
  const isClient = useIsClient();
  const calendlyUrl =
    "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1";

  const openCalendly = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isClient && window.Calendly) {
      window.Calendly.initPopupWidget({ url: calendlyUrl });
    } else {
      window.open(calendlyUrl, "_blank");
    }
  };

  return (
    <footer className="bg-green-900 relative overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-10">
        <svg viewBox="0 0 800 300" fill="none" className="absolute bottom-0 w-full">
          <path d="M-100 200 Q200 100 400 200 T900 200" stroke="white" strokeWidth="1" fill="none" />
          <path d="M-100 240 Q200 140 400 240 T900 240" stroke="white" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* CTA Content */}
      <div className="relative px-4 pb-8 pt-10 sm:px-6 sm:pt-12 md:px-8 md:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-2 text-2xl font-extrabold leading-tight text-green-300 sm:mb-3 sm:text-3xl md:text-4xl">
            Agenda tu demo personalizada
          </h2>
          <p className="mb-6 text-sm text-white/75 sm:mb-8 sm:text-base">
            Descubre cómo EthicVoice protege tu empresa.
          </p>
          <button
            onClick={openCalendly}
            className="inline-flex items-center gap-2 rounded-full bg-green-400 px-6 py-2.5 text-sm font-bold text-green-950 shadow-lg transition-colors hover:bg-green-300 sm:px-8 sm:py-3 sm:text-base"
          >
            Agendar ahora
            <i className="icon-[lucide--arrow-right] w-4 h-4" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="mt-8 border-t border-white/10 pt-6 sm:mt-12">
          <nav className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-center text-xs text-white/30">
            Copyright © {new Date().getFullYear()} EthicVoice
          </p>
        </div>
      </div>
    </footer>
  );
};
