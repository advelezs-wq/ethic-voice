"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCookieConsent } from "@/modules/core/providers/CookieConsentContext";

export function CookieConsentBanner() {
  const pathname = usePathname();
  const isAppArea = pathname === "/app" || pathname?.startsWith("/app/");

  const {
    needsInteraction,
    isPrimaryBannerVisible,
    showCookieSettingsModal,
    setShowCookieSettingsModal,
    consent,
    acceptAll,
    acceptEssentialOnly,
    openCookieSettings,
    withdrawToEssential,
  } = useCookieConsent();

  useEffect(() => {
    if (!isPrimaryBannerVisible) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [isPrimaryBannerVisible]);

  if (isAppArea) {
    return null;
  }

  if (!isPrimaryBannerVisible && consent && !needsInteraction) {
    return (
      <div className="pointer-events-none fixed bottom-6 left-6 z-[190] hidden sm:block">
        <button
          type="button"
          onClick={openCookieSettings}
          className="pointer-events-auto rounded-full border border-[#0a1f14]/15 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#0a1f14]/80 shadow-md backdrop-blur-sm transition hover:border-[#0a1f14]/25 hover:text-[#0a1f14] sm:text-xs"
        >
          Cookies
        </button>
      </div>
    );
  }

  if (!isPrimaryBannerVisible) return null;

  const revisiting = !needsInteraction && showCookieSettingsModal;

  return (
    <>
      <div
        className="fixed inset-0 z-[199] bg-[#0a1f14]/55 backdrop-blur-[2px]"
        aria-hidden
      />

      <div
        className="fixed inset-0 z-[200] flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-banner-title"
      >
        <div className="max-h-[min(92vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#0a1f14]/12 bg-[#faf9f6] p-5 shadow-2xl sm:rounded-3xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="cookie-banner-title"
              className="text-base font-bold tracking-tight text-[#0a1f14] sm:text-lg"
            >
              {revisiting
                ? "Tu configuración de cookies"
                : "Tu privacidad importa"}
            </h2>
            {revisiting && (
              <button
                type="button"
                onClick={() => setShowCookieSettingsModal(false)}
                className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-gray-200/80 hover:text-gray-800"
                aria-label="Cerrar sin cambios"
              >
                <span aria-hidden className="text-xl leading-none">
                  ×
                </span>
              </button>
            )}
          </div>

          <p className="mt-3 text-pretty text-xs leading-relaxed text-gray-700 sm:text-sm">
            {revisiting ? (
              <>
                Puedes ampliar o reducir el uso de cookies en cualquier momento.
                Las <strong>necesarias</strong> siguen activas para el
                funcionamiento del sitio. Las opcionales incluyen medición
                (analíticas) y publicidad, según lo permitas. Residentes en
                California pueden limitar la venta o compartición según CCPA/CPRA.
                Detalle en la{" "}
                <Link
                  href="/privacidad"
                  className="font-semibold text-[#0a1f14] underline decoration-lime-500/60 underline-offset-2 hover:decoration-lime-500"
                >
                  política de privacidad
                </Link>
                .
              </>
            ) : (
              <>
                Antes de continuar, elige si aceptas cookies opcionales: nos
                ayudan a medir el uso del sitio y a mejorar campañas (RGPD,
                ePrivacy). Las cookies necesarias ya están activas para seguridad
                y funcionamiento básico. Más información en la{" "}
                <Link
                  href="/privacidad"
                  className="font-semibold text-[#0a1f14] underline decoration-lime-500/60 underline-offset-2 hover:decoration-lime-500"
                >
                  política de privacidad
                </Link>
                .
              </>
            )}
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={acceptEssentialOnly}
              className="rounded-full border border-[#0a1f14]/20 px-4 py-2.5 text-sm font-semibold text-[#0a1f14] transition hover:bg-[#0a1f14]/5"
            >
              Solo necesarias
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-full bg-lime-400 px-5 py-2.5 text-sm font-bold text-[#0a1f14] shadow-[0_0_20px_rgba(163,230,53,0.35)] transition hover:bg-lime-300"
            >
              Aceptar todas
            </button>
          </div>

          {revisiting && (
            <button
              type="button"
              onClick={withdrawToEssential}
              className="mt-4 w-full text-center text-xs font-semibold text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-[#0a1f14] sm:text-sm"
            >
              Retirar consentimiento y dejar solo cookies necesarias
            </button>
          )}
        </div>
      </div>
    </>
  );
}
