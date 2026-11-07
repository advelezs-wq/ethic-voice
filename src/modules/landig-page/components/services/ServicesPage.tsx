"use client";

import Link from "next/link";
import React from "react";
import {
  Arrow,
  Button,
  Container,
  Eyebrow,
  Voice,
  buttonClasses,
  reveal,
} from "@/modules/brand/components/primitives";
import { PageHero } from "@/modules/brand/components/sections";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import {
  SERVICES,
  SERVICE_CONDITIONS,
  serviceInfoMailto,
  type Service,
} from "@/modules/landig-page/services/services.data";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Portafolio de servicios: el servicio destacado (gestión tercerizada) en un
 * bloque propio y los 12 servicios como tarjetas, cada una con su detalle.
 */
export const ServicesPage: React.FC = () => {
  const demo = useDemoCta();
  const featured = SERVICES.find((s) => s.featured);

  return (
    <>
      <PageHero
        kicker="Servicios"
        title={[
          "Expertos en ética y",
          <>
            cumplimiento, <Voice>a tu lado.</Voice>
          </>,
        ]}
        lead="Soluciones tecnológicas y servicios especializados para recibir y gestionar denuncias, investigar posibles irregularidades y fortalecer la cultura ética de las organizaciones."
        actions={
          <>
            <Button variant="signal" size="lg" arrow onClick={demo("services_hero", "services")}>
              Agendar demo
            </Button>
            <a href="#portafolio" className={buttonClasses("outline", "lg")}>
              Ver los 12 servicios
            </a>
          </>
        }
      />

      {featured ? <FeaturedService service={featured} /> : null}

      <section id="portafolio" className="scroll-mt-20 bg-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Eyebrow index="02">Portafolio</Eyebrow>
            </div>
            <div className="lg:col-span-9">
              <h2 className="ev-h2">
                12 servicios, <Voice>un mismo equipo.</Voice>
              </h2>
              <p className="ev-lead mt-6 max-w-2xl">
                Contrata la plataforma, los servicios o ambos. Toca una tarjeta para ver
                la descripción, el alcance y cómo se contrata.
              </p>
            </div>
          </div>

          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <li key={s.slug} {...reveal((i % 3) * 70)}>
                <ServiceCard service={s} />
              </li>
            ))}
          </ul>

          <p className="mt-12 max-w-3xl border-t border-ev-line pt-6 text-[0.9375rem] leading-relaxed text-ev-mute">
            <span className="font-medium text-ev-night">Condiciones de prestación.</span>{" "}
            {SERVICE_CONDITIONS}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button variant="ink" size="lg" arrow onClick={demo("services_bottom", "services")}>
              Agendar demo
            </Button>
            <a href={serviceInfoMailto()} className={buttonClasses("outline", "lg")}>
              Solicitar información
            </a>
          </div>
        </Container>
      </section>
    </>
  );
};

function ServiceCard({ service: s }: { service: Service }) {
  return (
    <Link
      href={`/services/${s.slug}`}
      className={`group/btn flex h-full flex-col rounded-2xl border p-6 transition-colors sm:p-7 ${
        s.featured
          ? "border-ev-night bg-ev-night text-white hover:bg-ev-slate"
          : "border-ev-line bg-ev-paper text-ev-night hover:border-ev-night/40 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`ev-label ${s.featured ? "text-ev-signal" : "text-ev-moss"}`}>
          {pad(s.number)}
        </span>
        {s.featured ? (
          <span className="ev-label -my-1 rounded-full bg-ev-signal px-2.5 py-1 text-ev-night">
            Destacado
          </span>
        ) : null}
      </div>
      <h3 className="mt-6 text-[1.3125rem] font-medium leading-snug tracking-[-0.025em]">
        {s.title}
      </h3>
      <p
        className={`mt-3 flex-1 text-[0.95rem] leading-relaxed ${
          s.featured ? "text-white/70" : "text-ev-mute"
        }`}
      >
        {s.summary}
      </p>
      {s.tags?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {s.tags.map((t) => (
            <span
              key={t}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                s.featured ? "border-white/20 text-white/80" : "border-ev-line text-ev-ink"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <span
        className={`mt-6 inline-flex items-center gap-2 text-sm font-medium ${
          s.featured ? "text-ev-signal" : "text-ev-night"
        }`}
      >
        Ver detalle <Arrow />
      </span>
    </Link>
  );
}

function FeaturedService({ service: s }: { service: Service }) {
  const demo = useDemoCta();
  return (
    <section className="ev-grain ev-grain-dark relative overflow-hidden bg-ev-night py-20 text-white sm:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="01" tone="dark">
              Servicio destacado
            </Eyebrow>
          </div>
          <div className="lg:col-span-9">
            <h2 className="ev-h2 max-w-4xl">
              {s.title.replace(/ de canales de denuncia$/, "")}{" "}
              <Voice className="text-ev-signal">de canales de denuncia.</Voice>
            </h2>
            <p className="ev-lead mt-6 max-w-2xl !text-white/70">{s.summary}</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 p-6">
                <p className="ev-label text-ev-signal">Sobre la plataforma EthicVoice</p>
                <p className="mt-3 text-[0.975rem] leading-relaxed text-white/75">
                  Operamos tu canal en EthicVoice de punta a punta: recepción, clasificación,
                  seguimiento e informes, con trazabilidad completa.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 p-6">
                <p className="ev-label text-ev-signal">Sobre tus canales actuales</p>
                <p className="mt-3 text-[0.975rem] leading-relaxed text-white/75">
                  Si ya tienes línea ética, correo o formulario, nuestro equipo los gestiona
                  donde están. Puede contratarse sin adquirir la plataforma.
                </p>
              </div>
            </div>

            <ul className="mt-10 grid gap-x-8 sm:grid-cols-2">
              {s.scope.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-t border-white/10 py-3 text-[0.975rem] text-white/85"
                >
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 bg-ev-signal" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/services/${s.slug}`}
                className={buttonClasses("signal", "lg")}
              >
                Ver el servicio <Arrow />
              </Link>
              <Button
                variant="outline-dark"
                size="lg"
                onClick={demo(`service_${s.slug}`, "services_featured")}
              >
                Agendar demo
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
