"use client";

import { FormSubmission } from "@/types/reports";
import React, { useState } from "react";
import { useReport } from "../../hooks/useReport";
import { addReportNote } from "@/actions/reports.actions";
import { removeAssignmentFromReport } from "@/actions/report-assignments.actions";
import {
  calculateReportDeadline,
  formatDate,
  generateReportReference,
} from "../../utils/reports";
import {
  getPriorityLabel,
  getStatusLabel,
  getSeverityLabel,
} from "../../utils/dashboard.utils";
import { REPORT_PRIORITY, REPORT_STATUS } from "../../constants/reports";
import { ReportStatus } from "@prisma/client";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Chip,
  Divider,
  useDisclosure,
  User,
  Progress,
} from "@heroui/react";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { AssignMembersModal } from "../reports/AssignMembersModal";
import { ReportClosureComponent } from "./ReportClosureComponent";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { useSafeToast } from "../../hooks/useSafeToast";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { getDepartments } from "@/actions/department.actions";
import { updateReportMetadata } from "@/actions/reports.actions";
import { updateReportSubject } from "@/actions/reports.actions";

interface ReportSidebarProps {
  report: FormSubmission;
  reportId: number;
}

export const ReportSidebar: React.FC<ReportSidebarProps> = ({
  report,
  reportId,
}) => {
  const { updateStatus, updatePriority, updateProcessedAt } =
    useReport(reportId);
  const { currentOrganization } = useOrganization();
  const { permissions } = useUserRole();
  const { showSuccess, showError, showWarning } = useSafeToast();
  const { planInfo } = usePlanPermissions();

  const [departments, setDepartments] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [metaSaving, setMetaSaving] = React.useState(false);

  // Extract AI analysis helper (defined early so it can be used below)
  const extractAIAnalysis = () => {
    try {
      const content =
        typeof report.content === "string"
          ? JSON.parse(report.content)
          : report.content;

      return (
        report.metadata?.aiAnalysis ||
        content.aiAnalysis ||
        content.processed ||
        null
      );
    } catch {
      return null;
    }
  };

  React.useEffect(() => {
    (async () => {
      if (currentOrganization?.id) {
        try {
          const list = await getDepartments(currentOrganization.id);
          setDepartments(list.map((d) => ({ id: d.id, name: d.name })));
        } catch {
          /* noop */
        }
      }
    })();
  }, [currentOrganization?.id]);

  const hasAi =
    planInfo?.planType !== undefined && planInfo?.planType !== "STARTER"; // basic check
  const hasAiAnalysis = Boolean(extractAIAnalysis());

  const handleRunAi = async () => {
    try {
      setActionLoading("review", true);
      const content =
        typeof report.content === "string"
          ? report.content
          : JSON.stringify(report.content);
      const res = await fetch("/api/ai/process/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          source: "ETHIC_LINE",
          metadata: { submissionId: report.id },
        }),
      });
      if (!res.ok) throw new Error("AI process failed");
      showSuccess("Análisis de IA encolado. Se actualizará al finalizar.");
    } catch (e) {
      showError("No se pudo iniciar el análisis de IA");
    } finally {
      setActionLoading("review", false);
    }
  };

  const handleMetadataSave = async (updates: {
    type?: string | null;
    departmentId?: string | null;
  }) => {
    try {
      setMetaSaving(true);
      await updateReportMetadata(reportId, updates);
      showSuccess("Datos actualizados");
    } catch {
      showError("No se pudo actualizar");
    } finally {
      setMetaSaving(false);
    }
  };

  const [subjectSaving, setSubjectSaving] = React.useState(false);
  const [subject, setSubject] = React.useState(report.aiSummary || "");

  const handleSubjectSave = async () => {
    try {
      setSubjectSaving(true);
      await updateReportSubject(reportId, subject.trim());
      showSuccess("Asunto actualizado");
    } catch {
      showError("No se pudo actualizar el asunto");
    } finally {
      setSubjectSaving(false);
    }
  };

  // Modal controls
  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onOpenChange: onAssignOpenChange,
  } = useDisclosure();
  const {
    isOpen: isNotesOpen,
    onOpen: onNotesOpen,
    onOpenChange: onNotesOpenChange,
  } = useDisclosure();

  // Form states
  const [internalNotes, setInternalNotes] = useState(
    report.internalNotes || ""
  );
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Loading states
  const [loadingActions, setLoadingActions] = useState({
    review: false,
    notes: false,
    archive: false,
    close: false,
    status: false,
    priority: false,
  });

  const aiAnalysis = extractAIAnalysis();
  const requiresUrgentAction =
    aiAnalysis?.requiresUrgentAction ||
    report.metadata?.requiresUrgentAction ||
    false;

  const setActionLoading = (
    action: keyof typeof loadingActions,
    loading: boolean
  ) => {
    setLoadingActions((prev) => ({ ...prev, [action]: loading }));
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!permissions.canEditReports) {
      showError("No tienes permisos para cambiar el estado del reporte");
      return;
    }

    setActionLoading("status", true);
    try {
      if (newStatus === ReportStatus.CLOSED) {
        await updateProcessedAt();
      }
      await updateStatus(newStatus);

      showSuccess(
        `El estado del reporte se ha cambiado a ${getStatusLabel(
          newStatus as ReportStatus
        )}`
      );
    } catch {
      showError(
        "No se pudo cambiar el estado del reporte. Intenta nuevamente."
      );
    } finally {
      setActionLoading("status", false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!permissions.canEditReports) {
      showError("No tienes permisos para cambiar la prioridad del reporte");
      return;
    }

    setActionLoading("priority", true);
    try {
      await updatePriority(newPriority);

      showSuccess(
        `La prioridad del reporte se ha cambiado a ${getPriorityLabel(
          newPriority
        )}`
      );
    } catch {
      showError(
        "No se pudo cambiar la prioridad del reporte. Intenta nuevamente."
      );
    } finally {
      setActionLoading("priority", false);
    }
  };

  const handleRemoveAssignment = async (userId: string, userName: string) => {
    if (!permissions.canAssignReports) {
      showError("No tienes permisos para remover asignaciones");
      return;
    }

    if (!confirm(`¿Estás seguro de remover a ${userName} de este reporte?`)) {
      return;
    }

    setRemovingUserId(userId);
    try {
      await removeAssignmentFromReport(reportId, userId);
      showSuccess(`${userName} ha sido removido del reporte`);
      window.location.reload();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showError(error.message || "Error al remover investigador");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!permissions.canEditReports) {
      showError("No tienes permisos para agregar notas internas");
      return;
    }

    setActionLoading("notes", true);
    try {
      await addReportNote(reportId, internalNotes);
      onNotesOpenChange();

      showSuccess("Las notas internas se han guardado correctamente");
    } catch {
      showError("No se pudieron guardar las notas. Intenta nuevamente.");
    } finally {
      setActionLoading("notes", false);
    }
  };

  const handleQuickAction = async (action: "review" | "archive" | "close") => {
    if (!permissions.canEditReports) {
      showError("No tienes permisos para realizar esta acción");
      return;
    }

    setActionLoading(action, true);

    try {
      switch (action) {
        case "review":
          await updateStatus(REPORT_STATUS.IN_PROGRESS);
          showSuccess("El reporte ha sido marcado como en revisión");
          break;
        case "archive":
          await updateStatus(REPORT_STATUS.ARCHIVED);
          showSuccess("El reporte ha sido archivado correctamente");
          break;
        case "close":
          await updateProcessedAt();
          await updateStatus(REPORT_STATUS.CLOSED);
          showSuccess("El caso ha sido cerrado exitosamente");
          break;
      }
    } catch {
      showError("No se pudo completar la acción. Intenta nuevamente.");
    } finally {
      setActionLoading(action, false);
    }
  };

  const deadlineInfo = calculateReportDeadline(
    report.submittedAt,
    report.aiSeverity
  );
  const reportRef = generateReportReference(report.id);

  const handleReportStatusChange = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  const isArchived = report.status === "ARCHIVED";

  return (
    <div className="space-y-6">
      {/* Report Closure Component - Show first for better UX */}
      <ReportClosureComponent
        report={report}
        reportId={reportId}
        onStatusChange={handleReportStatusChange}
      />

      {/* AI Analysis - Always visible */}
      {aiAnalysis && (
        <Card className={requiresUrgentAction ? "border-red-500" : ""}>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <i className="icon-[lucide--brain] size-5 text-blue-600" />
              Análisis IA
              {requiresUrgentAction && (
                <Chip color="danger" size="sm">
                  Urgente
                </Chip>
              )}
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {aiAnalysis.severity && (
              <div>
                <p className="text-sm text-gray-600">Severidad detectada:</p>
                <Chip
                  color={
                    aiAnalysis.severity === "HIGH"
                      ? "danger"
                      : aiAnalysis.severity === "MEDIUM"
                        ? "warning"
                        : "success"
                  }
                  size="sm"
                >
                  {getSeverityLabel(aiAnalysis.severity)}
                </Chip>
              </div>
            )}

            {aiAnalysis.confidence && (
              <div>
                <p className="text-sm text-gray-600">Confianza del análisis:</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={aiAnalysis.confidence}
                    color={
                      aiAnalysis.confidence > 80
                        ? "success"
                        : aiAnalysis.confidence > 60
                          ? "warning"
                          : "danger"
                    }
                    size="sm"
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {aiAnalysis.confidence}%
                  </span>
                </div>
              </div>
            )}

            {aiAnalysis.summary && (
              <div>
                <p className="text-sm text-gray-600">Resumen:</p>
                <p className="text-sm text-gray-800">{aiAnalysis.summary}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Deadline - Always visible */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tiempo Límite</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Días restantes:</span>
              <Chip
                color={
                  deadlineInfo.isOverdue
                    ? "danger"
                    : deadlineInfo.daysRemaining <= 1
                      ? "warning"
                      : "success"
                }
                size="sm"
              >
                {deadlineInfo.isOverdue
                  ? `${Math.abs(deadlineInfo.daysRemaining)} días tarde`
                  : `${deadlineInfo.daysRemaining} días`}
              </Chip>
            </div>
            <Progress
              value={
                deadlineInfo.isOverdue
                  ? 100
                  : (deadlineInfo.daysRemaining / 8) * 100
              }
              color={
                deadlineInfo.isOverdue
                  ? "danger"
                  : deadlineInfo.daysRemaining <= 2
                    ? "warning"
                    : "primary"
              }
              size="sm"
            />
          </div>
        </CardBody>
      </Card>

      {/* Quick Actions - Role-based visibility */}
      {permissions.canEditReports && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {permissions.canAssignReports && (
              <Button
                color="primary"
                variant="solid"
                fullWidth
                onPress={onAssignOpen}
                startContent={
                  <i className="icon-[lucide--user-round-plus] size-4" />
                }
              >
                Asignar Investigadores
              </Button>
            )}

            <Button
              color="success"
              variant="solid"
              fullWidth
              onPress={() => handleQuickAction("review")}
              isDisabled={report.status === REPORT_STATUS.IN_PROGRESS}
              isLoading={loadingActions.review}
              startContent={
                !loadingActions.review && (
                  <i className="icon-[lucide--eye] size-4" />
                )
              }
            >
              Marcar como Revisado
            </Button>

            <Button
              color="warning"
              variant="solid"
              fullWidth
              onPress={onNotesOpen}
              isLoading={loadingActions.notes}
              startContent={
                !loadingActions.notes && (
                  <i className="icon-[lucide--message-square] size-4" />
                )
              }
            >
              Agregar Notas
            </Button>

            <Button
              color="default"
              variant="solid"
              fullWidth
              onPress={() => handleQuickAction("archive")}
              isDisabled={report.status === REPORT_STATUS.ARCHIVED}
              isLoading={loadingActions.archive}
              startContent={
                !loadingActions.archive && (
                  <i className="icon-[lucide--archive] size-4" />
                )
              }
            >
              Archivar
            </Button>

            <Button
              color="danger"
              variant="solid"
              fullWidth
              onPress={() => handleQuickAction("close")}
              isDisabled={report.status === REPORT_STATUS.CLOSED}
              isLoading={loadingActions.close}
              startContent={
                !loadingActions.close && (
                  <i className="icon-[lucide--x] size-4" />
                )
              }
            >
              Cerrar Caso
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Report Info - Always visible */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Información del Reporte</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Referencia:</p>
            <p className="font-mono font-medium">{reportRef}</p>
          </div>

          <Divider />

          <div>
            <p className="text-sm text-gray-600">Fecha de envío:</p>
            <p className="font-medium">{formatDate(report.submittedAt)}</p>
          </div>

          <Divider />

          <div>
            <p className="text-sm text-gray-600">Departamento:</p>
            <Chip variant="flat" size="sm">
              {report.department?.name || "Sin departamento"}
            </Chip>
          </div>

          <Divider />

          <div>
            <p className="text-sm text-gray-600">Fuente:</p>
            <Chip variant="flat" size="sm">
              {report.source === "ETHIC_LINE"
                ? "Línea Ética"
                : report.source === "EMAIL"
                  ? "Correo Electrónico"
                  : "Formulario Personalizado"}
            </Chip>
          </div>

          <Divider />

          <div>
            <p className="text-sm text-gray-600">Tipo:</p>
            <Chip
              variant="flat"
              size="sm"
              color={report.isAnonymous ? "secondary" : "primary"}
            >
              {report.isAnonymous ? "Anónimo" : "Identificado"}
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Case Management - Role-based visibility */}
      {permissions.canEditReports && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Gestión del Caso</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {isArchived ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      📁
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Reporte Archivado
                      </h3>
                      <p className="text-sm text-gray-600">
                        Este reporte ha sido descartado y archivado. No se
                        pueden realizar más cambios.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Select
                  label="Estado"
                  value={report.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  isLoading={loadingActions.status}
                  selectedKeys={[report.status]}
                  isDisabled={!permissions.canEditReports}
                >
                  {Object.values(REPORT_STATUS).map((status) => (
                    <SelectItem key={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </Select>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto / Resumen corto
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Escribe un asunto breve"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={handleSubjectSave}
                      isLoading={subjectSaving}
                    >
                      Guardar asunto
                    </Button>
                  </div>
                </div>

                <Select
                  label="Prioridad"
                  value={report.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  isLoading={loadingActions.priority}
                  selectedKeys={[report.priority]}
                  isDisabled={!permissions.canEditReports}
                >
                  {Object.values(REPORT_PRIORITY).map((priority) => (
                    <SelectItem key={priority}>
                      {getPriorityLabel(priority)}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Categoría / Tipo"
                  placeholder="Selecciona categoría"
                  selectedKeys={[report.type || ""]}
                  onChange={(e) =>
                    handleMetadataSave({ type: e.target.value || null })
                  }
                  isDisabled={!permissions.canEditReports}
                >
                  {[
                    { key: "", label: "Sin categorizar" },
                    { key: "corrupcion", label: "Corrupción" },
                    { key: "mal_uso_bienes", label: "Mal uso de bienes" },
                    { key: "robo_informacion", label: "Robo de información" },
                    { key: "mejora_procesos", label: "Mejora de procesos" },
                    { key: "fraude", label: "Fraude" },
                    { key: "adulteracion", label: "Adulteración" },
                    { key: "acoso", label: "Acoso" },
                    { key: "mal_desempeno", label: "Mal desempeño" },
                    { key: "reporte_libre", label: "Reporte libre" },
                  ].map((opt) => (
                    <SelectItem key={opt.key}>{opt.label}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Departamento"
                  placeholder="Asignar departamento"
                  selectedKeys={[report.departmentId || ""]}
                  onChange={(e) =>
                    handleMetadataSave({ departmentId: e.target.value || null })
                  }
                  isDisabled={!permissions.canEditReports}
                >
                  {[{ id: "", name: "Sin departamento" }, ...departments].map(
                    (d) => (
                      <SelectItem key={d.id}>{d.name}</SelectItem>
                    )
                  )}
                </Select>

                {hasAi && !hasAiAnalysis && (
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={handleRunAi}
                    isLoading={loadingActions.review}
                  >
                    <i className="icon-[lucide--sparkles] size-4 mr-1" />{" "}
                    Realizar análisis de IA
                  </Button>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Assigned Investigators - Role-based visibility */}
      {(permissions.canAssignReports || permissions.canViewAssignedReports) &&
        report.assignments &&
        report.assignments.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                Investigadores Asignados
              </h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {report.assignments.map(
                (assignment: {
                  id: string;
                  userId: string;
                  userName: string;
                  createdAt: string;
                }) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between"
                  >
                    <User
                      name={assignment.userName}
                      description={`Asignado el ${formatDate(assignment.createdAt)}`}
                      avatarProps={{
                        size: "sm",
                        showFallback: true,
                        name: assignment.userName,
                      }}
                    />
                    {permissions.canAssignReports && (
                      <Button
                        isIconOnly
                        color="danger"
                        variant="light"
                        size="sm"
                        onPress={() =>
                          handleRemoveAssignment(
                            assignment.userId,
                            assignment.userName
                          )
                        }
                        isLoading={removingUserId === assignment.userId}
                      >
                        <i className="icon-[lucide--x] size-4" />
                      </Button>
                    )}
                  </div>
                )
              )}
            </CardBody>
          </Card>
        )}

      {/* Internal Notes - Show if exists, regardless of permissions to add new ones */}
      {report.internalNotes && (
        <Card className="bg-warning-50">
          <CardHeader>
            <h3 className="text-lg font-semibold">Notas Internas</h3>
          </CardHeader>
          <CardBody>
            <p className="text-sm whitespace-pre-wrap">
              {report.internalNotes}
            </p>
          </CardBody>
        </Card>
      )}

      {/* No permissions message for members */}
      {!permissions.canEditReports && !permissions.canAssignReports && (
        <Card className="bg-blue-50">
          <CardBody className="text-center p-6">
            <i className="icon-[lucide--info] size-8 text-blue-600 mx-auto mb-3" />
            <p className="text-blue-800 font-medium">Vista de Solo Lectura</p>
            <p className="text-blue-600 text-sm mt-1">
              Puedes ver los detalles del reporte pero no realizar acciones de
              gestión. Para modificaciones, contacta a un administrador.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Modals */}
      {currentOrganization && permissions.canAssignReports && (
        <AssignMembersModal
          isOpen={isAssignOpen}
          onClose={() => onAssignOpenChange()}
          reportId={reportId}
          currentAssignments={report.assignments || []}
          onSuccess={() => {
            onAssignOpenChange();
            window.location.reload();
          }}
          organizationId={currentOrganization.id}
        />
      )}

      {permissions.canEditReports && (
        <Modal isOpen={isNotesOpen} onOpenChange={onNotesOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Notas Internas</ModalHeader>
                <ModalBody>
                  <Textarea
                    label="Agregar o editar notas"
                    placeholder="Escribe notas internas sobre el caso..."
                    value={internalNotes}
                    onValueChange={setInternalNotes}
                    minRows={6}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSaveNotes}
                    isLoading={loadingActions.notes}
                  >
                    Guardar
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};
