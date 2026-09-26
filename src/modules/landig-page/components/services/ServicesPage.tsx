"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import {
  Button,
  ButtonLink,
  Container,
  Voice,
} from "@/modules/brand/components/primitives";
import { PageHero } from "@/modules/brand/components/sections";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import {
  serviceGroups,
  services,
  type ServiceItem,
} from "@/modules/landig-page/services/services.data";

export interface ServicesPageProps {
  initialCategory?: string;
}

const DEV_GROUP_SLUG = "desarrollo-software";
const MAIN_DEV_ID = "desarrollo-tecnologico-medida";

/**
 * Portafolio de servicios como índice editorial: filtros por categoría
 * (enlaces con ?category=) y cada servicio como fila desplegable.
 */
export const ServicesPage: React.FC<ServicesPageProps> = ({ initialCategory }) => {
  const demo = useDemoCta();
  const selectedGroup = serviceGroups.find((g) => g.slug === initialCategory)?.slug;

  const list: ServiceItem[] = useMemo(() => {
    // Los sub-servicios de software se agrupan bajo el servicio principal.
    const base = services.filter(
      (s) => s.groupSlug !== DEV_GROUP_SLUG || s.id === MAIN_DEV_ID,
    );
    if (!selectedGroup) {
      return [...base].sort((a, b) =>
        a.id === MAIN_DEV_ID ? 1 : b.id === MAIN_DEV_ID ? -1 : 0,
      );
    }
    return base.filter((s) => s.groupSlug === selectedGroup);
  }, [selectedGroup]);

  const groupTitle = (slug: string) =>
    serviceGroups.find((g) => g.slug === slug)?.title ?? "";

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
        lead="Además de la plataforma, te acompañamos con investigación, programas de cumplimiento, gobernanza, asesoría legal y desarrollo a medida."
        actions={
          <>
            <Button variant="signal" size="lg" arrow onClick={demo("services_hero", "services")}>
              Hablar con el equipo
            </Button>
            <ButtonLink href="/platform" variant="outline" size="lg">
              Ver la plataforma
            </ButtonLink>
          </>
        }
      />

      <section className="bg-white py-20 sm:py-28">
        <Container>
          {/* Filtros */}
          <nav aria-label="Categorías de servicios" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {[{ slug: "", title: "Todos" }, ...serviceGroups].map((g) => {
              const active = (g.slug || undefined) === selectedGroup;
              return (
                <Link
                  key={g.slug || "todos"}
                  href={g.slug ? `/services?category=${g.slug}` : "/services"}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`ev-press shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? "border-ev-night bg-ev-night text-white"
                      : "border-ev-line text-ev-ink hover:border-ev-night/40"
                  }`}
                >
                  {g.title}
                </Link>
              );
            })}
          </nav>

          <p className="ev-label mt-10 text-ev-mute">
            {list.length} {list.length === 1 ? "servicio" : "servicios"}
            {selectedGroup ? ` · ${groupTitle(selectedGroup)}` : ""}
          </p>

          {/* Índice */}
          <div className="mt-4 border-b border-ev-line">
            {list.map((s, i) => (
              <details key={s.id} id={s.id} className="ev-faq group scroll-mt-28 border-t border-ev-line" name="services">
                <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-7 sm:grid-cols-[4rem_1fr_16rem_auto] sm:gap-6 [&::-webkit-details-marker]:hidden">
                  <span className="ev-label text-ev-haze">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[clamp(1.35rem,2.4vw,2rem)] font-medium leading-tight tracking-[-0.035em] text-ev-night transition-colors group-hover:text-ev-slate">
                    {s.title}
                  </span>
                  <span className="ev-label hidden text-ev-mute sm:block">{groupTitle(s.groupSlug)}</span>
                  <span className="relative h-5 w-5 self-center transition-transform duration-300 ease-ev-out group-open:rotate-45" aria-hidden>
                    <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-ev-night" />
                    <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-ev-night" />
                  </span>
                </summary>
                <div className="ev-faq-body">
                  <div className="grid gap-10 pb-10 sm:pl-[5.5rem] lg:grid-cols-12">
                    <p className="ev-lead lg:col-span-5">{s.description}</p>
                    <div className="lg:col-span-4">
                      <p className="ev-label text-ev-moss">Qué incluye</p>
                      <ul className="mt-3 space-y-2 text-[0.975rem] text-ev-ink">
                        {s.offerings.map((o) => (
                          <li key={o} className="flex gap-3">
                            <span className="mt-[0.6em] h-1 w-1 shrink-0 bg-ev-signal" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="lg:col-span-3">
                      <p className="ev-label text-ev-moss">Beneficios</p>
                      <ul className="mt-3 space-y-2 text-[0.975rem] text-ev-mute">
                        {s.benefits.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                      <Button
                        variant="ink"
                        arrow
                        className="mt-8"
                        onClick={demo(`service_${s.id}`, "services_list")}
                      >
                        Solicitar este servicio
                      </Button>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
};
