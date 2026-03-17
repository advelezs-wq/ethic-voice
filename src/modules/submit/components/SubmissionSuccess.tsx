"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Snippet } from "@heroui/snippet";
import Link from "next/link";

interface SubmissionSuccessProps {
  trackingCode: string;
  isAnonymous: boolean;
}

export function SubmissionSuccess({
  trackingCode,
  isAnonymous,
}: SubmissionSuccessProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-20">
      <Card>
        <CardBody className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i
              className="icon-[lucide--check-circle] size-10 text-green-600"
              role="img"
              aria-hidden="true"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Reporte Enviado Exitosamente!
          </h2>

          <p className="text-gray-600 mb-8">
            Tu reporte ha sido recibido y será procesado de manera confidencial.
            {!isAnonymous && " Te enviaremos una confirmación por email."}
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">
              Tu Código de Seguimiento
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Guarda este código para dar seguimiento a tu denuncia:
            </p>

            <Snippet
              symbol=""
              variant="bordered"
              onCopy={handleCopy}
              className="text-lg font-mono"
            >
              {trackingCode}
            </Snippet>

            {copied && (
              <p className="text-sm text-green-600 mt-2">¡Código copiado!</p>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                <i
                  className="icon-[lucide--info] size-4"
                  role="img"
                  aria-hidden="true"
                />
                Importante
              </h4>
              <p className="text-sm text-blue-800">
                {isAnonymous ? (
                  <>
                    Como enviaste tu denuncia de forma anónima,{" "}
                    <strong>este código es la única forma</strong> de dar
                    seguimiento a tu caso. Asegúrate de guardarlo en un lugar
                    seguro.
                  </>
                ) : (
                  <>
                    También recibirás este código por email. Úsalo para
                    consultar el estado de tu denuncia en cualquier momento.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button color="primary" as={Link} href={`/track/${trackingCode}`}>
              Ver Estado del Reporte
            </Button>

            <Button variant="bordered" onPress={() => router.push("/")}>
              Volver al Inicio
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">¿Qué sigue?</h4>
            <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <i
                  className="icon-[lucide--check] size-4 text-green-600 mt-0.5 flex-shrink-0"
                  role="img"
                  aria-hidden="true"
                />
                <span>
                  Tu denuncia será revisada por nuestro equipo especializado
                </span>
              </li>
              <li className="flex items-start gap-2">
                <i
                  className="icon-[lucide--check] size-4 text-green-600 mt-0.5 flex-shrink-0"
                  role="img"
                  aria-hidden="true"
                />
                <span>Se asignará un investigador al caso si es necesario</span>
              </li>
              <li className="flex items-start gap-2">
                <i
                  className="icon-[lucide--check] size-4 text-green-600 mt-0.5 flex-shrink-0"
                  role="img"
                  aria-hidden="true"
                />
                <span>
                  Podrás consultar el progreso usando tu código de seguimiento
                </span>
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
