"use client";

import { Container, Eyebrow, RevealHeading, Voice } from "@/modules/brand/components/primitives";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import { FAQS } from "./content";

/**
 * Acordeón nativo (<details>) — accesible y sin JS. La altura se anima con
 * `interpolate-size` donde el navegador lo soporta; en el resto abre sin
 * transición, que también es correcto.
 */
export function Faq({
  items = FAQS,
  index = "09",
}: {
  items?: ReadonlyArray<{ q: string; a: string }>;
  index?: string;
}) {
  const demo = useDemoCta();

  return (
    <section id="faq" className="relative scroll-mt-20 bg-white py-28 sm:py-36">
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Eyebrow index={index}>Preguntas frecuentes</Eyebrow>
              <RevealHeading
                className="ev-h2 mt-6 text-ev-night"
                lines={["Lo que suelen", <>preguntarnos.</>]}
              />
              <p className="mt-8 max-w-xs text-[0.975rem] leading-relaxed text-ev-mute">
                ¿Tu pregunta no está aquí?{" "}
                <button
                  type="button"
                  onClick={demo("faq_demo", "faq")}
                  className="text-ev-night underline decoration-ev-signal decoration-2 underline-offset-4 hover:decoration-ev-night"
                >
                  <Voice className="text-[1.1em]">Hablemos</Voice> 30 minutos.
                </button>
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            {items.map((item, i) => (
              <details
                key={item.q}
                className="ev-faq group border-t border-ev-line last:border-b"
                name="faq"
              >
                <summary className="flex cursor-pointer list-none items-start gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                  <span className="ev-label mt-2 w-6 shrink-0 text-ev-haze">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-[1.1875rem] font-medium leading-snug tracking-[-0.02em] text-ev-night sm:text-[1.3125rem]">
                    {item.q}
                  </span>
                  <span
                    className="relative mt-1.5 h-5 w-5 shrink-0 transition-transform duration-300 ease-ev-out group-open:rotate-45"
                    aria-hidden
                  >
                    <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-ev-night" />
                    <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-ev-night" />
                  </span>
                </summary>
                <div className="ev-faq-body">
                  <p className="max-w-xl pb-7 pl-12 text-[1rem] leading-relaxed text-ev-mute">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
