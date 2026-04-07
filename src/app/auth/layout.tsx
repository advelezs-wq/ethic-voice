import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { Metadata } from "next";
import Link from "next/link";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Acceso | EthicVoice",
  description: "Inicia sesión o crea tu cuenta en EthicVoice.",
};

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <MarketingPageShell
      showFooter={false}
      showWhatsApp={false}
      mainClassName="relative flex min-h-[100dvh] flex-col overflow-x-hidden !bg-gradient-to-b from-[#f5f3ee] via-white to-[#ecf2ea] !pt-16"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-5%,rgba(20,83,45,0.08)_0%,transparent_55%)]" />
        <div className="absolute -right-28 top-16 h-[22rem] w-[22rem] rounded-full bg-lime-400/12 blur-3xl md:top-24" />
        <div className="absolute -left-24 bottom-24 h-72 w-72 rounded-full bg-[#0a1f14]/[0.07] blur-3xl" />
        <svg
          className="absolute bottom-[12%] right-[8%] h-32 w-48 opacity-[0.12] text-[#14532d] md:h-40 md:w-56"
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 100 Q50 40 100 70 T200 50"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M20 110 Q80 60 140 90 T200 70"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto flex w-full max-w-6xl flex-1 animate-slide-up flex-col px-4 py-8 md:px-8 md:py-12 lg:px-12">
        <Link
          href="/"
          className="group -mb-6 flex w-fit items-center gap-2 text-sm font-medium text-[#0a1f14]/80 transition-colors hover:text-[#0a1f14] md:-mb-10"
        >
          <i
            className="icon-[bx--left-arrow-alt] size-4 text-lime-600 transition-transform group-hover:-translate-x-1"
            role="img"
            aria-hidden="true"
          />
          Volver al inicio
        </Link>
        <div className="animate-fade-up mx-auto my-auto flex w-full max-w-[min(100%,440px)] flex-col items-center justify-center sm:max-w-none">
          {children}
        </div>
      </div>
    </MarketingPageShell>
  );
};

export default AuthLayout;
