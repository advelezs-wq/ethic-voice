"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { SectionReveal } from "@/modules/landig-page/components/motion/SectionReveal";
import { SectionEyebrow } from "@/modules/landig-page/components/decor";

/** Marcas reales del sitio (misma fuente que la landing anterior) */
const BRANDS = [
  { name: "LaBrutal", src: "/ethic-brands/la_brutal.png" },
  { name: "Progress Consulting Group", src: "/ethic-brands/progress.png" },
  { name: "Valor Estratégico", src: "/ethic-brands/valor_estrategico.webp" },
  { name: "Norvik Tech", src: "/ethic-brands/norvik_logo.webp" },
  { name: "Universal Emerald", src: "/ethic-brands/universal_emerald.png" },
] as const;

const SCROLL_STEP = 200;
const AUTOPLAY_MS = 3500;

export const ClientLogos = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverPausedRef = useRef(false);

  const scroll = useCallback((dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "right" ? SCROLL_STEP : -SCROLL_STEP,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const tick = () => {
      if (document.hidden || hoverPausedRef.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 4) return;

      if (el.scrollLeft >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: "auto" });
      } else {
        el.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });
      }
    };

    const id = window.setInterval(tick, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="bg-white px-4 pt-8 pb-14 sm:px-6 sm:pt-10 sm:pb-16 md:pt-12 lg:px-8 lg:pb-20">
      <div className="mx-auto w-full max-w-4xl">
        <SectionReveal className="mb-6 flex flex-col items-center gap-3 text-center sm:mb-8">
          <SectionEyebrow>Clientes</SectionEyebrow>
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-[#0a1e14] sm:text-3xl">
            Confían en nosotros
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.07} y={10}>
          <div
            className="flex min-w-0 items-center gap-2 sm:gap-3"
            onMouseEnter={() => {
              hoverPausedRef.current = true;
            }}
            onMouseLeave={() => {
              hoverPausedRef.current = false;
            }}
          >
            <button
              type="button"
              onClick={() => scroll("left")}
              className="hidden flex-shrink-0 w-8 h-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 sm:flex"
              aria-label="Anterior"
            >
              <i className="icon-[lucide--chevron-left] w-4 h-4" />
            </button>

            <div className="relative min-w-0 flex-1">
              <div
                ref={scrollRef}
                className="flex items-center gap-10 overflow-x-auto scroll-px-4 snap-x snap-mandatory py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-10 md:gap-12"
              >
                {BRANDS.map((brand) => (
                  <div
                    key={brand.name}
                    className="flex h-14 w-28 flex-shrink-0 snap-start items-center justify-center opacity-60 grayscale transition-opacity hover:opacity-90 sm:h-14 sm:w-36 sm:opacity-45 md:w-40"
                    title={brand.name}
                  >
                    <Image
                      src={brand.src}
                      alt={brand.name}
                      width={160}
                      height={48}
                      className="max-h-11 w-auto max-w-full object-contain object-center sm:max-h-12"
                      sizes="(max-width: 768px) 120px, 160px"
                    />
                  </div>
                ))}
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent sm:hidden"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent sm:hidden"
                aria-hidden
              />
            </div>

            <button
              type="button"
              onClick={() => scroll("right")}
              className="hidden flex-shrink-0 w-8 h-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 sm:flex"
              aria-label="Siguiente"
            >
              <i className="icon-[lucide--chevron-right] w-4 h-4" />
            </button>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
};
