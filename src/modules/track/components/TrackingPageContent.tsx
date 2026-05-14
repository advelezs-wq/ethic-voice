"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PublicReportData } from "@/actions/submission.actions";
import { TrackingSearch } from "./TrackingSearch";
import { ReportStatus } from "./ReportStatus";
import { TrackingNotFound } from "./TrackingNotFound";
import { Card } from "@heroui/card";
import { Button } from "@heroui/react";

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
    <div className="container max-w-6xl mx-auto px-4 py-16 sm:py-20">
      <Button
        onPress={() => router.push("/")}
        variant="light"
        startContent={
          <i
            className="icon-[lucide--arrow-left] size-5 group-hover:-translate-x-1 transition-transform"
            role="img"
            aria-hidden="true"
          />
        }
        className="group mb-4"
      >
        Volver
      </Button>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10 rounded-3xl border border-[#0a1e14]/10 bg-white/85 p-6 text-center shadow-[0_20px_60px_-35px_rgba(10,30,20,0.4)]">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
            Seguimiento seguro
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Seguimiento de Denuncia
          </h1>
          <p className="text-lg text-gray-600">
            Ingresa tu código de referencia para consultar el estado de tu
            denuncia
          </p>
        </div>

        {/* Search Form */}
        <TrackingSearch
          onSearch={handleSearch}
          initialCode="" // Don't pass initialCode to allow free typing
          isLoading={pending}
        />

        {/* Results */}
        {hasSearched && (
          <div className="mt-8">
            {initialReport ? (
              <ReportStatus report={initialReport} />
            ) : (
              <TrackingNotFound code={searchedCode} />
            )}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-16 border border-emerald-100 bg-white/95 p-8 shadow-none">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            ¿Necesitas ayuda?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                ¿No tienes tu código de referencia?
              </h3>
              <p className="text-gray-600 text-sm">
                El código de referencia se genera automáticamente al enviar tu
                denuncia. Revisa el email de confirmación que recibiste.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                ¿Problemas para acceder?
              </h3>
              <p className="text-gray-600 text-sm">
                Si tienes problemas para acceder a tu caso, contacta con nuestro
                equipo de soporte especializado.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
