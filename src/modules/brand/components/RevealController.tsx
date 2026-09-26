"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal],[data-reveal-lines],[data-inview]";

/**
 * Un único IntersectionObserver para todo el sitio: marca con `.is-in` los
 * elementos con `data-reveal`, `data-reveal-lines` o `data-inview` cuando
 * entran en pantalla. Las transiciones viven en CSS (brand.css), así corren
 * fuera del hilo principal y no dependen de framer-motion.
 */
export function RevealController() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("ev-js");

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const observeAll = () => {
      document
        .querySelectorAll(`:is(${SELECTOR}):not(.is-in)`)
        .forEach((el) => io.observe(el));
    };
    observeAll();

    // Contenido montado después (acordeones, rutas cliente) también se observa.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
