import { AuthPageChrome } from "@/modules/landig-page/components/AuthPageChrome";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Acceso | EthicVoice",
  description: "Inicia sesión o crea tu cuenta en EthicVoice.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthPageChrome>
      <div className="relative min-h-[100dvh] overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#f7faf9]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_48%_at_50%_-8%,rgba(94,210,156,0.14)_0%,transparent_55%)]" />
          <div className="absolute -right-28 top-20 h-[22rem] w-[22rem] rounded-full bg-lime-400/14 blur-3xl md:top-28" />
          <div className="absolute -left-24 bottom-20 h-72 w-72 rounded-full bg-[#0d212c]/[0.07] blur-3xl" />
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            {[25, 50, 75].map((left) => (
              <div
                key={left}
                className="absolute bottom-0 top-0 w-px bg-black/[0.07]"
                style={{ left: `${left}%`, transform: "translateX(-50%)" }}
              />
            ))}
          </div>
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
              opacity="0.55"
            />
          </svg>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-[4.5rem]">
          <Link
            href="/"
            className="group mb-6 flex w-fit items-center gap-2 text-sm font-medium text-[#273c46] transition-colors hover:text-[#0d212c] sm:mb-8"
          >
            <i
              className="icon-[lucide--arrow-left] h-4 w-4 text-lime-600 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            Volver al inicio
          </Link>

          <div className="flex flex-1 flex-col items-center justify-center py-4 sm:py-8">
            {children}
          </div>
        </div>
      </div>
    </AuthPageChrome>
  );
}
