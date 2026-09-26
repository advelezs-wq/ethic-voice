"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PublicReportData } from "@/actions/submission.actions";
import { TrackingSearch } from "./TrackingSearch";
import { ReportStatus } from "./ReportStatus";
import { TrackingNotFound } from "./TrackingNotFound";

interface TrackingPageContentProps {
  initialCode?: string;
  initialReport?: PublicReportData | null;
}

export function TrackingPageContent({
  initialCode = "",
  initialReport = null,
}: TrackingPageContentProps) {
  const router = useRouter();
  const [searchedCode, setSearchedCode] = useState<string>(initialCode);
  const [hasSearched, setHasSearched] = useState(!!initialCode);
  const [pending, startTransition] = useTransition();

  // Reset hasSearched when initialCode changes (when navigating to different URLs)
  useEffect(() => {
    setSearchedCode(initialCode);
    setHasSearched(!!initialCode);
  }, [initialCode]);

  const handleSearch = (trackingCode: string) => {
    setSearchedCode(trackingCode);
    setHasSearched(true);

    startTransition(() => {
      router.push(`/track/${trackingCode}`);
    });
  };

  return (
    <div className="mx-auto w-full max-w-[var(--ev-max)] px-[var(--ev-gutter)] pb-24 pt-10 sm:pt-14">
      <div className="ev-label flex items-center justify-between border-b border-ev-line pb-4 text-ev-mute">
        <button type="button" onClick={() => router.push("/")} className="transition-colors hover:text-ev-night">
          ← Inicio
        </button>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-ev-signal" /> Consulta privada
        </span>
      </div>

      <div className="mt-12 grid gap-14 sm:mt-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <p className="ev-label text-ev-moss">Seguimiento seguro</p>
          <h1 className="ev-display mt-6 text-ev-night">
            Sigue tu caso <em className="ev-serif pr-[0.06em]">sin exponerte.</em>
          </h1>
          <p className="ev-lead mt-6 max-w-md">
            Ingresa el código que recibiste al enviar tu denuncia para ver su
            estado y conversar con el equipo responsable.
          </p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <TrackingSearch
            onSearch={handleSearch}
            initialCode="" // Don't pass initialCode to allow free typing
            isLoading={pending}
          />
        </div>
      </div>

      {hasSearched && (
        <div className="mt-16">
          {initialReport ? (
            <ReportStatus report={initialReport} />
          ) : (
            <TrackingNotFound code={searchedCode} />
          )}
        </div>
      )}

      <dl className="mt-24 grid gap-x-8 border-t border-ev-night md:grid-cols-2">
        <div className="border-b border-ev-line py-7">
          <dt className="text-[1.1875rem] font-medium tracking-[-0.02em] text-ev-night">
            ¿No tienes tu código de referencia?
          </dt>
          <dd className="mt-2 text-[0.975rem] leading-relaxed text-ev-mute">
            Se genera automáticamente al enviar tu denuncia. Revisa la pantalla
            de confirmación o el correo que recibiste.
          </dd>
        </div>
        <div className="border-b border-ev-line py-7">
          <dt className="text-[1.1875rem] font-medium tracking-[-0.02em] text-ev-night">
            ¿Problemas para acceder?
          </dt>
          <dd className="mt-2 text-[0.975rem] leading-relaxed text-ev-mute">
            Contacta al equipo de soporte; nunca te pediremos datos que revelen
            tu identidad.
          </dd>
        </div>
      </dl>
    </div>
  );
}
