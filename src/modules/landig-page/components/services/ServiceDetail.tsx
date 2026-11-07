"use client";

import Link from "next/link";
import {
  Arrow,
  Button,
  Container,
  Eyebrow,
  buttonClasses,
} from "@/modules/brand/components/primitives";
import { PageHero } from "@/modules/brand/components/sections";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import {
  SERVICES,
  SERVICE_CONDITIONS,
  getService,
  serviceInfoMailto,
} from "@/modules/landig-page/services/services.data";

const pad = (n: number) => String(n).padStart(2, "0");

/** Detalle de un servicio: descripción, alcance, contratación y CTA. */
export function ServiceDetail({ slug }: { slug: string }) {
  const demo = useDemoCta();
  const service = getService(slug);
  if (!service) return null;

  const idx = SERVICES.findIndex((s) => s.slug === slug);
  const prev = SERVICES[(idx - 1 + SERVICES.length) % SERVICES.length];
  const next = SERVICES[(idx + 1) % SERVICES.length];
  const mailto = serviceInfoMailto(service);

  const ctas = (
    <>
      <a href={mailto} className={buttonClasses("signal", "lg")}>
        Solicitar información <Arrow />
      </a>
      <Button
        variant="outline"
        size="lg"
        onClick={demo(`service_${service.slug}`, "service_detail")}
      >
        Agendar demo
      </Button>
    </>
  );

  return (
    <>
      <PageHero
        index={pad(service.number)}
        kicker="Servicios"
        title={[service.title]}
        lead={service.summary}
        actions={ctas}
      />

      <section className="bg-white py-20 sm:py-24">
        <Container>
          <Link
            href="/services"
            className="ev-label inline-flex items-center gap-2 text-ev-mute hover:text-ev-night"
          >
            <span aria-hidden>←</span> Todos los servicios
          </Link>

          <div className="mt-10 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow index="01">Alcance</Eyebrow>
              <ol className="mt-6">
                {service.scope.map((item, i) => (
                  <li
                    key={item}
                    className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-ev-line py-5"
                  >
                    <span className="ev-label pt-1 text-ev-moss">{pad(i + 1)}</span>
                    <span className="text-[1.0625rem] leading-snug text-ev-night">{item}</span>
                  </li>
                ))}
              </ol>
              {service.scopeNote ? (
                <p className="border-t border-ev-line pt-5 text-[0.95rem] leading-relaxed text-ev-mute">
                  {service.scopeNote}
                </p>
              ) : null}
            </div>

            <aside className="lg:col-span-5">
              <div className="rounded-2xl bg-ev-paper p-6 sm:p-8">
                <Eyebrow index="02">Contratación</Eyebrow>
                <p className="mt-4 text-[1.125rem] font-medium leading-snug tracking-[-0.02em] text-ev-night">
                  {service.contracting}
                </p>
                {service.tags?.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {service.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-ev-line bg-white px-2.5 py-1 text-xs text-ev-ink"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-8 flex flex-col gap-3">{ctas}</div>
                <p className="mt-6 text-xs leading-relaxed text-ev-mute">
                  Escríbenos a{" "}
                  <a href={mailto} className="underline underline-offset-2">
                    info@ethicvoice.co
                  </a>{" "}
                  y te respondemos con una propuesta.
                </p>
              </div>
            </aside>
          </div>

          <p className="mt-16 max-w-3xl border-t border-ev-line pt-6 text-[0.9rem] leading-relaxed text-ev-mute">
            <span className="font-medium text-ev-night">Condiciones de prestación.</span>{" "}
            {SERVICE_CONDITIONS}
          </p>

          <nav
            aria-label="Otros servicios"
            className="mt-12 grid gap-4 border-t border-ev-line pt-8 sm:grid-cols-2"
          >
            <Link href={`/services/${prev.slug}`} className="group/btn rounded-2xl border border-ev-line p-5 hover:border-ev-night/40">
              <span className="ev-label text-ev-mute">← Anterior · {pad(prev.number)}</span>
              <span className="mt-2 block font-medium text-ev-night">{prev.title}</span>
            </Link>
            <Link href={`/services/${next.slug}`} className="group/btn rounded-2xl border border-ev-line p-5 text-right hover:border-ev-night/40">
              <span className="ev-label text-ev-mute">Siguiente · {pad(next.number)} →</span>
              <span className="mt-2 block font-medium text-ev-night">{next.title}</span>
            </Link>
          </nav>
        </Container>
      </section>
    </>
  );
}
