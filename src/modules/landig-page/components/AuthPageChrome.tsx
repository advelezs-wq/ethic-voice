"use client";

import type { ReactNode } from "react";
import { LandingNav } from "@/modules/landig-page/components/LandingNavBar";

/** Auth público: misma barra que la home V2, sin WhatsApp ni CTA sticky ni footer. */
export function AuthPageChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white">
      <LandingNav />
      {children}
    </div>
  );
}
