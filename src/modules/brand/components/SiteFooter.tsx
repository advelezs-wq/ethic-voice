"use client";

import Link from "next/link";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import { LogoMark } from "./Logo";

const COLUMNS = [
  {
    title: "Producto",
    links: [
      { href: "/platform", label: "Plataforma" },
      { href: "/pricing", label: "Precios" },
      { href: "/services", label: "Servicios" },
      { href: "/#seguridad", label: "Seguridad" },
      { href: "/auth/sign-in", label: "Iniciar sesión" },
    ],
  },
  {
    title: "Denunciantes",
    links: [
      { href: "/submit", label: "Hacer una denuncia" },
      { href: "/track", label: "Seguir mi caso" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/guia-canal-denuncias", label: "Guía gratuita" },
      { href: "/#faq", label: "Preguntas frecuentes" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/about", label: "Nosotros" },
      { href: "/partners", label: "Partners" },
      { href: "/careers", label: "Carreras" },
    ],
  },
] as const;

export function SiteFooter() {
  const cookie = useCookieConsentOptional();
  const year = new Date().getFullYear();

  return (
    <footer className="ev-grain ev-grain-dark relative overflow-hidden bg-ev-night text-white">
      <div className="mx-auto max-w-[var(--ev-max)] px-[var(--ev-gutter)] pt-20 lg:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_2fr]">
          <div className="max-w-sm">
            <LogoMark tone="dark" className="h-10 w-auto" />
            <p className="mt-6 text-[1.375rem] leading-snug tracking-[-0.025em] text-white/85">
              La línea ética que tu equipo{" "}
              <em className="ev-serif text-ev-signal">sí</em> se atreve a usar.
            </p>
            <dl className="ev-label mt-8 space-y-2 text-white/45">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0">Ventas</dt>
                <dd>
                  <a href="tel:+573224145120" className="text-white/75 hover:text-white">
                    +57 322 414 5120
                  </a>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0">Partners</dt>
                <dd>
                  <a
                    href="mailto:partners@ethicvoice.co"
                    className="normal-case text-white/75 hover:text-white"
                  >
                    partners@ethicvoice.co
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="ev-label text-white/40">{col.title}</p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-[0.9375rem] text-white/75 transition-colors hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="ev-label mt-20 flex flex-col gap-4 border-t border-white/10 py-6 text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} EthicVoice · Colombia · Latinoamérica</span>
          <span className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacidad" className="hover:text-white">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-white">
              Términos
            </Link>
            <Link href="/sitemap" className="hover:text-white">
              Mapa del sitio
            </Link>
            {cookie ? (
              <button
                type="button"
                onClick={() => cookie.openCookieSettings()}
                className="uppercase hover:text-white"
              >
                Cookies
              </button>
            ) : null}
          </span>
        </div>
      </div>

      {/* Wordmark monumental recortado por el borde inferior. */}
      <div
        className="pointer-events-none select-none px-[var(--ev-gutter)]"
        aria-hidden
      >
        <p className="mx-auto -mb-[0.2em] max-w-[var(--ev-max)] whitespace-nowrap font-wordmark text-[19.5vw] font-semibold leading-[0.8] tracking-[-0.06em] text-white/[0.06] xl:text-[17rem]">
          Ethic<span className="text-ev-signal/25">Voice</span>
        </p>
      </div>
    </footer>
  );
}
