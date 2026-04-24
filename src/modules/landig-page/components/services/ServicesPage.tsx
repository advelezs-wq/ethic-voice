"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  serviceGroups,
  services,
  ServiceItem,
} from "@/modules/landig-page/services/services.data";
import Image from "next/image";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

export interface ServicesPageProps {
  initialCategory?: string;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  initialCategory,
}) => {
  const { openCalendly } = useCalendlyGate();
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

  return (
    <>
      <section className="relative overflow-hidden border-t border-slate-200 bg-white px-5 pb-14 pt-10 md:px-8 md:pb-20 md:pt-14">
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          {[25, 50, 75].map((left) => (
            <div
              key={left}
              className="absolute bottom-0 top-0 w-px bg-black/[0.07]"
              style={{ left: `${left}%`, transform: "translateX(-50%)" }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(94,210,156,0.16),transparent_45%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">
                Portafolio
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-[1.03] tracking-tight text-[#051a24] md:text-6xl">
                <span className="text-lime-700">Servicios</span> EthicVoice
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#273c46]">
                Soluciones profesionales en ética, cumplimiento y gobernanza.
                Explora todos nuestros servicios o filtra por categoría.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={(e) => openCalendly(e)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-7 py-3 text-sm font-semibold text-[#052b24] transition-colors hover:bg-lime-500"
                >
                  Hablar con el equipo
                  <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
                </button>
                <Link
                  href="/platform"
                  className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#051a24] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_4px_24px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-80"
                >
                  Ver plataforma
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-emerald-900/15">
                <Image
                  src="/services/hero.png"
                  alt="Portafolio de servicios: consultoría, investigación, programas de cumplimiento y más"
                  width={1536}
                  height={1024}
                  className="h-auto w-full object-cover"
                  sizes="(min-width: 1024px) min(50vw, 640px), 100vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingSectionV2
        id="catalogo"
        eyebrow="Catálogo"
        title="Todo lo que tu organización necesita"
        subtitle="Consultoría, investigaciones, canales éticos y desarrollo a la medida — en un solo ecosistema."
      >
        <div
          className="mx-auto mb-8 flex w-full max-w-md justify-center rounded-full border border-slate-200 bg-white p-1 shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:max-w-lg"
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
                ? "bg-lime-400 text-[#052b24] shadow-md"
                : "text-[#273c46] hover:bg-slate-50"
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
                ? "bg-lime-400 text-[#052b24] shadow-md"
                : "text-[#273c46] hover:bg-slate-50"
            }`}
          >
            Por categorías
          </button>
        </div>

        {activeTab === "todos" && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {allServicesWithoutDevSubs.map((s) => (
              <ServiceCard key={s.id} serviceId={s.id} />
            ))}
          </div>
        )}

        {activeTab === "categorias" && (
          <div>
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/services`)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  !selectedGroup
                    ? "border-lime-400 bg-lime-50 text-[#052b24] shadow-sm"
                    : "border-slate-200 bg-white text-[#273c46] hover:border-slate-300"
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
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    selectedGroup === g.slug
                      ? "border-lime-400 bg-lime-50 text-[#052b24] shadow-sm"
                      : "border-slate-200 bg-white text-[#273c46] hover:border-slate-300"
                  }`}
                  aria-pressed={selectedGroup === g.slug}
                >
                  {g.title}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              {filteredServices.map((s) => (
                <ServiceCard key={s.id} serviceId={s.id} />
              ))}
            </div>
          </div>
        )}
      </MarketingSectionV2>

      <MarketingSectionV2
        className="!py-20"
        guides={[{ percent: 15, accent: true }, { percent: 85, accent: true }]}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0d212c] md:text-5xl">
            ¿Quieres ver cómo encaja en tu organización?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#273c46] md:text-lg">
            Agenda una demostración personalizada y revisa servicios junto con la
            plataforma EthicVoice.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={(e) => openCalendly(e)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-8 py-4 text-sm font-bold text-[#070b0a] transition-colors hover:bg-lime-500"
            >
              Solicitar demo
              <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
            </button>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-[#0d212c] transition-colors hover:border-lime-500 hover:text-lime-700"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </MarketingSectionV2>
    </>
  );
};

/** Iconos por categoría (clases estáticas para Tailwind). */
const SERVICE_GROUP_ICON: Record<string, string> = {
  "investigacion-y-casos": "icon-[lucide--search]",
  "canales-y-programas": "icon-[lucide--megaphone]",
  "gobernanza-riesgos-datos": "icon-[lucide--shield]",
  "sostenibilidad-y-legal": "icon-[lucide--scale]",
  "desarrollo-software": "icon-[lucide--code]",
};

const ServiceCard: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const service = services.find((s) => s.id === serviceId)!;
  const isMainDev = service.id === "desarrollo-tecnologico-medida";
  const groupMeta = serviceGroups.find((g) => g.slug === service.groupSlug);
  const groupIcon = SERVICE_GROUP_ICON[service.groupSlug] ?? "icon-[lucide--layers]";

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
      className="group/card flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_-12px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_-18px_rgba(15,23,42,0.18)]"
    >
      {service.image ? (
        <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-52">
          <Image
            src={service.image}
            alt={service.title}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
            priority={false}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#051a24]/40 to-transparent"
            aria-hidden
          />
        </div>
      ) : (
        <div className="shrink-0 border-b border-slate-200 bg-[#f7faf9] px-5 py-6 sm:px-6">
          {groupMeta && (
            <span className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-800">
              <i className={`${groupIcon} h-3.5 w-3.5`} aria-hidden />
              {groupMeta.title}
            </span>
          )}
          <h3 className="text-balance text-lg font-bold tracking-tight text-[#0d212c] sm:text-xl">
            {service.title}
          </h3>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {service.image && groupMeta && (
          <span className="mb-2 inline-flex max-w-full items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-800">
            <i className={`${groupIcon} h-3.5 w-3.5 shrink-0`} aria-hidden />
            <span className="truncate">{groupMeta.title}</span>
          </span>
        )}
        {service.image && (
          <h3 className="text-balance text-lg font-bold tracking-tight text-[#0d212c] sm:text-xl">
            {service.title}
          </h3>
        )}

        <p
          className={`mt-3 text-sm leading-relaxed text-[#273c46] sm:text-[0.9375rem] ${expanded ? "" : "line-clamp-3"}`}
        >
          {service.description}
        </p>

        <div className="mt-5 grid flex-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <h4 className="mb-3 flex items-center gap-2 border-b border-slate-200/80 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              <span className="text-lime-700" aria-hidden>
                <i className="icon-[lucide--list-checks] h-4 w-4" />
              </span>
              {isMainDev ? "Subservicios incluidos" : "Lo que ofrecemos"}
            </h4>
            <ul className="space-y-2">
              {offerings.map((o, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-snug text-[#273c46]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-500" aria-hidden />
                  <span>{o}</span>
                </li>
              ))}
              {!expanded && hasMoreOfferings && (
                <li className="text-xs font-medium text-slate-500">+{extraOfferings} ítems más</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 flex items-center gap-2 border-b border-slate-200/80 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              <span className="text-[#0d212c]" aria-hidden>
                <i className="icon-[lucide--badge-check] h-4 w-4" />
              </span>
              Beneficios
            </h4>
            <ul className="space-y-2">
              {benefits.map((b, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-snug text-[#273c46]">
                  <i className="icon-[lucide--circle-check] mt-0.5 h-4 w-4 shrink-0 text-lime-600" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
              {!expanded && hasMoreBenefits && (
                <li className="text-xs font-medium text-slate-500">+{extraBenefits} beneficios más</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 sm:gap-3">
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d212c] transition hover:border-slate-300 hover:bg-slate-50"
            >
              {expanded ? (
                <>
                  <i className="icon-[lucide--chevron-up] h-4 w-4" aria-hidden />
                  Ver menos
                </>
              ) : (
                <>
                  <i className="icon-[lucide--chevron-down] h-4 w-4" aria-hidden />
                  Ver más
                </>
              )}
            </button>
          )}
          {service.groupSlug === "desarrollo-software" && (
            <a
              href="http://norvik.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d212c] transition hover:border-slate-300"
            >
              Partner tecnológico
              <i className="icon-[lucide--arrow-up-right] ml-2 size-4" aria-hidden />
            </a>
          )}
          {service.id === "servicios-juridicos" && (
            <a
              href="https://nietoosorio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d212c] transition hover:border-slate-300"
            >
              Partner jurídico
              <i className="icon-[lucide--arrow-up-right] ml-2 size-4" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
};
