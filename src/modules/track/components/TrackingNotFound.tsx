"use client";

import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import Link from "next/link";

interface TrackingNotFoundProps {
  code: string;
}

export function TrackingNotFound({ code }: TrackingNotFoundProps) {
  return (
    <div className="space-y-6">
      {/* Not Found Message */}
      <Card className="border-red-200">
        <CardBody className="py-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <i
                className="icon-[lucide--search-x] size-8 text-red-600"
                role="img"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Código no encontrado
              </h3>
              <p className="text-gray-600">
                No pudimos encontrar una denuncia con el código:{" "}
                <span className="font-mono font-medium">{code}</span>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Possible Reasons */}
      <Card>
        <CardBody className="py-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i
              className="icon-[lucide--alert-triangle] size-4 text-orange-500"
              role="img"
              aria-hidden="true"
            />
            Posibles Causas
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                <strong>Denuncia reciente:</strong> Si acabas de enviar tu
                denuncia, puede tomar unos minutos aparecer en el sistema.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                <strong>Código expirado:</strong> Los códigos pueden tener una
                fecha de caducidad para proteger la confidencialidad.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardBody className="py-6">
            <div className="text-center space-y-3">
              <i
                className="icon-[lucide--mail] size-8 text-primary mx-auto"
                role="img"
                aria-hidden="true"
              />
              <h4 className="font-medium text-gray-900">
                ¿No tienes tu código?
              </h4>
              <p className="text-sm text-gray-600">
                Revisa tu email de confirmación o contacta con soporte.
              </p>
              <Button
                variant="bordered"
                size="sm"
                as="a"
                href="mailto:soporte@ethicvoice.co"
              >
                Contactar Soporte
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="py-6">
            <div className="text-center space-y-3">
              <i
                className="icon-[lucide--phone] size-8 text-primary mx-auto"
                role="img"
                aria-hidden="true"
              />
              <h4 className="font-medium text-gray-900">
                ¿Necesitas ayuda inmediata?
              </h4>
              <p className="text-sm text-gray-600">
                Llama a nuestra línea de atención confidencial.
              </p>
              <Button
                variant="bordered"
                size="sm"
                as="a"
                href={`tel:${process.env.NEXT_PUBLIC_WPP_NUMBER}`}
              >
                +57 (322) 414 63-80
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Submit New Report */}
      <Card className="bg-primary-50 border-primary-200">
        <CardBody className="py-6">
          <div className="text-center space-y-3">
            <h4 className="font-medium text-gray-900">
              ¿Quieres enviar una nueva denuncia?
            </h4>
            <p className="text-sm text-gray-600">
              Si tienes una nueva preocupación o irregularidad que reportar,
              puedes enviar una nueva denuncia.
            </p>
            <Button color="primary" as={Link} href="/submit">
              Enviar Nueva Denuncia
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
