// modules/tracking/components/ReportStatus.tsx
"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { PublicReportData } from "@/actions/submission.actions";
import { PublicTimeline } from "./PublicTimeline";

interface ReportStatusProps {
  report: PublicReportData;
}

const getStatusInfo = (status: string) => {
  const statusMap: Record<
    string,
    {
      label: string;
      color: "primary" | "warning" | "success" | "default";
      progress: number;
      description: string;
    }
  > = {
    pending: {
      label: "Recibida",
      color: "primary",
      progress: 20,
      description:
        "Tu denuncia ha sido recibida y está en proceso de validación inicial.",
    },
    in_progress: {
      label: "En Investigación",
      color: "warning",
      progress: 70,
      description: "Estamos investigando activamente tu denuncia.",
    },
    resolved: {
      label: "Resuelta",
      color: "success",
      progress: 100,
      description: "La investigación ha sido completada exitosamente.",
    },
    closed: {
      label: "Cerrada",
      color: "default",
      progress: 100,
      description: "El caso ha sido cerrado.",
    },
    archived: {
      label: "Archivada",
      color: "default",
      progress: 100,
      description: "El caso ha sido descartado y archivado.",
    },
  };

  return statusMap[status] || statusMap.pending;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function ReportStatus({ report }: ReportStatusProps) {
  const statusInfo = getStatusInfo(report.status);

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader className="flex justify-between items-center pb-4">
          <h2 className="text-xl font-semibold">Estado de la Denuncia</h2>
          <Chip color="primary" variant="flat" size="sm">
            {report.id}
          </Chip>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{statusInfo.label}</span>
              <span className="text-sm text-gray-500">
                {statusInfo.progress}%
              </span>
            </div>
            <Progress
              value={statusInfo.progress}
              color={statusInfo.color}
              className="max-w-full"
            />
          </div>

          {/* Current Status */}
          <div className="flex items-start gap-4">
            <div
              className={`w-3 h-3 rounded-full bg-${statusInfo.color} mt-1`}
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{statusInfo.label}</p>
              <p className="text-sm text-gray-600 mt-1">
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* Key Information */}
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <i
                  className="icon-[lucide--calendar] size-4 text-gray-400 mt-0.5"
                  role="img"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Fecha de Envío
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(report.submissionDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <i
                  className="icon-[lucide--building] size-4 text-gray-400 mt-0.5"
                  role="img"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Empresa</p>
                  <p className="text-sm text-gray-600">
                    {report.organizationName}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <i
                  className="icon-[lucide--alert-triangle] size-4 text-gray-400 mt-0.5"
                  role="img"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Tipo de Irregularidad
                  </p>
                  <p className="text-sm text-gray-600">{report.type}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <i
                  className="icon-[lucide--clock] size-4 text-gray-400 mt-0.5"
                  role="img"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Última Actualización
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(report.lastUpdate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Last Update Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Última Actualización
            </p>
            <p className="text-sm text-gray-600">
              {formatDate(report.lastUpdate)} - {report.description}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Timeline */}
      <PublicTimeline activities={report.activities} />

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">¿Qué Sigue?</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {report.status === "pending" && (
              <p className="text-sm text-gray-600">
                Tu denuncia está siendo validada. Te notificaremos cuando
                comience la investigación formal.
              </p>
            )}
            {report.status === "in_progress" && (
              <p className="text-sm text-gray-600">
                Nuestro equipo está investigando activamente. Te mantendremos
                informado de cualquier desarrollo importante.
              </p>
            )}
            {report.status === "resolved" && (
              <p className="text-sm text-gray-600">
                La investigación ha sido completada. Gracias por tu contribución
                a mantener un ambiente de trabajo ético.
              </p>
            )}
            {report.status === "closed" && (
              <p className="text-sm text-gray-600">
                Este caso ha sido cerrado. Si tienes nuevas preocupaciones, no
                dudes en enviar una nueva denuncia.
              </p>
            )}
            {report.status === "archived" && (
              <p className="text-sm text-gray-600">
                Este caso ha sido archivado en nuestros registros.
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
