"use client";

import { useEffect, useRef } from "react";
import { Container, Eyebrow, reveal } from "@/modules/brand/components/primitives";
import { FACTS, MANIFESTO } from "./content";

/**
 * Texto que se "enciende" palabra por palabra al avanzar el scroll.
 * Actualiza el estilo directamente (sin re-render) dentro de un rAF.
 */
function ScrollLitText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>("span[data-w]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      spans.forEach((s) => (s.style.opacity = "1"));
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 cuando el párrafo asoma por abajo, 1 cuando su final pasa el 40% superior.
      const progress = Math.min(
        1,
        Math.max(0, (vh * 0.85 - rect.top) / (rect.height + vh * 0.45)),
      );
      const lit = progress * spans.length;
      spans.forEach((s, i) => {
        const o = Math.min(1, Math.max(0, lit - i));
        s.style.opacity = String(0.14 + o * 0.86);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <p
      ref={ref}
      className="text-[clamp(1.75rem,3.9vw,3.5rem)] font-medium leading-[1.12] tracking-[-0.04em] text-ev-night"
    >
      {words.map((w, i) => (
        <span key={i} data-w style={{ opacity: 0.14 }} className="transition-opacity duration-150">
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

export function Manifesto() {
  return (
    <section className="relative bg-ev-paper py-28 sm:py-36 lg:py-40">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="01">El costo de no actuar</Eyebrow>
          </div>
          <div className="lg:col-span-9">
            <ScrollLitText text={MANIFESTO} />
          </div>
        </div>

        {/* Cifras monumentales sobre reglas finas */}
        <dl className="mt-24 grid border-t border-ev-night sm:grid-cols-3 lg:mt-36">
          {FACTS.map((f, i) => (
            <div
              key={f.value}
              {...reveal(i * 120)}
              className="flex flex-col-reverse border-b border-ev-line py-8 sm:border-b-0 sm:py-10 sm:pr-8 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:pl-8"
            >
              <dt className="mt-5 max-w-[16rem] text-[0.975rem] leading-relaxed text-ev-mute">
                {f.label}
              </dt>
              <dd className="ev-num text-[clamp(4.5rem,9vw,8.5rem)] font-semibold leading-[0.85] tracking-[-0.06em] text-ev-night">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="ev-label mt-6 text-ev-haze">
          Fuente: ACFE, Report to the Nations.
        </p>
      </Container>
    </section>
  );
}
