"use client";

/**
 * Thank-you page de recursos descargables: confirma la descarga, dispara el
 * evento de medición y ofrece el archivo. Permite medir conversiones
 * (visita de landing → lead → descarga) por campaña.
 */

import Link from "next/link";
import { useEffect, useRef } from "react";
import { trackGA4Event } from "@/lib/google-analytics";

interface Props {
  slug: string;
  title: string;
  campaign: string;
  fileUrl: string;
}

export function ResourceThankYouClient({ slug, title, campaign, fileUrl }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackGA4Event("resource_download_thankyou", {
      resource_slug: slug,
      campaign,
    });
    // Inicia la descarga automáticamente tras un breve retraso
    const t = setTimeout(() => {
      try {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      } catch {}
    }, 900);
    return () => clearTimeout(t);
  }, [slug, campaign, fileUrl]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-slate-50 to-emerald-50/40 px-5 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <i
            className="icon-[lucide--check-circle] h-9 w-9 text-emerald-600"
            aria-hidden
          />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0d212c] sm:text-3xl">
          ¡Gracias! Tu descarga está lista
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Registramos tu solicitud de <strong>{title}</strong>. La descarga
          comenzará automáticamente; si no inicia, usa el botón de abajo.
        </p>

        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackGA4Event("resource_download_click", {
              resource_slug: slug,
              campaign,
            })
          }
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(5,150,105,0.6)] transition hover:brightness-105 active:scale-[0.99]"
        >
          <i className="icon-[lucide--download] h-4 w-4" aria-hidden />
          Descargar ahora
        </a>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">
            ¿Quieres ver cómo EthicVoice fortalece la ética de tu organización?
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            Conoce la plataforma
            <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
