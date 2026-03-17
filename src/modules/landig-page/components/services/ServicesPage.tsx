"use client";

import React, { useMemo } from "react";
// import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, Tab, Card, CardBody, Chip } from "@heroui/react";
import { motion } from "framer-motion";
import {
  serviceGroups,
  services,
  ServiceItem,
} from "@/modules/landig-page/services/services.data";
import { Header } from "@/modules/landig-page/components/layout/Header";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
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

  const filteredServices: ServiceItem[] = useMemo(() => {
    // If no category selected, show all except development subservices; keep only main dev card
    if (!selectedGroup) {
      return services.filter(
        (s) => s.groupSlug !== DEV_GROUP_SLUG || s.id === MAIN_DEV_ID
      );
    }
    // If development category selected, show only main dev card
    if (selectedGroup === DEV_GROUP_SLUG) {
      return services.filter((s) => s.id === MAIN_DEV_ID);
    }
    // Otherwise, normal filtering
    return services.filter((s) => s.groupSlug === selectedGroup);
  }, [selectedGroup]);

  const allServicesWithoutDevSubs: ServiceItem[] = useMemo(() => {
    const base = services.filter(
      (s) => s.groupSlug !== DEV_GROUP_SLUG || s.id === MAIN_DEV_ID
    );
    // Ensure main dev card is last
    return base.sort((a, b) => {
      if (a.id === MAIN_DEV_ID) return 1;
      if (b.id === MAIN_DEV_ID) return -1;
      return 0;
    });
  }, []);

  const banner = (
    <section className="relative pb-20 pt-36 px-6 bg-gradient-to-br from-white via-gray-50 to-green-50/30 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Servicios
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Soluciones profesionales en ética, cumplimiento y gobernanza.
              Explora todos nuestros servicios o filtra por categoría.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full h-80 rounded-2xl overflow-hidden">
              <Image
                src="/services/hero.png"
                alt="Portafolio de Servicios: Consultoría, investigación, programas de cumplimiento y más"
                fill
                priority
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white">
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
      <Header />
      {banner}
      <section className="py-10 px-6">
        <div className="container mx-auto max-w-7xl">
          <Tabs
            aria-label="Servicios tabs"
            color="success"
            variant="solid"
            defaultSelectedKey={selectedGroup ? "categorias" : "todos"}
          >
            <Tab key="todos" title="Todos los servicios">
              <div className="mt-6 columns-1 md:columns-2 gap-x-6">
                {allServicesWithoutDevSubs.map((s) => (
                  <ServiceCard key={s.id} serviceId={s.id} />
                ))}
              </div>
            </Tab>
            <Tab key="categorias" title="Por categorías">
              <div className="mt-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => router.push(`/services`)}
                    className="inline-flex"
                    aria-label="Ver todas las categorías"
                  >
                    <Chip
                      color={!selectedGroup ? "success" : "default"}
                      variant={!selectedGroup ? "solid" : "bordered"}
                    >
                      Todas
                    </Chip>
                  </button>
                  {serviceGroups.map((g) => (
                    <button
                      key={g.slug}
                      onClick={() =>
                        router.push(`/services?category=${g.slug}`)
                      }
                      className="inline-flex"
                      aria-label={`Ver categoría ${g.title}`}
                    >
                      <Chip
                        color={selectedGroup === g.slug ? "success" : "default"}
                        variant={
                          selectedGroup === g.slug ? "solid" : "bordered"
                        }
                      >
                        {g.title}
                      </Chip>
                    </button>
                  ))}
                </div>

                <div className="columns-1 md:columns-2 gap-x-6">
                  {filteredServices.map((s) => (
                    <ServiceCard key={s.id} serviceId={s.id} />
                  ))}
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </section>
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Quieres ver cómo funciona?
          </h3>
          <p className="text-gray-600 mb-6">
            Agenda una demostración personalizada de nuestros servicios.
          </p>
          <button
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
            className="bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 group transition-colors inline-flex items-center"
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
      <Footer />
    </div>
  );
};

const ServiceCard: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const service = services.find((s) => s.id === serviceId)!;
  // const group = serviceGroups.find((g) => g.slug === service.groupSlug)!; // retained for potential future use
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card shadow="sm" className="border border-gray-200 overflow-hidden mb-6 break-inside-avoid rounded-xl">
        {service.image && (
          <div className="relative w-full h-40 overflow-hidden rounded-t-xl">
            <Image
              src={service.image}
              alt={service.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority={false}
            />
          </div>
        )}
        <CardBody className="pt-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {service.title}
            </h3>
            <p className={`text-gray-600 mt-1 ${expanded ? "" : "line-clamp-2"}`}>
              {service.description}
            </p>

            <motion.div
              animate={{ height: "auto" }}
              initial={false}
              className="mt-4 grid grid-cols-1 gap-3"
            >
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {isMainDev ? "Subservicios incluidos" : "Lo que ofrecemos"}
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {offerings.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                    {!expanded && hasMoreOfferings && (
                      <li className="text-gray-400">
                        … y {extraOfferings} más
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Beneficios
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                    {!expanded && hasMoreBenefits && (
                      <li className="text-gray-400">… y {extraBenefits} más</li>
                    )}
                  </ul>
                </div>
            </motion.div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="text-green-700 font-medium"
                >
                  {expanded ? "Ver menos" : "Ver más"}
                </button>
              )}
              {service.groupSlug === "desarrollo-software" && (
                <a
                  href="http://norvik.tech/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border-2 border-[#1f7a4c] text-[#1f7a4c] rounded-lg hover:bg-green-50 font-semibold"
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
                  className="inline-flex items-center px-4 py-2 border-2 border-[#1f7a4c] text-[#1f7a4c] rounded-lg hover:bg-green-50 font-semibold"
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
        </CardBody>
      </Card>
    </motion.div>
  );
};
