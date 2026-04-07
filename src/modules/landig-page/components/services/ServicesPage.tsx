"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  serviceGroups,
  services,
  ServiceItem,
} from "@/modules/landig-page/services/services.data";
import Script from "next/script";
import Image from "next/image";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export interface ServicesPageProps {
  initialCategory?: string;
}

function ServicesListingBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(20,83,45,0.07)_0%,transparent_50%)]" />
      <svg
        className="absolute -right-[12%] top-1/3 h-[min(70%,420px)] w-[min(70%,560px)] -translate-y-1/2 opacity-[0.2] md:opacity-30"
        viewBox="0 0 600 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          stroke="#14532d"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.3"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M40 420 C180 280 380 480 560 320" />
          <path d="M0 200 C200 80 400 260 600 120" />
        </g>
      </svg>
    </div>
  );
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  initialCategory,
}) => {
  const router = useRouter();
  const DEV_GROUP_SLUG = "desarrollo-software";
  const MAIN_DEV_ID = "desarrollo-tecnologico-medida";
  const selectedGroup = useMemo(() => {
    if (!initialCategory) return undefined;
    return serviceGroups.find((g) => g.slug === initialCategory)?.slug;
  }, [initialCategory]);

  const [activeTab, setActiveTab] = useState<"todos" | "categorias">(
    () => (initialCategory ? "categorias" : "todos")
  );

  useEffect(() => {
    setActiveTab(initialCategory ? "categorias" : "todos");
  }, [initialCategory]);

  const filteredServices: ServiceItem[] = useMemo(() => {
    if (!selectedGroup) {
      return services.filter(
        (s) => s.groupSlug !== DEV_GROUP_SLUG || s.id === MAIN_DEV_ID
      );
    }
    if (selectedGroup === DEV_GROUP_SLUG) {
      return services.filter((s) => s.id === MAIN_DEV_ID);
    }
    return services.filter((s) => s.groupSlug === selectedGroup);
  }, [selectedGroup]);

  const allServicesWithoutDevSubs: ServiceItem[] = useMemo(() => {
    const base = services.filter(
      (s) => s.groupSlug !== DEV_GROUP_SLUG || s.id === MAIN_DEV_ID
    );
    return base.sort((a, b) => {
      if (a.id === MAIN_DEV_ID) return 1;
      if (b.id === MAIN_DEV_ID) return -1;
      return 0;
    });
  }, []);

  const onSelectTodos = () => {
    setActiveTab("todos");
    router.push("/services");
  };

  const onSelectCategorias = () => {
    setActiveTab("categorias");
  };

  const banner = (
    <section className="relative overflow-hidden bg-[#0a1f14] px-6 pb-16 pt-8 md:pt-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(22,101,52,0.35)_0%,transparent_55%)]"
        aria-hidden
      />
      <div className="relative z-10 container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90">
              Portafolio
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              <span className="text-lime-400">Servicios</span>
            </h1>
            <p className="max-w-2xl text-lg text-white/80">
              Soluciones profesionales en ética, cumplimiento y gobernanza.
              Explora todos nuestros servicios o filtra por categoría.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="inline-block max-w-full overflow-hidden rounded-2xl border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
              <Image
                src="/services/hero.png"
                alt="Portafolio de Servicios: Consultoría, investigación, programas de cumplimiento y más"
                width={1536}
                height={1024}
                className="block h-auto w-full max-w-full align-top"
                sizes="(min-width: 1024px) min(50vw, 640px), 100vw"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof document !== "undefined") {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href =
              "https://assets.calendly.com/assets/external/widget.css";
            document.head.appendChild(link);
          }
        }}
      />
      {banner}

      <section className="relative overflow-hidden bg-gradient-to-b from-[#f5f3ee] via-[#faf9f6] to-[#f5f3ee] px-4 py-10 sm:px-6 md:py-14">
        <ServicesListingBg />
        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="mb-8 text-center sm:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/70">
              Catálogo
            </p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-[#0a1f14] sm:text-3xl">
              Todo lo que tu organización necesita
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
              Consultoría, investigaciones, canales éticos y desarrollo a la
              medida — en un solo ecosistema.
            </p>
          </div>

          <div
            className="mx-auto mb-8 flex w-full max-w-md justify-center rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-[#0a1f14]/10 sm:max-w-lg"
            role="tablist"
            aria-label="Vista de servicios"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "todos"}
              onClick={onSelectTodos}
              className={`min-h-11 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-6 ${
                activeTab === "todos"
                  ? "bg-[#0a1f14] text-white shadow-md"
                  : "text-gray-600 hover:text-[#0a1f14]"
              }`}
            >
              Todos los servicios
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "categorias"}
              onClick={onSelectCategorias}
              className={`min-h-11 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-6 ${
                activeTab === "categorias"
                  ? "bg-[#0a1f14] text-white shadow-md"
                  : "text-gray-600 hover:text-[#0a1f14]"
              }`}
            >
              Por categorías
            </button>
          </div>

          {activeTab === "todos" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
              {allServicesWithoutDevSubs.map((s) => (
                <ServiceCard key={s.id} serviceId={s.id} />
              ))}
            </div>
          )}

          {activeTab === "categorias" && (
            <div>
              <div className="mb-8 flex flex-wrap justify-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push(`/services`)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    !selectedGroup
                      ? "bg-lime-400 text-gray-950 shadow-[0_0_20px_rgba(190,242,100,0.35)]"
                      : "border border-[#0a1f14]/15 bg-white text-[#0a1f14] hover:border-[#0a1f14]/25"
                  }`}
                  aria-pressed={!selectedGroup}
                >
                  Todas
                </button>
                {serviceGroups.map((g) => (
                  <button
                    key={g.slug}
                    type="button"
                    onClick={() => router.push(`/services?category=${g.slug}`)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      selectedGroup === g.slug
                        ? "bg-lime-400 text-gray-950 shadow-[0_0_20px_rgba(190,242,100,0.35)]"
                        : "border border-[#0a1f14]/15 bg-white text-[#0a1f14] hover:border-[#0a1f14]/25"
                    }`}
                    aria-pressed={selectedGroup === g.slug}
                  >
                    {g.title}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
                {filteredServices.map((s) => (
                  <ServiceCard key={s.id} serviceId={s.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0a1f14] px-6 py-16 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(22,101,52,0.4)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 container mx-auto max-w-3xl text-center">
          <h3 className="text-2xl font-bold text-white md:text-3xl">
            ¿Quieres ver cómo funciona?
          </h3>
          <p className="mt-3 text-white/75">
            Agenda una demostración personalizada de nuestros servicios.
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== "undefined" && window.Calendly) {
                window.Calendly.initPopupWidget({
                  url: "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1",
                });
              } else if (typeof window !== "undefined") {
                window.open(
                  "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1",
                  "_blank"
                );
              }
            }}
            className="group mt-8 inline-flex items-center rounded-full bg-lime-400 px-7 py-3.5 text-sm font-bold text-gray-950 shadow-[0_0_28px_rgba(190,242,100,0.4)] transition hover:bg-lime-300"
          >
            Solicitar demo
            <i
              className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45"
              role="img"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>
    </>
  );
};

const ServiceCard: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const service = services.find((s) => s.id === serviceId)!;
  const isMainDev = service.id === "desarrollo-tecnologico-medida";

  const [expanded, setExpanded] = React.useState(false);
  const previewLines = 3;
  const hasMoreOfferings = service.offerings.length > previewLines;
  const hasMoreBenefits = service.benefits.length > previewLines;
  const hasMore = hasMoreOfferings || hasMoreBenefits;
  const offerings =
    expanded || !hasMore
      ? service.offerings
      : service.offerings.slice(0, previewLines);
  const benefits =
    expanded || !hasMore
      ? service.benefits
      : service.benefits.slice(0, previewLines);
  const extraOfferings = Math.max(0, service.offerings.length - previewLines);
  const extraBenefits = Math.max(0, service.benefits.length - previewLines);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className="group/card overflow-hidden rounded-3xl border border-[#0a1f14]/10 bg-white/95 shadow-md shadow-gray-200/50 ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0a1f14]/18 hover:shadow-lg hover:shadow-[#0a1f14]/08"
    >
      {service.image && (
        <div className="relative h-44 w-full overflow-hidden sm:h-48">
          <Image
            src={service.image}
            alt={service.title}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-[1.02]"
            priority={false}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1f14]/25 to-transparent"
            aria-hidden
          />
        </div>
      )}
      <div className="p-5 sm:p-6">
        <h3 className="text-lg font-bold tracking-tight text-[#0a1f14] sm:text-xl">
          {service.title}
        </h3>
        <p
          className={`mt-2 text-sm leading-relaxed text-gray-600 sm:text-[0.9375rem] ${expanded ? "" : "line-clamp-2"}`}
        >
          {service.description}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 sm:gap-6">
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-green-800">
              <span className="h-px w-6 bg-lime-500/80" aria-hidden />
              {isMainDev ? "Subservicios incluidos" : "Lo que ofrecemos"}
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {offerings.map((o, i) => (
                <li key={i} className="flex gap-2">
                  <i
                    className="icon-[mdi--check-circle] mt-0.5 size-4 shrink-0 text-lime-600"
                    aria-hidden
                  />
                  <span>{o}</span>
                </li>
              ))}
              {!expanded && hasMoreOfferings && (
                <li className="pl-6 text-xs text-gray-400">
                  … y {extraOfferings} más
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-green-800">
              <span className="h-px w-6 bg-lime-500/80" aria-hidden />
              Beneficios
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {benefits.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <i
                    className="icon-[mdi--check-circle] mt-0.5 size-4 shrink-0 text-lime-600"
                    aria-hidden
                  />
                  <span>{b}</span>
                </li>
              ))}
              {!expanded && hasMoreBenefits && (
                <li className="pl-6 text-xs text-gray-400">
                  … y {extraBenefits} más
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="text-sm font-semibold text-[#0a1f14] underline decoration-lime-400/60 underline-offset-4 transition hover:decoration-lime-500"
            >
              {expanded ? "Ver menos" : "Ver más"}
            </button>
          )}
          {service.groupSlug === "desarrollo-software" && (
            <a
              href="http://norvik.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border-2 border-[#0a1f14]/20 px-4 py-2 text-sm font-semibold text-[#0a1f14] transition hover:border-lime-400/60 hover:bg-[#f5f3ee]"
            >
              Visitar partner tecnológico
              <i
                className="icon-[mdi--arrow-top-right] ml-2 size-5"
                role="img"
                aria-hidden="true"
              />
            </a>
          )}
          {service.id === "servicios-juridicos" && (
            <a
              href="https://nietoosorio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border-2 border-[#0a1f14]/20 px-4 py-2 text-sm font-semibold text-[#0a1f14] transition hover:border-lime-400/60 hover:bg-[#f5f3ee]"
            >
              Visitar partner jurídico
              <i
                className="icon-[mdi--arrow-top-right] ml-2 size-5"
                role="img"
                aria-hidden="true"
              />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
};
