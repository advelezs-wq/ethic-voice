"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import { Button } from "./primitives";
import { trackCta, useDemoCta } from "../hooks/useDemoCta";

/**
 * Barra de conversión persistente. Aparece cuando el hero ya salió de
 * pantalla y se retira sola cuando hay otro CTA grande visible
 * (`data-hide-sticky`), para no competir con él.
 */
export function StickyDemoBar() {
  const cookie = useCookieConsentOptional();
  const demo = useDemoCta();
  const [pastHero, setPastHero] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll("[data-hide-sticky]");
    if (!targets.length) return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setCtaVisible(visible.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const bannerOpen = !!cookie?.isPrimaryBannerVisible;
  const show = pastHero && !ctaVisible && !bannerOpen;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-start px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-500 ease-ev-out max-sm:pr-[5rem] sm:justify-center ${
        show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      aria-hidden={!show}
    >
      <div
        className={`flex items-center gap-3 rounded-full border border-white/10 bg-ev-night/90 py-1.5 pl-4 pr-1.5 text-white shadow-[0_18px_50px_-12px_rgba(11,29,33,0.55)] backdrop-blur-xl sm:gap-5 sm:pl-6 ${
          show ? "pointer-events-auto" : ""
        }`}
      >
        <p className="hidden text-[0.9375rem] tracking-[-0.01em] text-white/80 md:block">
          Ve la plataforma con casos de tu industria
        </p>
        <Link
          href="/submit"
          onClick={() => trackCta("sticky_report", "sticky_cta")}
          tabIndex={show ? 0 : -1}
          className="text-sm text-white/60 underline decoration-white/25 underline-offset-4 hover:text-white md:hidden"
        >
          Denunciar
        </Link>
        <Button
          variant="signal"
          arrow
          tabIndex={show ? 0 : -1}
          onClick={demo("sticky_demo", "sticky_cta")}
          className="h-10 px-4 text-sm"
        >
          Agendar demo
        </Button>
      </div>
    </div>
  );
}
