"use client";

import { Button, Image } from "@heroui/react";
import Link from "next/link";
import { useEffect } from "react";

export default function SubmitErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en formulario de denuncia:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
        {/* Logo de EthicVoice */}
        <div className="flex justify-center">
          <Image
            src="/brand/logo-nobg.png"
            alt="EthicVoice"
            width={120}
            height={120}
            className="object-contain"
          />
        </div>

        {/* Icono de error */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <i className="icon-[heroicons--exclamation-triangle] size-8 text-red-600" />
          </div>
        </div>

        {/* Mensaje de disculpa */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Ups! Algo salió mal
          </h1>
          <p className="text-gray-600 text-base">
            Lamentamos el inconveniente. No pudimos cargar el formulario de
            denuncia. Nuestro equipo ha sido notificado y estamos trabajando
            para resolver este problema.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            color="primary"
            size="lg"
            className="w-full font-semibold"
            onPress={reset}
          >
            Intentar nuevamente
          </Button>

          <Button
            as={Link}
            href="/submit"
            variant="bordered"
            size="lg"
            className="w-full font-semibold"
          >
            Volver a denuncias
          </Button>
        </div>

        {/* Información de contacto */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Si el problema persiste, por favor{" "}
            <a
              href="mailto:support@ethicvoice.co"
              className="text-primary hover:underline font-medium"
            >
              contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
