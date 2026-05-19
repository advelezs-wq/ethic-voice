"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FooterDemoCtaBand } from "@/modules/landig-page/components/FooterDemoCtaBand";

const NAV_LINKS = [
  { label: "Servicios", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Empresa", href: "/about" },
  { label: "Soporte", href: "mailto:soporte@ethicvoice.com" },
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terms" },
  { label: "Sitemap", href: "/sitemap" },
  { label: "Sitemap XML", href: "/sitemap.xml" },
] as const;

export const FooterCTA = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <FooterDemoCtaBand ctaName="footer_demo" placement="marketing_footer" />

      <div className="border-t border-slate-200 bg-white pt-10 pb-[max(11.5rem,calc(9.5rem+env(safe-area-inset-bottom,0px)))] sm:pb-36 md:pb-32 lg:pb-28">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-5 md:px-8">
          <Link
            href="/"
            className="inline-flex shrink-0 opacity-90 transition-opacity hover:opacity-100"
          >
            <Image
              src="/brand/logo-nobg.png"
              alt="EthicVoice"
              width={160}
              height={38}
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600"
            aria-label="Pie de página"
          >
            {NAV_LINKS.map((l) =>
              l.href.startsWith("mailto:") ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="transition-colors hover:text-lime-700"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  className="transition-colors hover:text-lime-700"
                >
                  {l.label}
                </Link>
              ),
            )}
          </nav>

          <p className="text-center text-xs text-slate-500">
            Copyright © {new Date().getFullYear()} EthicVoice
          </p>
        </div>
      </div>
    </footer>
  );
};
