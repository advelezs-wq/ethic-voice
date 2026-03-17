"use client";

// Extend the Window interface to include the Calendly property
declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

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
import { useEffect, useRef, useState } from "react";
import { serviceGroups } from "@/modules/landig-page/services/services.data";
import { CalendlyCta } from "@/modules/landig-page/components/CalendlyCta";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(
    null
  );
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Your Calendly URL with parameters
  const calendlyUrl =
    "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1";

  const openCalendlyPopup = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: calendlyUrl,
      });
    } else if (typeof window !== "undefined") {
      window.open(calendlyUrl, "_blank");
    }

    // Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  const toggleMobileSection = (id: string) => {
    setOpenMobileSection((prev) => (prev === id ? null : id));
  };

  return (
    <nav
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 md:px-6",
        isScrolled
          ? "bg-white/95 backdrop-blur-lg shadow-sm"
          : "bg-white/80 backdrop-blur-sm"
      )}
    >
      <div className="container max-w-7xl md:mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center flex-shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              className="w-48 object-cover"
              src="/brand/logo-nobg.png"
              alt="EthicVoice"
            />
          </Link>
        </div>

        {/* Desktop Menu - Centered */}
        <div className="hidden lg:flex items-center space-x-2 flex-1 justify-center">
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
                  className="text-gray-700 hover:text-green-700 font-medium h-auto p-3 data-[hover=true]:bg-gray-50/80 group"
                  endContent={
                    <i className="icon-[lucide--chevron-down] w-4 h-4 transition-transform duration-200 group-hover:-rotate-90" />
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
                  className="text-gray-700 hover:text-green-700 font-medium h-auto p-3 data-[hover=true]:bg-gray-50/80 group"
                  endContent={
                    <i className="icon-[lucide--chevron-down] w-4 h-4 transition-transform duration-200 group-hover:-rotate-90" />
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
                  className="text-gray-700 hover:text-green-700 font-medium h-auto p-3 data-[hover=true]:bg-gray-50/80 group"
                  endContent={
                    <i className="icon-[lucide--chevron-down] w-4 h-4 transition-transform duration-200 group-hover:-rotate-90" />
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
                  className="text-gray-700 hover:text-green-700 font-medium h-auto p-3 data-[hover=true]:bg-gray-50/80 group"
                  endContent={
                    <i className="icon-[lucide--chevron-down] w-4 h-4 transition-transform duration-200 group-hover:-rotate-90" />
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
                            Noticias de la Empresa
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Noticias y cobertura de prensa sobre EthicVoice.
                          </p>
                          <Link
                            href="/noticias"
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
            className="text-gray-700 hover:text-green-700 font-medium transition-colors px-3 py-3 rounded-lg hover:bg-gray-50/80 text-sm"
          >
            Planes
          </Link>
        </div>

        {/* Desktop CTAs - Right aligned */}
        <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
          <Link
            href="/auth/sign-in"
            className="text-green-700 hover:text-green-700 font-medium transition-colors"
          >
            Iniciar sesión
          </Link>
          <CalendlyCta className="bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 group transition-colors flex items-center cursor-pointer">
            Solicitar demo
            <i
              className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45"
              role="img"
              aria-hidden="true"
            />
          </CalendlyCta>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex-shrink-0">
          <Button
            variant="light"
            isIconOnly
            className="text-gray-700 p-2"
            onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <i
                className="icon-[lucide--x] size-6"
                role="img"
                aria-hidden="true"
              />
            ) : (
              <i
                className="icon-[lucide--menu] size-6"
                role="img"
                aria-hidden="true"
              />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden fixed left-0 right-0 bottom-0 top-20 z-40 bg-white overflow-y-auto min-h-screen"
          role="navigation"
          aria-label="Menú de navegación móvil"
        >
          <div className="flex flex-col divide-y">
            {/* Servicios */}
            <div>
              <button
                className="w-full flex items-center justify-between py-4 px-6 text-left font-semibold text-gray-900"
                onClick={() => toggleMobileSection("servicios")}
                aria-controls="mobile-section-servicios"
              >
                <span>Servicios</span>
                <i
                  className={cn(
                    "icon-[lucide--chevron-down] w-5 h-5 transition-transform",
                    openMobileSection === "servicios"
                      ? "rotate-180"
                      : "rotate-0"
                  )}
                />
              </button>
              {openMobileSection === "servicios" && (
                <div
                  id="mobile-section-servicios"
                  className="pb-4 px-8 space-y-2"
                >
                  <Link
                    href="/platform"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Plataforma EthicVoice
                  </Link>
                  <Link
                    href="/services"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Ver todos los servicios
                  </Link>
                  {serviceGroups.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/services?category=${g.slug}`}
                      className="block text-sm text-gray-700 hover:text-green-700 py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {g.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Seguridad */}
            <div>
              <button
                className="w-full flex items-center justify-between py-4 px-6 text-left font-semibold text-gray-900"
                onClick={() => toggleMobileSection("seguridad")}
                aria-controls="mobile-section-seguridad"
              >
                <span>Seguridad</span>
                <i
                  className={cn(
                    "icon-[lucide--chevron-down] w-5 h-5 transition-transform",
                    openMobileSection === "seguridad"
                      ? "rotate-180"
                      : "rotate-0"
                  )}
                />
              </button>
              {openMobileSection === "seguridad" && (
                <div
                  id="mobile-section-seguridad"
                  className="pb-4 px-8 space-y-2"
                >
                  <Link
                    href="/privacidad"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Privacidad y Seguridad
                  </Link>
                </div>
              )}
            </div>

            {/* Recursos */}
            <div>
              <button
                className="w-full flex items-center justify-between py-4 px-6 text-left font-semibold text-gray-900"
                onClick={() => toggleMobileSection("recursos")}
                aria-controls="mobile-section-recursos"
              >
                <span>Recursos</span>
                <i
                  className={cn(
                    "icon-[lucide--chevron-down] w-5 h-5 transition-transform",
                    openMobileSection === "recursos" ? "rotate-180" : "rotate-0"
                  )}
                />
              </button>
              {openMobileSection === "recursos" && (
                <div
                  id="mobile-section-recursos"
                  className="pb-4 px-8 space-y-2"
                >
                  <Link
                    href="/blog"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    href="/eventos"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Eventos
                  </Link>
                  <Link
                    href="/descargas"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Descargas
                  </Link>
                  <Link
                    href="/casos"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Casos de Estudio
                  </Link>
                  <Link
                    href="/podcasts"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Podcasts
                  </Link>
                  <Link
                    href="/webinars"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Webinars
                  </Link>
                </div>
              )}
            </div>

            {/* Nosotros */}
            <div>
              <button
                className="w-full flex items-center justify-between py-4 px-6 text-left font-semibold text-gray-900"
                onClick={() => toggleMobileSection("nosotros")}
                aria-controls="mobile-section-nosotros"
              >
                <span>Nosotros</span>
                <i
                  className={cn(
                    "icon-[lucide--chevron-down] w-5 h-5 transition-transform",
                    openMobileSection === "nosotros" ? "rotate-180" : "rotate-0"
                  )}
                />
              </button>
              {openMobileSection === "nosotros" && (
                <div
                  id="mobile-section-nosotros"
                  className="pb-4 px-8 space-y-2"
                >
                  <Link
                    href="/about"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Acerca de Nosotros
                  </Link>
                  <Link
                    href="/careers"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Únete a EthicVoice
                  </Link>
                  <Link
                    href="/noticias"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Noticias de la Empresa
                  </Link>
                </div>
              )}
            </div>

            {/* Planes */}
            <div>
              <button
                className="w-full flex items-center justify-between py-4 px-6 text-left font-semibold text-gray-900"
                onClick={() => toggleMobileSection("planes")}
                aria-controls="mobile-section-planes"
              >
                <span>Planes</span>
                <i
                  className={cn(
                    "icon-[lucide--chevron-down] w-5 h-5 transition-transform",
                    openMobileSection === "planes" ? "rotate-180" : "rotate-0"
                  )}
                />
              </button>
              {openMobileSection === "planes" && (
                <div id="mobile-section-planes" className="pb-4 px-8 space-y-2">
                  <Link
                    href="/pricing"
                    className="block text-sm text-gray-700 hover:text-green-700 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Ver planes
                  </Link>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t px-6 py-4 flex flex-col gap-3">
              <Link
                href="/auth/sign-in"
                className="text-green-700 font-medium text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <button
                type="button"
                onClick={openCalendlyPopup}
                className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800"
              >
                Solicitar demo
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
