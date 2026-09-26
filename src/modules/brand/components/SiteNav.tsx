"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./primitives";
import { trackCta, useDemoCta } from "../hooks/useDemoCta";

export const NAV_LINKS = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/platform", label: "Plataforma" },
  { href: "/#seguridad", label: "Seguridad" },
  { href: "/pricing", label: "Precios" },
  { href: "/blog", label: "Recursos" },
] as const;

export const MOBILE_SECONDARY_LINKS = [
  { href: "/services", label: "Servicios" },
  { href: "/about", label: "Empresa" },
  { href: "/partners", label: "Partners" },
  { href: "/guia-canal-denuncias", label: "Guía gratuita" },
] as const;

/**
 * Navegación del sitio público. Dos capas:
 *  1. Franja de servicio (se va con el scroll): desvía a quien llega a
 *     denunciar — no es comprador y no debe perderse en la landing.
 *  2. Barra principal fija, material translúcido sobre papel.
 */
export function SiteNav({ hideUtility = false }: { hideUtility?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const demo = useDemoCta();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {!hideUtility && (
        <div className="relative z-[60] border-b border-ev-line/80 bg-ev-paper">
          <div className="mx-auto flex h-9 max-w-[var(--ev-max)] items-center justify-between gap-4 px-[var(--ev-gutter)]">
            <p className="ev-label hidden truncate text-ev-mute sm:block">
              Línea ética para organizaciones en Latinoamérica
            </p>
            <div className="ev-label flex w-full items-center justify-between gap-3 whitespace-nowrap text-[0.625rem] text-ev-mute sm:w-auto sm:justify-end sm:text-[0.6875rem]">
              <span className="hidden text-ev-haze min-[440px]:inline sm:hidden">¿Vienes a reportar?</span>
              <span className="flex items-center gap-3 sm:gap-4">
                <Link
                  href="/submit"
                  onClick={() => trackCta("utility_report", "utility_bar")}
                  className="text-ev-night underline decoration-ev-signal decoration-2 underline-offset-4 hover:decoration-ev-night"
                >
                  Hacer una denuncia
                </Link>
                <Link
                  href="/track"
                  onClick={() => trackCta("utility_track", "utility_bar")}
                  className="hover:text-ev-night"
                >
                  Seguir mi caso
                </Link>
              </span>
            </div>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? "border-b border-ev-line/70 bg-ev-paper/80 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-ev-paper"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[var(--ev-max)] items-center justify-between gap-6 px-[var(--ev-gutter)] lg:h-[4.5rem]">
          <Link href="/" className="shrink-0" aria-label="EthicVoice — inicio">
            <Logo markClassName="h-7 w-auto lg:h-8" />
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Principal"
          >
            {NAV_LINKS.map((item) => {
              const active =
                !item.href.includes("#") && pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 text-[0.9375rem] tracking-[-0.01em] transition-colors duration-200 ${
                    active
                      ? "bg-ev-night/[0.06] text-ev-night"
                      : "text-ev-ink/75 hover:text-ev-night"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/sign-in"
              className="hidden rounded-full px-3.5 py-2 text-[0.9375rem] text-ev-ink/75 transition-colors hover:text-ev-night lg:inline-flex"
            >
              Iniciar sesión
            </Link>
            <Button
              variant="ink"
              className="hidden sm:inline-flex"
              onClick={demo("header_demo", "header")}
            >
              Agendar demo
            </Button>
            <button
              type="button"
              className="ev-press -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={open}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                <path
                  d="M4 8h16M4 16h10"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil: hoja completa en tinta, tipografía grande. */}
      <div
        className={`fixed inset-0 z-[200] flex flex-col bg-ev-night text-white transition-[opacity,visibility] duration-300 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-[var(--ev-gutter)] pt-[env(safe-area-inset-top)]">
          <Link href="/" onClick={() => setOpen(false)} aria-label="Inicio">
            <Logo tone="dark" markClassName="h-7 w-auto" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ev-press -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Cerrar menú"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-[var(--ev-gutter)] pb-6 pt-6"
          aria-label="Móvil"
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((item, i) => (
              <li
                key={item.href}
                className="transition-[opacity,transform] duration-500 ease-ev-out"
                style={{
                  transitionDelay: open ? `${80 + i * 40}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "none" : "translateY(12px)",
                }}
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between border-b border-white/10 py-3.5 text-[2rem] font-medium leading-none tracking-[-0.04em]"
                >
                  {item.label}
                  <span className="ev-label text-white/35">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3">
            {MOBILE_SECONDARY_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-[0.9375rem] text-white/60 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/auth/sign-in"
                onClick={() => setOpen(false)}
                className="text-[0.9375rem] text-white/60 hover:text-white"
              >
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </nav>

        <div className="shrink-0 space-y-3 border-t border-white/10 px-[var(--ev-gutter)] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
          <Button
            variant="signal"
            size="lg"
            arrow
            className="w-full"
            onClick={(e) => {
              demo("mobile_menu_demo", "mobile_menu")(e);
              setOpen(false);
            }}
          >
            Agendar demo de 30 min
          </Button>
          <div className="flex justify-center gap-6 text-sm text-white/60">
            <Link href="/submit" onClick={() => setOpen(false)} className="hover:text-white">
              Hacer una denuncia
            </Link>
            <Link href="/track" onClick={() => setOpen(false)} className="hover:text-white">
              Seguir mi caso
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
