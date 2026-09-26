"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/modules/brand/components/Logo";

/**
 * Acceso: pantalla dividida. A la izquierda, el panel de marca en tinta con
 * el isotipo monumental; a la derecha, el formulario de Clerk sobre papel.
 */
export function AuthPageChrome({ children }: { children: ReactNode }) {
  return (
    <div className="ev-site grid min-h-[100dvh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="ev-grain ev-grain-dark relative hidden overflow-hidden bg-ev-night p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" aria-label="EthicVoice — inicio">
          <Logo tone="dark" />
        </Link>
        <LogoMark
          tone="dark"
          className="pointer-events-none absolute -bottom-[26%] -right-[22%] h-auto w-[80%] opacity-[0.1]"
        />
        <div className="relative">
          <p className="ev-label text-white/45">Panel de cumplimiento</p>
          <p className="mt-6 max-w-md text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.045em]">
            Cada caso, trazable.{" "}
            <em className="ev-serif text-ev-signal">Cada voz,</em> protegida.
          </p>
        </div>
        <p className="ev-label relative text-white/35">
          Cifrado AES-256 · Permisos por rol · Auditoría completa
        </p>
      </aside>

      <div className="relative flex min-h-[100dvh] flex-col bg-ev-paper">
        <div className="flex items-center justify-between px-[var(--ev-gutter)] py-6">
          <Link href="/" className="lg:hidden" aria-label="EthicVoice — inicio">
            <Logo markClassName="h-7 w-auto" />
          </Link>
          <Link
            href="/"
            className="ev-label ml-auto text-ev-mute transition-colors hover:text-ev-night"
          >
            ← Volver al sitio
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
