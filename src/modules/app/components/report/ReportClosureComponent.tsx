"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { FormSubmission } from "@/types/reports";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DownloadPDFButton } from "../analytics/DownloadPDFButton";
import { updateReportStatus } from "@/actions/reports.actions";
import { getStatusLabel as getDashboardStatusLabel } from "../../utils/dashboard.utils";

interface ReportClosureComponentProps {
  report: FormSubmission;
  reportId: number;
  onStatusChange?: () => void;
}

export const ReportClosureComponent: React.FC<ReportClosureComponentProps> = ({
  report,
  reportId,
  onStatusChange,
}) => {
  const [closureSummary, setClosureSummary] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const {
    isOpen: isCloseModalOpen,
    onOpen: onCloseModalOpen,
    onOpenChange: onCloseModalOpenChange,
  } = useDisclosure();
  const {
    isOpen: isReopenModalOpen,
    onOpen: onReopenModalOpen,
    onOpenChange: onReopenModalOpenChange,
  } = useDisclosure();

  const isClosed = report.status === "CLOSED" || report.status === "RESOLVED";

  // Calculate case statistics
  const caseStats = {
    daysOpen: Math.floor(
      (Date.now() - new Date(report.submittedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    totalComments:
      (report as FormSubmission & { _count?: { comments: number } })._count
        ?.comments || 0,
    totalAttachments:
      (report as FormSubmission & { _count?: { attachments: number } })._count
        ?.attachments || 0,
    totalAssignments:
      (report as FormSubmission & { _count?: { assignments: number } })._count
        ?.assignments || 0,
  };

  const handleCloseCase = async () => {
    try {
      setIsClosing(true);

      // Update report status to closed
      await updateReportStatus(reportId, "CLOSED");

      // Add closure summary as internal note if provided
      if (closureSummary.trim()) {
        // This would need a specific action for closure summaries
        // await addClosureSummary(reportId, closureSummary);
      }

      onStatusChange?.();
      onCloseModalOpenChange();
    } catch (error) {
      console.error("Error closing case:", error);
      alert("Error al cerrar el caso. Por favor, intenta nuevamente.");
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopenCase = async () => {
    try {
      setIsReopening(true);

      await updateReportStatus(reportId, "IN_PROGRESS");

      onStatusChange?.();
      onReopenModalOpenChange();
    } catch (error) {
      console.error("Error reopening case:", error);
      alert("Error al reabrir el caso. Por favor, intenta nuevamente.");
    } finally {
      setIsReopening(false);
    }
  };

  if (!isClosed) {
    return (
      <>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-gray-900">
                Estado del Caso
              </h3>
              <Chip color="warning" variant="flat">
                Activo
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Días abierto</p>
                <p className="text-2xl font-bold text-orange-600">
                  {caseStats.daysOpen}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Estado</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getDashboardStatusLabel(report.status)}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                color="danger"
                variant="solid"
                onPress={onCloseModalOpen}
                startContent={
                  <i className="icon-[lucide--check-circle] size-4" />
                }
              >
                Cerrar Caso
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Close Case Modal */}
        <Modal
          isOpen={isCloseModalOpen}
          onOpenChange={onCloseModalOpenChange}
          size="2xl"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Cerrar Caso</ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <i className="icon-[lucide--alert-triangle] size-5 text-yellow-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-yellow-800">
                            ¿Estás seguro de cerrar este caso?
                          </h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Una vez cerrado, el chat se bloqueará y no se podrán
                            agregar más comentarios. Solo un administrador podrá
                            reabrir el caso.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {caseStats.daysOpen}
                        </p>
                        <p className="text-sm text-gray-600">Días abierto</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {caseStats.totalComments}
                        </p>
                        <p className="text-sm text-gray-600">Comentarios</p>
                      </div>
                    </div>

                    <Textarea
                      label="Resumen de cierre (opcional)"
                      placeholder="Proporciona un resumen de la resolución del caso, acciones tomadas, o cualquier información relevante..."
                      value={closureSummary}
                      onValueChange={setClosureSummary}
                      minRows={4}
                      maxRows={8}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleCloseCase}
                    isLoading={isClosing}
                  >
                    Cerrar Caso
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  // If case is closed, show closure summary
  return (
    <>
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold text-gray-900">
              Caso Cerrado
            </h3>
            <Chip color="success" variant="flat">
              Completado
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Case Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {caseStats.daysOpen}
              </p>
              <p className="text-gray-600">Días totales</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {caseStats.totalComments}
              </p>
              <p className="text-gray-600">Comentarios</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {caseStats.totalAttachments}
              </p>
              <p className="text-gray-600">Archivos</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {caseStats.totalAssignments}
              </p>
              <p className="text-gray-600">Asignaciones</p>
            </div>
          </div>

          {/* Closure Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="icon-[lucide--check-circle] size-5 text-green-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">
                  Caso completado exitosamente
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Fecha de cierre:{" "}
                  {format(
                    new Date(report.processedAt || report.updatedAt),
                    "dd/MM/yyyy HH:mm",
                    { locale: es }
                  )}
                </p>
                {report.internalNotes && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-gray-700">
                      Resumen de cierre:
                    </p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {report.internalNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="icon-[lucide--message-square-off] size-5 text-gray-500 mr-3" />
              <div>
                <p className="font-medium text-gray-700">Chat bloqueado</p>
                <p className="text-sm text-gray-600">
                  No se pueden agregar más comentarios a este caso cerrado.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <DownloadPDFButton
              reportType="report_case"
              data={{ ...report } as Record<string, unknown>}
              filename={`caso-REP-${String(report.id).padStart(6, "0")}-${format(new Date(), "yyyy-MM-dd", { locale: es })}`}
              buttonText="Descargar Resumen PDF"
              variant="solid"
              color="primary"
            />

            <Button
              color="warning"
              variant="bordered"
              onPress={onReopenModalOpen}
              startContent={<i className="icon-[lucide--rotate-ccw] size-4" />}
            >
              Reabrir Caso
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Reopen Case Modal */}
      <Modal isOpen={isReopenModalOpen} onOpenChange={onReopenModalOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Reabrir Caso</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <i className="icon-[lucide--alert-circle] size-5 text-orange-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-orange-800">
                          ¿Reabrir este caso?
                        </h4>
                        <p className="text-sm text-orange-700 mt-1">
                          El caso volverá a estar activo y se habilitarán
                          nuevamente los comentarios. Esta acción quedará
                          registrada en el historial.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="warning"
                  onPress={handleReopenCase}
                  isLoading={isReopening}
                >
                  Reabrir Caso
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
