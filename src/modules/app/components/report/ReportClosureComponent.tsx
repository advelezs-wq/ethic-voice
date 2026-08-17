"use client";

import React, { useRef, useState } from "react";
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
import { Select, SelectItem } from "@heroui/select";
import { FormSubmission } from "@/types/reports";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DownloadPDFButton } from "../analytics/DownloadPDFButton";
import {
  requestReportClosure,
  approveReportClosure,
  rejectReportClosure,
  reopenReportCase,
  uploadReportAttachment,
  type ClosureOutcome,
} from "@/actions/reports.actions";
import { getStatusLabel as getDashboardStatusLabel } from "../../utils/dashboard.utils";
import { formatFileSize } from "../../utils/reports";
import { useSafeToast } from "../../hooks/useSafeToast";
import { useUserRole } from "@/modules/core/hooks/useUserRole";

interface ReportClosureComponentProps {
  report: FormSubmission;
  reportId: number;
  onStatusChange?: () => void;
}

const OUTCOME_CONFIG: Record<
  ClosureOutcome,
  { label: string; color: "danger" | "warning" | "success" | "default" }
> = {
  SUBSTANTIATED: { label: "Fundamentada", color: "danger" },
  PARTIALLY_SUBSTANTIATED: {
    label: "Parcialmente fundamentada",
    color: "warning",
  },
  UNSUBSTANTIATED: { label: "No fundamentada", color: "success" },
  INCONCLUSIVE: { label: "Inconclusa", color: "default" },
};

export const ReportClosureComponent: React.FC<ReportClosureComponentProps> = ({
  report,
  reportId,
  onStatusChange,
}) => {
  const { showSuccess, showError } = useSafeToast();
  const { permissions } = useUserRole();
  const isAdmin = permissions.canManageOrganization;

  const [summary, setSummary] = useState(report.closureSummary || "");
  const [outcome, setOutcome] = useState<ClosureOutcome | "">(
    (report.closureOutcome as ClosureOutcome) || ""
  );
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const {
    isOpen: isRejectModalOpen,
    onOpen: onRejectModalOpen,
    onOpenChange: onRejectModalOpenChange,
  } = useDisclosure();

  const isClosed = report.status === "CLOSED" || report.status === "RESOLVED";
  const hasPendingRequest = Boolean(
    report.closureRequestedAt && !report.closureApprovedAt
  );

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
        ?.attachments ?? report.attachments?.length ?? 0,
    totalAssignments:
      (report as FormSubmission & { _count?: { assignments: number } })._count
        ?.assignments || 0,
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitClosure = async () => {
    if (!outcome) {
      showError("Selecciona el resultado de la investigación");
      return;
    }
    setIsSubmitting(true);
    try {
      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          await uploadReportAttachment(reportId, file);
        }
      }
      const { finalized } = await requestReportClosure(reportId, {
        summary,
        outcome,
      });
      showSuccess(
        finalized
          ? "Caso cerrado exitosamente"
          : "Solicitud de cierre enviada — un administrador debe aprobarla"
      );
      setEvidenceFiles([]);
      onStatusChange?.();
      onCloseModalOpenChange();
    } catch (e) {
      showError(
        e instanceof Error
          ? e.message
          : "Error al procesar el cierre. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setIsReviewing(true);
    try {
      await approveReportClosure(reportId);
      showSuccess("Cierre aprobado — el caso quedó cerrado");
      onStatusChange?.();
    } catch (e) {
      showError(e instanceof Error ? e.message : "No se pudo aprobar el cierre");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReject = async () => {
    setIsReviewing(true);
    try {
      await rejectReportClosure(reportId, rejectionReason);
      showSuccess("Solicitud de cierre rechazada");
      setRejectionReason("");
      onStatusChange?.();
      onRejectModalOpenChange();
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "No se pudo rechazar la solicitud"
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReopenCase = async () => {
    try {
      setIsReopening(true);
      await reopenReportCase(reportId);
      showSuccess("Caso reabierto exitosamente");
      onStatusChange?.();
      onReopenModalOpenChange();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error al reabrir el caso.");
    } finally {
      setIsReopening(false);
    }
  };

  const closureForm = (
    <div className="space-y-4">
      <Select
        label="Resultado de la investigación *"
        placeholder="Selecciona un resultado"
        selectedKeys={outcome ? [outcome] : []}
        onSelectionChange={(keys) =>
          setOutcome(Array.from(keys)[0] as ClosureOutcome)
        }
        isRequired
      >
        {(Object.keys(OUTCOME_CONFIG) as ClosureOutcome[]).map((key) => (
          <SelectItem key={key}>{OUTCOME_CONFIG[key].label}</SelectItem>
        ))}
      </Select>

      <Textarea
        label="Resumen de lo actuado *"
        placeholder="Describe qué se investigó, qué se encontró y qué acciones se tomaron..."
        value={summary}
        onValueChange={setSummary}
        minRows={4}
        maxRows={8}
        isRequired
      />

      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">
          Evidencia del cierre (opcional)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          size="sm"
          variant="flat"
          onPress={() => fileInputRef.current?.click()}
          startContent={<i className="icon-[lucide--paperclip] size-3.5" />}
        >
          Adjuntar archivos
        </Button>
        {evidenceFiles.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {evidenceFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between bg-emerald-50/40 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs"
              >
                <span className="truncate text-slate-600">{file.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <i className="icon-[lucide--x] size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Pending closure request: reviewer (admin) or requester waiting ──
  if (hasPendingRequest && !isClosed) {
    const requestedDate = report.closureRequestedAt
      ? format(new Date(report.closureRequestedAt), "dd/MM/yyyy HH:mm", {
          locale: es,
        })
      : "";

    return (
      <>
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-[#0d212c]">
                Solicitud de Cierre
              </h3>
              <Chip color="primary" variant="flat">
                Pendiente de aprobación
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-slate-500">
              <strong>{report.closureRequestedByName}</strong> solicitó cerrar
              este caso el {requestedDate}.
            </p>

            {report.closureOutcome && (
              <Chip
                color={OUTCOME_CONFIG[report.closureOutcome].color}
                variant="flat"
              >
                {OUTCOME_CONFIG[report.closureOutcome].label}
              </Chip>
            )}

            {report.closureSummary && (
              <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100">
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Resumen de lo actuado
                </p>
                <p className="text-sm text-slate-500 whitespace-pre-wrap">
                  {report.closureSummary}
                </p>
              </div>
            )}

            {report.attachments && report.attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Archivos del caso ({report.attachments.length})
                </p>
                <div className="space-y-1.5">
                  {report.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-sky-700 hover:underline"
                    >
                      <i className="icon-[lucide--paperclip] size-3.5 shrink-0" />
                      <span className="truncate">{att.filename}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {isAdmin ? (
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  color="success"
                  onPress={handleApprove}
                  isLoading={isReviewing}
                  startContent={
                    !isReviewing && (
                      <i className="icon-[lucide--check-circle] size-4" />
                    )
                  }
                >
                  Aprobar y Cerrar
                </Button>
                <Button
                  color="danger"
                  variant="bordered"
                  onPress={onRejectModalOpen}
                  isDisabled={isReviewing}
                >
                  Rechazar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl p-3.5">
                <i className="icon-[lucide--clock] size-5 text-sky-500 shrink-0" />
                <p className="text-sm text-sky-700">
                  Un administrador debe revisar y aprobar el cierre antes de
                  que el caso quede cerrado.
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Modal
          isOpen={isRejectModalOpen}
          onOpenChange={onRejectModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Rechazar solicitud de cierre</ModalHeader>
                <ModalBody>
                  <Textarea
                    label="Motivo (opcional)"
                    placeholder="Explica qué falta o por qué se rechaza..."
                    value={rejectionReason}
                    onValueChange={setRejectionReason}
                    minRows={3}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleReject}
                    isLoading={isReviewing}
                  >
                    Rechazar solicitud
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  // ── Active case, no pending request ──
  if (!isClosed) {
    return (
      <>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-[#0d212c]">
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
                <p className="font-medium text-slate-500">Días abierto</p>
                <p className="text-2xl font-bold text-orange-600">
                  {caseStats.daysOpen}
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-500">Estado</p>
                <p className="text-lg font-semibold text-[#0d212c]">
                  {getDashboardStatusLabel(report.status)}
                </p>
              </div>
            </div>

            {report.closureRejectionReason && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
                <i className="icon-[lucide--x-circle] size-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    La última solicitud de cierre fue rechazada
                  </p>
                  <p className="text-sm text-red-600 mt-0.5">
                    {report.closureRejectionReason}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                color="danger"
                variant="solid"
                onPress={onCloseModalOpen}
                startContent={
                  <i className="icon-[lucide--check-circle] size-4" />
                }
              >
                {isAdmin ? "Cerrar Caso" : "Solicitar Cierre"}
              </Button>
              {!isAdmin && (
                <p className="text-xs text-slate-400 mt-2">
                  Un administrador deberá aprobar el cierre antes de que el
                  caso quede cerrado.
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        <Modal
          isOpen={isCloseModalOpen}
          onOpenChange={onCloseModalOpenChange}
          size="2xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  {isAdmin ? "Cerrar Caso" : "Solicitar Cierre del Caso"}
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <i className="icon-[lucide--alert-triangle] size-5 text-yellow-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-yellow-800">
                            {isAdmin
                              ? "¿Estás seguro de cerrar este caso?"
                              : "Esta solicitud requiere aprobación"}
                          </h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            {isAdmin
                              ? "Una vez cerrado, el chat se bloqueará y no se podrán agregar más comentarios. Solo un administrador podrá reabrir el caso."
                              : "Un administrador revisará el resumen y la evidencia antes de que el caso quede cerrado definitivamente."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {closureForm}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleSubmitClosure}
                    isLoading={isSubmitting}
                  >
                    {isAdmin ? "Cerrar Caso" : "Enviar Solicitud"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  // ── Closed ──
  return (
    <>
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold text-[#0d212c]">
              Caso Cerrado
            </h3>
            <Chip color="success" variant="flat">
              Completado
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-emerald-50/40 rounded-lg">
              <p className="text-2xl font-bold text-[#0d212c]">
                {caseStats.daysOpen}
              </p>
              <p className="text-slate-500">Días totales</p>
            </div>
            <div className="text-center p-3 bg-sky-50 rounded-lg">
              <p className="text-2xl font-bold text-sky-700">
                {caseStats.totalComments}
              </p>
              <p className="text-slate-500">Comentarios</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {caseStats.totalAttachments}
              </p>
              <p className="text-slate-500">Archivos</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {caseStats.totalAssignments}
              </p>
              <p className="text-slate-500">Asignaciones</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="icon-[lucide--check-circle] size-5 text-green-600 mt-0.5 mr-3" />
              <div className="flex-1 space-y-2">
                <h4 className="font-medium text-green-800">
                  Caso completado exitosamente
                </h4>
                <p className="text-sm text-green-700">
                  Fecha de cierre:{" "}
                  {format(
                    new Date(
                      report.closureApprovedAt ||
                        report.processedAt ||
                        report.updatedAt
                    ),
                    "dd/MM/yyyy HH:mm",
                    { locale: es }
                  )}
                  {report.closureApprovedByName &&
                    ` · Aprobado por ${report.closureApprovedByName}`}
                </p>

                {report.closureOutcome && (
                  <Chip
                    size="sm"
                    color={OUTCOME_CONFIG[report.closureOutcome].color}
                    variant="flat"
                  >
                    {OUTCOME_CONFIG[report.closureOutcome].label}
                  </Chip>
                )}

                {(report.closureSummary || report.internalNotes) && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-slate-600">
                      Resumen de cierre:
                    </p>
                    <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">
                      {report.closureSummary || report.internalNotes}
                    </p>
                  </div>
                )}

                {report.attachments && report.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {report.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-sky-700 hover:underline"
                      >
                        <i className="icon-[lucide--paperclip] size-3.5 shrink-0" />
                        <span className="truncate">{att.filename}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-4">
            <div className="flex items-center">
              <i className="icon-[lucide--message-square-off] size-5 text-slate-400 mr-3" />
              <div>
                <p className="font-medium text-slate-600">Chat bloqueado</p>
                <p className="text-sm text-slate-500">
                  No se pueden agregar más comentarios a este caso cerrado.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <DownloadPDFButton
              reportType="report_case"
              data={{ ...report } as Record<string, unknown>}
              filename={`caso-REP-${String(report.id).padStart(6, "0")}-${format(new Date(), "yyyy-MM-dd", { locale: es })}`}
              buttonText="Descargar Resumen PDF"
              variant="solid"
              color="primary"
            />

            {isAdmin && (
              <Button
                color="warning"
                variant="bordered"
                onPress={onReopenModalOpen}
                startContent={
                  <i className="icon-[lucide--rotate-ccw] size-4" />
                }
              >
                Reabrir Caso
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

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
