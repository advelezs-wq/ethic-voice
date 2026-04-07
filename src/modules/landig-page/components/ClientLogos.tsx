"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Image from "next/image";

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
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-10 md:py-12 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="mb-4 text-center text-lg font-bold text-gray-900 sm:mb-6 sm:text-xl md:text-2xl">
          Confían en nosotros
        </h2>

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
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Anterior"
          >
            <i className="icon-[lucide--chevron-left] w-4 h-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex-1 min-w-0 overflow-x-auto flex items-center gap-8 md:gap-10 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {BRANDS.map((brand) => (
              <div
                key={brand.name}
                className="flex-shrink-0 snap-start flex items-center justify-center h-12 w-[7.5rem] sm:h-14 sm:w-36 md:w-40 opacity-45 hover:opacity-75 transition-opacity grayscale"
                title={brand.name}
              >
                <Image
                  src={brand.src}
                  alt={brand.name}
                  width={160}
                  height={48}
                  className="max-h-10 sm:max-h-12 w-auto max-w-full object-contain object-center"
                  sizes="(max-width: 768px) 120px, 160px"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll("right")}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Siguiente"
          >
            <i className="icon-[lucide--chevron-right] w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
