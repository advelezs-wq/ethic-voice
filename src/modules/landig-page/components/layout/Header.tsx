"use client";

import {
  cn,
  Image,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { serviceGroups } from "@/modules/landig-page/services/services.data";
import { CalendlyCta } from "@/modules/landig-page/components/CalendlyCta";
import { useMobileNavDrawer } from "@/modules/landig-page/components/mobile-nav-context";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";

export const Header = () => {
  const {
    isOpen: isMobileMenuOpen,
    setIsOpen: setMobileMenuOpen,
    close: closeMobileMenu,
  } = useMobileNavDrawer();
  const { openCalendly } = useCalendlyGate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(
    null
  );

  const openCalendlyPopup = (e: { preventDefault: () => void }) => {
    openCalendly(e);
    closeMobileMenu();
  };

  const toggleMobileSection = (id: string) => {
    setOpenMobileSection((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen, closeMobileMenu]);

  const mobileNavSections = [
    {
      id: "servicios",
      label: "Servicios",
      icon: "icon-[lucide--layers]",
      links: [
        { href: "/platform", label: "Plataforma EthicVoice" },
        { href: "/services", label: "Ver todos los servicios" },
        ...serviceGroups.map((g) => ({
          href: `/services?category=${g.slug}`,
          label: g.title,
        })),
      ],
    },
    {
      id: "seguridad",
      label: "Seguridad",
      icon: "icon-[lucide--shield-check]",
      links: [{ href: "/privacidad", label: "Privacidad y Seguridad" }],
    },
    {
      id: "recursos",
      label: "Recursos",
      icon: "icon-[lucide--library]",
      links: [{ href: "/blog", label: "Blog" }],
    },
    {
      id: "nosotros",
      label: "Nosotros",
      icon: "icon-[lucide--users-round]",
      links: [
        { href: "/about", label: "Acerca de Nosotros" },
        { href: "/careers", label: "Únete a EthicVoice" },
        { href: "/blog", label: "Blog y noticias" },
      ],
    },
    {
      id: "planes",
      label: "Planes",
      icon: "icon-[lucide--credit-card]",
      links: [{ href: "/pricing", label: "Ver planes" }],
    },
  ] as const;

  const ddTriggerClass =
    "font-medium h-auto min-h-9 shrink-0 px-2 py-1.5 text-xs 2xl:px-3 2xl:py-3 2xl:text-sm group transition-colors whitespace-nowrap text-gray-700 hover:text-green-700 data-[hover=true]:bg-gray-50/80";

  const planLinkClass =
    "font-medium transition-colors shrink-0 px-2 py-1.5 rounded-lg text-xs 2xl:px-3 2xl:py-3 2xl:text-sm whitespace-nowrap text-gray-700 hover:text-green-700 hover:bg-gray-50/80";

  const signInClass =
    "font-medium transition-colors text-xs 2xl:text-sm whitespace-nowrap px-1 text-green-700 hover:text-green-800";

  return (
    <>
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 overflow-x-hidden border-b border-gray-100 bg-white py-3 shadow-sm sm:py-4 md:px-6",
        isMobileMenuOpen ? "z-40" : "z-50"
      )}
    >
      <div className="container max-w-7xl md:mx-auto flex min-w-0 w-full items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        {/* Logo Section */}
        <div className="flex min-w-0 shrink-0 items-center">
          <Link href="/" className="flex min-w-0 items-center">
            <Image
              className="object-cover w-32 sm:w-36 md:w-40 xl:w-44 2xl:w-48 max-h-10 sm:max-h-11 2xl:max-h-none"
              src="/brand/logo-nobg.png"
              alt="EthicVoice"
            />
          </Link>
        </div>

        {/* Desktop Menu — solo ≥1280px para evitar desbordes; compacto hasta 2xl */}
        <div className="hidden min-w-0 flex-1 xl:flex items-center justify-center gap-0.5 2xl:gap-2">
          {/* Servicios Dropdown */}
          <div
            onMouseEnter={() => setOpenDropdown("servicios")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <Dropdown
              isOpen={openDropdown === "servicios"}
              onOpenChange={(open) => !open && setOpenDropdown(null)}
            >
              <DropdownTrigger>
                <Button
                  variant="light"
                  className={ddTriggerClass}
                  endContent={
                    <i className="icon-[lucide--chevron-down] w-3 h-3 2xl:w-4 2xl:h-4 transition-transform duration-200 group-hover:-rotate-90 shrink-0" />
                  }
                >
                  Servicios
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Servicios"
                className="w-[900px] p-0"
                itemClasses={{ base: "p-0 rounded-none" }}
              >
                <DropdownItem
                  key="servicios-content"
                  className="p-0 data-[hover=true]:bg-white"
                >
                  <div className="flex w-full bg-white rounded-lg">
                    {/* Left Section: Platform Preview */}
                    <div className="w-1/2 p-8 bg-gray-50">
                      <div className="mb-6">
                        <div className="w-full h-40 bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          <Image
                            src="/platform/preview-1.jpg"
                            alt="Plataforma EthicVoice"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Plataforma EthicVoice
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Conoce nuestra plataforma: reportes, gestión,
                          analíticas e IA.
                        </p>
                        {/* Link removido por solicitud */}
                      </div>
                      <div className="mt-6">
                        <Link
                          href="/services"
                          className="inline-flex items-center text-sm text-green-700 hover:text-green-800 font-medium"
                        >
                          Ver todos los servicios
                          <i className="icon-[lucide--arrow-right] ml-2 w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Right Section: Groups in cards + AI callout (like reference) */}
                    <div className="w-2/3 p-8">
                      {/* Top two cards */}
                      <div className="grid grid-cols-2 gap-8">
                        {serviceGroups.slice(0, 2).map((g) => (
                          <div key={g.slug} className="space-y-2">
                            <div className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100">
                                <i className="icon-[lucide--file-text] w-4 h-4 text-green-700" />
                              </span>
                              <span className="font-medium">
                                {g.title.split(" ")[0]}
                              </span>
                            </div>
                            <Link
                              href={`/services?category=${g.slug}`}
                              className="group block"
                            >
                              <h4 className="font-semibold text-gray-900 group-hover:text-green-700 leading-snug">
                                {g.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {g.description}
                              </p>
                            </Link>
                          </div>
                        ))}
                      </div>

                      {/* AI Callout full width */}
                      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="flex items-stretch gap-4">
                          <div className="w-40 overflow-hidden flex-shrink-0 self-stretch">
                            <Image
                              src="/platform/impulsed-by-ai.jpeg"
                              alt="Andi IA"
                              className="w-full h-full rounded-l-xl object-cover"
                              classNames={{
                                wrapper: "h-full w-full",
                              }}
                              radius="none"
                            />
                          </div>
                          <div className="flex-1 p-2">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              Potenciado por Andi{" "}
                              <i
                                className="icon-[mdi--sparkles] inline-block align-middle text-amber-500 w-5 h-5"
                                aria-hidden="true"
                              />
                            </h4>
                            <p className="text-sm text-gray-600">
                              Guía el reporte con lenguaje claro, protege la
                              confidencialidad y prioriza casos automáticamente
                              para un canal más ético y transparente.
                            </p>
                            <Link
                              href="/platform"
                              className="inline-flex items-center text-green-700 font-medium mt-2 text-sm"
                            >
                              Conocer más
                              <i className="icon-[lucide--arrow-right] ml-2 w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Assurance Dropdown */}
          <div
            onMouseEnter={() => setOpenDropdown("assurance")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <Dropdown
              isOpen={openDropdown === "assurance"}
              onOpenChange={(open) => !open && setOpenDropdown(null)}
            >
              <DropdownTrigger>
                <Button
                  variant="light"
                  className={ddTriggerClass}
                  endContent={
                    <i className="icon-[lucide--chevron-down] w-3 h-3 2xl:w-4 2xl:h-4 transition-transform duration-200 group-hover:-rotate-90 shrink-0" />
                  }
                >
                  Seguridad
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Seguridad"
                className="w-[400px] p-0"
                itemClasses={{
                  base: "p-0 rounded-none",
                }}
              >
                <DropdownItem
                  key="assurance-content"
                  className="p-0 data-[hover=true]:bg-white"
                >
                  <div className="bg-white rounded-lg p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Privacidad y Seguridad
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Tus datos están seguros y privados, protegidos por
                      auditorías y seguridad estándar de la industria.
                    </p>
                    <Link
                      href="/privacidad"
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                    >
                      Conocer más
                      <i className="icon-[lucide--arrow-right] ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Partners Dropdown */}
          <div
            onMouseEnter={() => setOpenDropdown("partners")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <Dropdown
              isOpen={openDropdown === "partners"}
              onOpenChange={(open) => !open && setOpenDropdown(null)}
            >
              <DropdownTrigger>
                <Button
                  variant="light"
                  className={ddTriggerClass}
                  endContent={
                    <i className="icon-[lucide--chevron-down] w-3 h-3 2xl:w-4 2xl:h-4 transition-transform duration-200 group-hover:-rotate-90 shrink-0" />
                  }
                >
                  Partners
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Partners"
                className="w-[500px] p-0"
                itemClasses={{ base: "p-0 rounded-none" }}
              >
                <DropdownItem key="partners-content" className="p-0 data-[hover=true]:bg-white">
                  <div className="bg-white rounded-lg p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Programa de Partners</h3>
                    <p className="text-gray-600 mb-6">
                      Crece con EthicVoice ofreciendo nuestra plataforma de canal de denuncias y soluciones de cumplimiento a tus clientes.
                    </p>
                    <div className="flex gap-4">
                      <Link
                        href="/partners"
                        className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                      >
                        Conviértete en Partner
                        <i className="icon-[lucide--arrow-right] ml-2 w-4 h-4" />
                      </Link>
                      <Link
                        href="/partners/portal"
                        className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                      >
                        Portal de Partners
                        <i className="icon-[lucide--arrow-right] ml-2 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Company Dropdown */}
          <div
            onMouseEnter={() => setOpenDropdown("company")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <Dropdown
              isOpen={openDropdown === "company"}
              onOpenChange={(open) => !open && setOpenDropdown(null)}
            >
              <DropdownTrigger>
                <Button
                  variant="light"
                  className={ddTriggerClass}
                  endContent={
                    <i className="icon-[lucide--chevron-down] w-3 h-3 2xl:w-4 2xl:h-4 transition-transform duration-200 group-hover:-rotate-90 shrink-0" />
                  }
                >
                  Nosotros
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Nosotros"
                className="w-[700px] p-0"
                itemClasses={{
                  base: "p-0 rounded-none",
                }}
              >
                <DropdownItem
                  key="company-content"
                  className="p-0 data-[hover=true]:bg-white"
                >
                  <div className="flex w-full bg-white rounded-lg">
                    {/* Left Section */}
                    <div className="w-1/2 p-8 bg-gray-50">
                      <div className="mb-6">
                        <div className="w-full h-40 bg-gradient-to-br from-green-100 to-teal-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          <Image
                            src="/nosotros/nosotros-2.png"
                            alt="Nosotros EthicVoice"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Acerca de EthicVoice
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Donde la integridad se encuentra con la innovación.
                          EthicVoice hace que hacer lo correcto sea más fácil.
                        </p>
                        <Link
                          href="/about"
                          className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                        >
                          Acerca de Nosotros
                          <i className="icon-[lucide--arrow-right] ml-2 w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="w-1/2 p-8">
                      <div className="space-y-8">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Acerca de nosotros
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            La historia detrás de nuestro compromiso con los
                            negocios éticos.
                          </p>
                          <Link
                            href="/about"
                            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Conocer más
                            <i className="icon-[lucide--arrow-right] ml-1 w-3 h-3" />
                          </Link>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Únete a EthicVoice
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Únete a nosotros para dar forma a un futuro ético
                            con soluciones impactantes y transparentes.
                          </p>
                          <Link
                            href="/careers"
                            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Conocer más
                            <i className="icon-[lucide--arrow-right] ml-1 w-3 h-3" />
                          </Link>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Blog
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Artículos y novedades sobre línea ética y cumplimiento.
                          </p>
                          <Link
                            href="/blog"
                            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Conocer más
                            <i className="icon-[lucide--arrow-right] ml-1 w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Pricing Link */}
          <Link
            href="/pricing"
            className={planLinkClass}
          >
            Planes
          </Link>
        </div>

        {/* Desktop CTAs — alineados a la derecha, sin salirse del viewport */}
        <div className="hidden shrink-0 xl:flex items-center gap-2 2xl:gap-4">
          <Link
            href="/auth/sign-in"
            className={signInClass}
          >
            Iniciar sesión
          </Link>
          <CalendlyCta
            className="rounded-full font-semibold group transition-all flex items-center cursor-pointer border shrink-0 max-w-full px-3 py-1.5 text-xs 2xl:px-5 2xl:py-2 2xl:text-sm bg-green-700 text-white hover:bg-green-800 border-transparent"
          >
            <span className="truncate">
              <span className="2xl:hidden">Contactar</span>
              <span className="hidden 2xl:inline">Contactar experto</span>
            </span>
            <i
              className="icon-[mdi--arrow-right] ml-1 2xl:ml-2 size-4 2xl:size-5 shrink-0 transition-transform group-hover:-rotate-45 hidden min-[1536px]:block"
              role="img"
              aria-hidden="true"
            />
          </CalendlyCta>
        </div>

        {/* Mobile / tablet: abrir menú (al abrir, el cierre está solo en el drawer) */}
        <div className="xl:hidden shrink-0">
          {isMobileMenuOpen ? (
            <div
              className="h-10 w-10 shrink-0"
              aria-hidden
            />
          ) : (
            <Button
              variant="light"
              isIconOnly
              className="p-2 text-gray-700"
              onPress={() => setMobileMenuOpen(true)}
              aria-controls="mobile-menu"
              aria-expanded={false}
            >
              <i
                className="icon-[lucide--menu] size-6"
                role="img"
                aria-hidden="true"
              />
            </Button>
          )}
        </div>
      </div>
    </nav>

      {/* Fuera del nav: stacking correcto sobre el header y el resto de la página */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              key="mobile-drawer-backdrop"
              type="button"
              aria-label="Cerrar menú"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden fixed inset-0 z-[10050] bg-[#051a24]/40 backdrop-blur-[2px]"
              onClick={closeMobileMenu}
            />

            <motion.div
              key="mobile-drawer-panel"
              role="navigation"
              aria-label="Menú de navegación móvil"
              id="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 34,
                stiffness: 380,
                mass: 0.82,
              }}
              className="xl:hidden fixed inset-y-0 right-0 z-[10051] flex h-dvh max-h-dvh w-full max-w-[min(100vw,20.5rem)] flex-col border-l border-slate-200/90 bg-white shadow-[-16px_0_48px_rgba(15,23,42,0.12)] sm:max-w-[24rem] md:max-w-[26.5rem]"
            >
              <div className="pointer-events-none absolute left-0 top-0 h-24 w-full bg-gradient-to-b from-lime-400/8 to-transparent" aria-hidden />

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="relative flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))]">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-700">
                      Navegación
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[#0d212c]">
                      EthicVoice
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-[#273c46] shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-[#0d212c]"
                    aria-label="Cerrar menú"
                  >
                    <i className="icon-[lucide--x] h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
                  <div className="space-y-2">
                    {mobileNavSections.map((section) => {
                      const open = openMobileSection === section.id;
                      return (
                        <div
                          key={section.id}
                          className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50/90 active:bg-slate-50 sm:px-3.5 sm:py-3.5"
                            onClick={() => toggleMobileSection(section.id)}
                            aria-expanded={open}
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-100 ring-1 ring-lime-200/60">
                              <i
                                className={`${section.icon} h-[18px] w-[18px] text-lime-800 sm:h-5 sm:w-5`}
                                aria-hidden
                              />
                            </span>
                            <span className="min-w-0 flex-1 text-[0.9375rem] font-semibold text-[#0d212c]">
                              {section.label}
                            </span>
                            <i
                              className={cn(
                                "icon-[lucide--chevron-down] h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                                open && "rotate-180 text-lime-700"
                              )}
                              aria-hidden
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {open && (
                              <motion.div
                                key={`panel-${section.id}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.2,
                                  ease: [0.4, 0, 0.2, 1],
                                }}
                                className="overflow-hidden border-t border-slate-100 bg-[#f7faf9]/70"
                              >
                                <ul className="space-y-0.5 px-2 py-2 sm:px-3 sm:py-2.5">
                                  {section.links.map((link) => (
                                    <li key={`${section.id}-${link.href}`}>
                                      <Link
                                        href={link.href}
                                        className="flex items-center gap-2 rounded-xl py-2.5 pl-3 pr-2 text-sm text-[#273c46] transition-colors hover:bg-white hover:text-[#0d212c] hover:shadow-sm"
                                        onClick={closeMobileMenu}
                                      >
                                        <span
                                          className="h-1 w-1 shrink-0 rounded-full bg-lime-500 opacity-70"
                                          aria-hidden
                                        />
                                        {link.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="relative mt-auto shrink-0 border-t border-slate-100 bg-white/95 px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:py-4">
                  <div className="flex flex-col gap-2.5">
                    <Link
                      href="/auth/sign-in"
                      className="rounded-full border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-[#0d212c] transition-colors hover:border-slate-300 hover:bg-slate-50"
                      onClick={closeMobileMenu}
                    >
                      Iniciar sesión
                    </Link>
                    <button
                      type="button"
                      onClick={openCalendlyPopup}
                      className="rounded-full bg-lime-400 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_4px_20px_rgba(163,230,53,0.35)] transition hover:bg-lime-500 active:scale-[0.99]"
                    >
                      Solicitar demo
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
