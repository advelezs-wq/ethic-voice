"use client";

import Image from "next/image";
import { ButtonLink, Container, Eyebrow, Voice, reveal } from "@/modules/brand/components/primitives";
import { trackCta } from "@/modules/brand/hooks/useDemoCta";

/** Captura de lead para quien aún no está listo para una demo. */
export function GuideBand() {
  return (
    <section className="relative overflow-hidden bg-ev-bone py-24 sm:py-32">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <Eyebrow index="10">Recurso gratuito</Eyebrow>
            <h2 {...reveal(0)} className="ev-h2 mt-6 text-ev-night">
              ¿Aún no es momento de una demo? Empieza por la <Voice>guía.</Voice>
            </h2>
            <p {...reveal(100)} className="ev-lead mt-6 max-w-lg">
              Una ruta práctica para diseñar e implementar un canal de denuncias
              que las personas realmente quieran usar. Con el marco legal de
              Latinoamérica.
            </p>
            <dl {...reveal(180)} className="mt-10 grid max-w-md grid-cols-3 border-t border-ev-night/15 pt-5">
              {[
                { v: "18", l: "Páginas" },
                { v: "03", l: "Herramientas" },
                { v: "PDF", l: "Inmediato" },
              ].map((m) => (
                <div key={m.l} className="flex flex-col-reverse">
                  <dt className="ev-label mt-2 text-ev-mute">{m.l}</dt>
                  <dd className="ev-num text-3xl font-semibold text-ev-night">{m.v}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink
              href="/guia-canal-denuncias"
              variant="ink"
              size="lg"
              arrow
              className="mt-10"
              onClick={() => trackCta("lead_magnet_guide", "lead_magnet")}
            >
              Descargar la guía gratis
            </ButtonLink>
          </div>

          <div className="relative lg:col-span-5 lg:col-start-8" {...reveal(150)}>
            <div className="mx-auto w-[min(100%,22rem)] [perspective:1400px]">
              <div className="relative aspect-[3/4] rounded-r-xl rounded-l-sm shadow-[30px_40px_80px_-30px_rgba(11,29,33,0.55)] transition-transform duration-700 ease-ev-out [transform:rotateY(-18deg)_rotateX(4deg)] hover:[transform:rotateY(-6deg)_rotateX(2deg)]">
                <Image
                  src="/ebook/guia-portada.jpg"
                  alt="Portada de la guía para implementar un canal de denuncias"
                  fill
                  sizes="352px"
                  className="rounded-r-xl rounded-l-sm object-cover"
                />
                <span className="absolute inset-y-0 left-0 w-3 rounded-l-sm bg-gradient-to-r from-black/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
