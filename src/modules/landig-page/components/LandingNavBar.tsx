"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { trackGA4Event } from "@/lib/google-analytics";
import {
  sectionNavItems,
  productLinks,
  companyLinks,
  blogNavItem,
} from "@/modules/landig-page/components/landingNavConfig";

export function scrollToId(idOrHash: string) {
  const id = idOrHash.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector("header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const extraOffset = 14;
  const targetTop =
    el.getBoundingClientRect().top + window.scrollY - headerHeight - extraOffset;
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
}

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const { openCalendly } = useCalendlyGate();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className="animate-fade-in-up fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] backdrop-blur-md sm:px-6 sm:pb-4 sm:pt-[calc(1rem+env(safe-area-inset-top,0px))]"
        style={{ animationDelay: "0.1s", opacity: 0 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/brand/logo-nobg.png"
              alt="EthicVoice"
              width={170}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
            {sectionNavItems.slice(0, 4).map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => scrollToId(item.href)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 hover:text-[#0a1e14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500/60"
              >
                {item.label}
              </button>
            ))}

            <Link
              href={blogNavItem.href}
              className="ml-1.5 rounded-full bg-lime-400 px-3.5 py-2 text-sm font-semibold text-[#0a1e14] shadow-sm ring-1 ring-lime-500/30 transition hover:bg-lime-300 hover:ring-lime-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600"
            >
              {blogNavItem.label}
            </Link>

            <div className="group relative ml-2 border-l border-slate-200/90 pl-2.5">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 hover:text-[#0a1e14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500/60"
              >
                Más
                <i className="icon-[lucide--chevron-down] h-4 w-4 opacity-70" aria-hidden />
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 mt-2 w-56 min-w-[14rem] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-xl ring-1 ring-slate-900/5 transition-all group-hover:visible group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => scrollToId("#faq")}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-[#0a1e14]"
                >
                  Preguntas frecuentes
                </button>
                {productLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-[#0a1e14]"
                  >
                    {item.label}
                  </Link>
                ))}
                {companyLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-[#0a1e14]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/sign-in"
              className="hidden text-sm text-gray-700 hover:text-black lg:inline"
            >
              Iniciar sesión
            </Link>
            <button
              type="button"
              onClick={(e) => {
                trackGA4Event("landing_cta_click", {
                  cta_name: "header_demo",
                  placement: "header",
                });
                openCalendly(e);
              }}
              className="hidden rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-[#052b24] shadow-[0_1px_2px_0_rgba(5,26,36,0.1),0_4px_4px_0_rgba(5,26,36,0.09),inset_0_1px_0_0_rgba(255,255,255,0.35)] transition-colors hover:bg-lime-500 lg:inline-flex"
            >
              Empezar gratis
            </button>
            <button
              type="button"
              className="inline-flex text-black lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
            >
              {open ? (
                <i className="icon-[lucide--x] h-6 w-6" aria-hidden />
              ) : (
                <i className="icon-[lucide--menu] h-6 w-6" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[195] flex max-h-[100dvh] flex-col bg-white lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between border-b border-slate-200/80 px-4 pb-2.5 pt-3 sm:px-6">
            <Link
              href="/"
              className="inline-flex items-center"
              onClick={() => setOpen(false)}
            >
              <Image
                src="/brand/logo-nobg.png"
                alt="EthicVoice"
                width={170}
                height={40}
                className="h-8 w-auto object-contain sm:h-9"
              />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <i className="icon-[lucide--x] h-6 w-6 text-black" aria-hidden />
            </button>
          </div>

          <nav
            className="mx-auto min-h-0 w-full max-w-7xl flex-1 overflow-y-auto overscroll-y-contain px-4 pb-2 pt-1 sm:px-6"
            aria-label="Móvil"
          >
            <p className="px-1 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              En esta página
            </p>
            <div className="flex flex-col gap-0.5">
              {sectionNavItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    scrollToId(item.href);
                    setOpen(false);
                  }}
                  className="w-full rounded-md py-2 pl-1 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 active:bg-slate-100"
                >
                  {item.label}
                </button>
              ))}
              <Link
                href={blogNavItem.href}
                onClick={() => setOpen(false)}
                className="block w-full rounded-md py-2 pl-1 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 hover:text-[#0a1e14] active:bg-slate-100"
              >
                {blogNavItem.label}
              </Link>
            </div>

            <p className="mt-3 border-t border-slate-200/90 px-1 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Sitio
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pb-2 sm:gap-x-4">
              {[...productLinks, ...companyLinks].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md py-1.5 pl-1 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#0a1e14] sm:text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="mx-auto w-full max-w-7xl shrink-0 border-t border-slate-200/90 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-6">
            <Link
              href="/auth/sign-in"
              onClick={() => setOpen(false)}
              className="mb-2 block w-full rounded-lg py-2 text-center text-sm font-medium text-slate-700 transition-colors hover:text-black"
            >
              Iniciar sesión
            </Link>
            <button
              type="button"
              onClick={(e) => {
                trackGA4Event("landing_cta_click", {
                  cta_name: "mobile_menu_demo",
                  placement: "mobile_menu",
                });
                openCalendly(e);
                setOpen(false);
              }}
              className="w-full rounded-full bg-lime-400 px-5 py-3 text-sm font-semibold text-[#052b24] shadow-[0_1px_2px_0_rgba(5,26,36,0.1),0_4px_4px_0_rgba(5,26,36,0.09),0_8px_12px_0_rgba(163,230,53,0.25),inset_0_1px_0_0_rgba(255,255,255,0.35)] transition-colors hover:bg-lime-500"
            >
              Empezar gratis
            </button>
          </div>
        </div>
      )}
    </>
  );
}
