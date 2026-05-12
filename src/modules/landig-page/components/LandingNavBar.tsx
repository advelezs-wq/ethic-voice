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

          <nav className="hidden items-center gap-5 lg:flex">
            {sectionNavItems.slice(0, 4).map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => scrollToId(item.href)}
                className="inline-flex items-center gap-1 text-sm text-gray-700 transition-colors hover:text-black"
              >
                {item.label}
              </button>
            ))}

            <div className="group relative">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-gray-700 transition-colors hover:text-black"
              >
                Más
                <i className="icon-[lucide--chevron-down] h-4 w-4" aria-hidden />
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 mt-2 w-52 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => scrollToId("#faq")}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#051a24]"
                >
                  Preguntas frecuentes
                </button>
                {productLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#051a24]"
                  >
                    {item.label}
                  </Link>
                ))}
                {companyLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#051a24]"
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
              className="hidden text-sm text-gray-700 hover:text-black md:inline"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/submit"
              onClick={() =>
                trackGA4Event("landing_cta_click", {
                  cta_name: "header_report",
                  placement: "header",
                })
              }
              className="hidden rounded-full border-2 border-lime-600 bg-white px-4 py-2 text-sm font-semibold text-[#052b24] shadow-sm transition-colors hover:bg-lime-50 md:inline-flex"
            >
              Denunciar
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
              className="hidden rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-[#052b24] shadow-[0_1px_2px_0_rgba(5,26,36,0.1),0_4px_4px_0_rgba(5,26,36,0.09),inset_0_1px_0_0_rgba(255,255,255,0.35)] transition-colors hover:bg-lime-500 md:inline-flex"
            >
              Empezar gratis
            </button>
            <button
              type="button"
              className="inline-flex text-black md:hidden"
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
        <div className="fixed inset-0 z-[110] flex flex-col bg-white px-4 pb-8 pt-3 sm:px-6 md:hidden">
          <div className="mx-auto mb-6 flex w-full max-w-7xl items-center justify-between border-b border-slate-200/80 pb-3">
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
                className="h-9 w-auto object-contain"
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
          <nav className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-1 overflow-y-auto">
            {sectionNavItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  scrollToId(item.href);
                  setOpen(false);
                }}
                className="w-full rounded-lg py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-slate-50 hover:text-black"
              >
                {item.label}
              </button>
            ))}
            <div className="my-3 h-px w-full bg-slate-200" />
            {[...productLinks, ...companyLinks].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#051a24]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/80 pt-6">
              <Link
                href="/auth/sign-in"
                onClick={() => setOpen(false)}
                className="w-full rounded-lg py-2.5 text-center text-sm text-gray-700 transition-colors hover:text-black"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/submit"
                onClick={() => {
                  trackGA4Event("landing_cta_click", {
                    cta_name: "mobile_menu_report",
                    placement: "mobile_menu",
                  });
                  setOpen(false);
                }}
                className="w-full rounded-full border-2 border-lime-600 bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#052b24] shadow-sm transition-colors hover:bg-lime-50"
              >
                Denunciar
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
                className="w-full rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-[#052b24] shadow-[0_1px_2px_0_rgba(5,26,36,0.1),0_4px_4px_0_rgba(5,26,36,0.09),0_8px_12px_0_rgba(163,230,53,0.25),inset_0_1px_0_0_rgba(255,255,255,0.35)] transition-colors hover:bg-lime-500"
              >
                Empezar gratis
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
