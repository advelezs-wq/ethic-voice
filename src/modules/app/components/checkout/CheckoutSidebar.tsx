"use client";

import { useEffect, useState } from "react";

interface CheckoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    id: number;
    planName: string;
    price: number;
    currency: "USD" | "COP";
    returnUrl: string;
    /** Enlace de pago de Mercado Pago (init_point de la suscripción). */
    paymentUrl?: string;
  } | null;
}

/**
 * Checkout de suscripción. El cobro lo hace Mercado Pago: al abrir, se muestra
 * el resumen del plan y se redirige al enlace de pago. Si el backend no pudo
 * generar el enlace, se explica y se ofrece reintentar o escribir a soporte.
 */
export default function CheckoutSidebar({ isOpen, onClose, subscription }: CheckoutSidebarProps) {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !subscription?.paymentUrl) return;
    setRedirecting(true);
    // Pequeña pausa para que la persona vea a dónde va antes de salir del sitio.
    const t = window.setTimeout(() => {
      window.location.href = subscription.paymentUrl as string;
    }, 900);
    return () => window.clearTimeout(t);
  }, [isOpen, subscription?.paymentUrl]);

  if (!isOpen || !subscription) return null;

  const priceLabel = `${subscription.currency === "USD" ? "US$" : "COP$"} ${(subscription.price ?? 0).toLocaleString("es-CO")}`;

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-ev-night/50 backdrop-blur-sm" onClick={redirecting ? undefined : onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="fixed right-0 top-0 z-[111] flex h-full w-full max-w-md flex-col bg-white shadow-[0_0_60px_-20px_rgba(11,29,33,0.4)]"
      >
        <header className="flex items-center justify-between border-b border-ev-line px-6 py-5">
          <h2 id="checkout-title" className="text-lg font-semibold tracking-[-0.02em] text-ev-night">
            Completar suscripción
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={redirecting}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ev-mute hover:bg-ev-paper disabled:opacity-40"
            aria-label="Cerrar"
          >
            <i className="icon-[lucide--x] size-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="rounded-xl border border-ev-line bg-ev-paper p-5">
            <p className="ev-label text-ev-mute">Plan elegido</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ev-night">{subscription.planName}</p>
            <p className="mt-1 text-sm text-ev-mute">
              <span className="ev-num font-medium text-ev-night">{priceLabel}</span> por mes
            </p>
          </div>

          {subscription.paymentUrl ? (
            <div className="flex items-start gap-3 text-sm text-ev-mute">
              <span className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-ev-line border-t-ev-night" />
              <p>
                Te estamos llevando a <span className="font-medium text-ev-night">Mercado Pago</span> para
                registrar tu medio de pago de forma segura. Al terminar, volverás a EthicVoice.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#F0B2A6] bg-[#FCEEEB] p-4 text-sm text-[#862B1D]">
              <p className="font-medium">No pudimos generar el enlace de pago.</p>
              <p className="mt-1">
                Intenta de nuevo en unos minutos o escríbenos a{" "}
                <a href="mailto:support@ethicvoice.co" className="underline">
                  support@ethicvoice.co
                </a>
                .
              </p>
            </div>
          )}
        </div>

        <footer className="space-y-3 border-t border-ev-line p-6">
          {subscription.paymentUrl ? (
            <a
              href={subscription.paymentUrl}
              className="flex h-12 w-full items-center justify-center rounded-full bg-ev-night text-sm font-medium text-white hover:bg-ev-slate"
            >
              Ir a Mercado Pago ahora
            </a>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-full items-center justify-center rounded-full border border-ev-night/20 text-sm font-medium text-ev-night hover:border-ev-night/50"
            >
              Volver a los planes
            </button>
          )}
          <p className="flex items-center justify-center gap-1.5 text-xs text-ev-mute">
            <i className="icon-[lucide--lock] size-3.5" aria-hidden />
            Pagos procesados por Mercado Pago
          </p>
        </footer>
      </aside>
    </>
  );
}
