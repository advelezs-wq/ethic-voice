"use client";

import { FormSubmission } from "@/types/reports";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "../../hooks/useReport";
import { addReportNote } from "@/actions/reports.actions";
import { removeAssignmentFromReport } from "@/actions/report-assignments.actions";
import {
  calculateReportDeadline,
  formatDate,
  generateReportReference,
  getSourceLabel,
} from "../../utils/reports";
import {
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getSeverityLabel,
  getSeverityColor,
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
  Tooltip,
} from "@heroui/react";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { AssignMembersModal } from "../reports/AssignMembersModal";
import { ReportClosureComponent } from "./ReportClosureComponent";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { useSafeToast } from "../../hooks/useSafeToast";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { getDepartments } from "@/actions/department.actions";
import {
  updateReportMetadata,
  updateReportSubject,
} from "@/actions/reports.actions";
import { DownloadPDFButton } from "../analytics/DownloadPDFButton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReportSidebarProps {
  report: FormSubmission;
  reportId: number;
}

/* ─────────── helpers ─────────── */
function SidebarSection({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/95 shadow-none">
      <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <i className={`${icon} size-4 text-emerald-700`} />
          <span className="text-sm font-semibold text-[#0d212c]">{title}</span>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right">
        {value}
      </span>
    </div>
  );
}

/* ─────────── main component ─────────── */
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
  const router = useRouter();

  const [departments, setDepartments] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [metaSaving, setMetaSaving] = React.useState(false);
  const [subjectSaving, setSubjectSaving] = React.useState(false);
  const [subject, setSubject] = React.useState(report.aiSummary || "");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState(
    report.internalNotes || ""
  );
  const [statusLoading, setStatusLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  React.useEffect(() => {
    if (!currentOrganization?.id) return;
    getDepartments(currentOrganization.id)
      .then((list) =>
        setDepartments(list.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })))
      )
      .catch(() => {});
  }, [currentOrganization?.id]);

  /* modals */
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onOpenChange: onAssignOpenChange } = useDisclosure();
  const { isOpen: isNotesOpen, onOpen: onNotesOpen, onOpenChange: onNotesOpenChange } = useDisclosure();

  /* derived */
  const isClosed = report.status === "CLOSED" || report.status === "RESOLVED";
  const isArchived = report.status === "ARCHIVED";
  const canManage = permissions.canEditReports && !isClosed && !isArchived;
  const hasAi = planInfo?.planType && planInfo.planType !== "STARTER";

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
  const aiAnalysis = extractAIAnalysis();
  const hasAiAnalysis = Boolean(aiAnalysis || report.aiSummary);

  const deadlineInfo = calculateReportDeadline(
    report.submittedAt,
    report.aiSeverity
  );
  const reportRef = generateReportReference(report.id);

  /* handlers */
  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      if (newStatus === ReportStatus.CLOSED) await updateProcessedAt();
      await updateStatus(newStatus);
      showSuccess(`Estado cambiado a ${getStatusLabel(newStatus as ReportStatus)}`);
      router.refresh();
    } catch {
      showError("No se pudo cambiar el estado");
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setPriorityLoading(true);
    try {
      await updatePriority(newPriority);
      showSuccess(`Prioridad cambiada a ${getPriorityLabel(newPriority)}`);
      router.refresh();
    } catch {
      showError("No se pudo cambiar la prioridad");
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleMetadataSave = async (updates: {
    type?: string | null;
    departmentId?: string | null;
  }) => {
    setMetaSaving(true);
    try {
      await updateReportMetadata(reportId, updates);
      showSuccess("Datos actualizados");
      router.refresh();
    } catch {
      showError("No se pudo actualizar");
    } finally {
      setMetaSaving(false);
    }
  };

  const handleSubjectSave = async () => {
    setSubjectSaving(true);
    try {
      await updateReportSubject(reportId, subject.trim());
      showSuccess("Asunto actualizado");
      router.refresh();
    } catch {
      showError("No se pudo actualizar el asunto");
    } finally {
      setSubjectSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await addReportNote(reportId, internalNotes);
      showSuccess("Notas guardadas");
      onNotesOpenChange();
      router.refresh();
    } catch {
      showError("No se pudieron guardar las notas");
    }
  };

  const handleRemoveAssignment = async (userId: string, userName: string) => {
    setRemovingUserId(userId);
    try {
      await removeAssignmentFromReport(reportId, userId);
      showSuccess(`${userName} removido del reporte`);
      router.refresh();
    } catch (error: unknown) {
      showError(
        (error instanceof Error ? error.message : null) ||
          "Error al remover investigador"
      );
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleRunAi = async () => {
    setAiLoading(true);
    try {
      const content =
        typeof report.content === "string"
          ? report.content
          : JSON.stringify(report.content);
      const res = await fetch("/api/ai/process/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          source: report.source,
          metadata: { submissionId: report.id },
          sync: true,
          timeoutMs: 12000,
          fallbackToQueue: true,
        }),
      });
      const payload = await res.json();
      if (!res.ok || payload?.success === false) throw new Error();
      if (payload.mode === "sync") {
        showSuccess("Análisis de IA completado");
        router.refresh();
      } else {
        showWarning("Análisis encolado", payload.message);
      }
    } catch {
      showError("No se pudo iniciar el análisis de IA");
    } finally {
      setAiLoading(false);
    }
  };

  /* ──────────────── render ──────────────── */
  return (
    <div className="space-y-4">

      {/* ── 1. Closure / Status of case ── */}
      {permissions.canEditReports && (
        <ReportClosureComponent
          report={report}
          reportId={reportId}
          onStatusChange={() => router.refresh()}
        />
      )}

      {/* ── 2. Case management (admin / editor) ── */}
      {canManage && (
        <SidebarSection
          title="Gestión del caso"
          icon="icon-[lucide--settings]"
          action={
            permissions.canAssignReports ? (
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={onAssignOpen}
                startContent={
                  <i className="icon-[lucide--user-round-plus] size-3.5" />
                }
              >
                Asignar
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {/* Estado */}
            <Select
              label="Estado"
              size="sm"
              selectedKeys={[report.status]}
              onChange={(e) => handleStatusChange(e.target.value)}
              isLoading={statusLoading}
              isDisabled={statusLoading}
              aria-label="Estado del reporte"
            >
              {Object.values(REPORT_STATUS).map((s) => (
                <SelectItem key={s}>{getStatusLabel(s)}</SelectItem>
              ))}
            </Select>

            {/* Prioridad */}
            <Select
              label="Prioridad"
              size="sm"
              selectedKeys={[report.priority]}
              onChange={(e) => handlePriorityChange(e.target.value)}
              isLoading={priorityLoading}
              isDisabled={priorityLoading}
              aria-label="Prioridad del reporte"
            >
              {Object.values(REPORT_PRIORITY).map((p) => (
                <SelectItem key={p}>{getPriorityLabel(p)}</SelectItem>
              ))}
            </Select>

            {/* Asunto */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Asunto / Resumen corto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="Escribe un asunto breve…"
                />
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={handleSubjectSave}
                  isLoading={subjectSaving}
                  isIconOnly
                >
                  <i className="icon-[lucide--save] size-4" />
                </Button>
              </div>
            </div>

            {/* Categoría */}
            <Select
              label="Categoría"
              size="sm"
              placeholder="Selecciona categoría"
              selectedKeys={[report.type || ""]}
              onChange={(e) =>
                handleMetadataSave({ type: e.target.value || null })
              }
              isDisabled={metaSaving}
              aria-label="Categoría del reporte"
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

            {/* Departamento */}
            <Select
              label="Departamento"
              size="sm"
              placeholder="Asignar departamento"
              selectedKeys={[report.departmentId || ""]}
              onChange={(e) =>
                handleMetadataSave({ departmentId: e.target.value || null })
              }
              isDisabled={metaSaving}
              aria-label="Departamento del reporte"
            >
              {[{ id: "", name: "Sin departamento" }, ...departments].map(
                (d) => (
                  <SelectItem key={d.id}>{d.name}</SelectItem>
                )
              )}
            </Select>

            {/* AI analysis button */}
            {hasAi && !hasAiAnalysis && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                fullWidth
                onPress={handleRunAi}
                isLoading={aiLoading}
                startContent={
                  !aiLoading && (
                    <i className="icon-[lucide--sparkles] size-3.5" />
                  )
                }
              >
                Realizar análisis de IA
              </Button>
            )}

            {/* Notes button */}
            <Button
              size="sm"
              color="warning"
              variant="flat"
              fullWidth
              onPress={onNotesOpen}
              startContent={
                <i className="icon-[lucide--notebook-pen] size-3.5" />
              }
            >
              {report.internalNotes ? "Editar notas internas" : "Agregar notas internas"}
            </Button>
          </div>
        </SidebarSection>
      )}

      {/* ── 3. SLA / Deadline ── */}
      <SidebarSection title="Tiempo límite" icon="icon-[lucide--timer]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Días restantes</span>
            <Chip
              size="sm"
              variant="flat"
              color={
                deadlineInfo.isOverdue
                  ? "danger"
                  : deadlineInfo.daysRemaining <= 1
                    ? "warning"
                    : "success"
              }
            >
              {deadlineInfo.isOverdue
                ? `${Math.abs(deadlineInfo.daysRemaining)}d tarde`
                : `${deadlineInfo.daysRemaining}d`}
            </Chip>
          </div>
          <Progress
            value={
              deadlineInfo.isOverdue
                ? 100
                : Math.min(100, (deadlineInfo.daysRemaining / 8) * 100)
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
          {deadlineInfo.isOverdue && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <i className="icon-[lucide--alert-circle] size-3" />
              Plazo vencido — requiere atención inmediata
            </p>
          )}
        </div>
      </SidebarSection>

      {/* ── 4. Investigators ── */}
      {(permissions.canAssignReports || permissions.canViewAssignedReports) &&
        report.assignments &&
        report.assignments.length > 0 && (
          <SidebarSection
            title="Investigadores asignados"
            icon="icon-[lucide--users]"
          >
            <div className="space-y-2.5">
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
                      description={`Desde ${formatDate(assignment.createdAt)}`}
                      avatarProps={{
                        size: "sm",
                        showFallback: true,
                        name: assignment.userName,
                        classNames: { base: "bg-blue-100 text-blue-900" },
                      }}
                      classNames={{
                        name: "text-sm font-medium",
                        description: "text-xs",
                      }}
                    />
                    {permissions.canAssignReports && (
                      <Tooltip content="Remover investigador" placement="left">
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
                      </Tooltip>
                    )}
                  </div>
                )
              )}
            </div>
          </SidebarSection>
        )}

      {/* ── 5. Internal notes (visible if exists, regardless of edit permission) ── */}
      {report.internalNotes && (
        <SidebarSection
          title="Notas internas"
          icon="icon-[lucide--notebook]"
          action={
            permissions.canEditReports ? (
              <Button
                size="sm"
                variant="light"
                color="primary"
                onPress={onNotesOpen}
                isIconOnly
              >
                <i className="icon-[lucide--pencil] size-3.5" />
              </Button>
            ) : undefined
          }
        >
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {report.internalNotes}
          </p>
        </SidebarSection>
      )}

      {/* ── 6. AI Analysis summary (sidebar condensed) ── */}
      {aiAnalysis && (
        <SidebarSection
          title="Resumen de IA"
          icon="icon-[lucide--brain]"
        >
          <div className="space-y-3">
            {aiAnalysis.severity && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Severidad</span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={getSeverityColor(aiAnalysis.severity)}
                >
                  {getSeverityLabel(aiAnalysis.severity)}
                </Chip>
              </div>
            )}
            {typeof aiAnalysis.confidence === "number" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Confianza</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {aiAnalysis.confidence}%
                  </span>
                </div>
                <Progress
                  value={aiAnalysis.confidence}
                  size="sm"
                  color={
                    aiAnalysis.confidence > 80
                      ? "success"
                      : aiAnalysis.confidence > 60
                        ? "warning"
                        : "danger"
                  }
                />
              </div>
            )}
            {aiAnalysis.summary && (
              <p className="text-xs text-gray-700 leading-relaxed">
                {aiAnalysis.summary}
              </p>
            )}
          </div>
        </SidebarSection>
      )}

      {/* ── 7. Case info ── */}
      <SidebarSection
        title="Información del caso"
        icon="icon-[lucide--info]"
      >
        <div className="space-y-0">
          <MetaRow label="Referencia" value={<span className="font-mono">{reportRef}</span>} />
          <MetaRow label="Enviado" value={formatDate(report.submittedAt)} />
          <MetaRow
            label="Fuente"
            value={
              <Chip size="sm" variant="flat">
                {getSourceLabel(report.source)}
              </Chip>
            }
          />
          <MetaRow
            label="Tipo"
            value={
              <Chip
                size="sm"
                variant="flat"
                color={report.isAnonymous ? "secondary" : "primary"}
              >
                {report.isAnonymous ? "Anónimo" : "Identificado"}
              </Chip>
            }
          />
          {report.department?.name && (
            <MetaRow label="Departamento" value={report.department.name} />
          )}
          {isClosed && report.processedAt && (
            <MetaRow
              label="Fecha de cierre"
              value={format(
                new Date(report.processedAt),
                "dd/MM/yyyy HH:mm",
                { locale: es }
              )}
            />
          )}
        </div>
      </SidebarSection>

      {/* ── 8. PDF download (closed cases) ── */}
      {isClosed && (
        <DownloadPDFButton
          reportType="report_case"
          data={{ ...report } as Record<string, unknown>}
          filename={`caso-${reportRef}-${format(new Date(), "yyyy-MM-dd", { locale: es })}`}
          buttonText="Descargar resumen PDF"
          variant="flat"
          color="default"
        />
      )}

      {/* ── 9. Read-only notice for members ── */}
      {!permissions.canEditReports && !permissions.canAssignReports && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <i className="icon-[lucide--eye] mx-auto mb-2 size-7 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-900">Vista de solo lectura</p>
          <p className="mt-1 text-xs text-emerald-800">
            Puedes ver los detalles del reporte. Para hacer cambios, contacta a
            un administrador.
          </p>
        </div>
      )}

      {/* ── Modals ── */}
      {currentOrganization && permissions.canAssignReports && (
        <AssignMembersModal
          isOpen={isAssignOpen}
          onClose={() => onAssignOpenChange()}
          reportId={reportId}
          currentAssignments={report.assignments || []}
          onSuccess={() => {
            onAssignOpenChange();
            router.refresh();
          }}
          organizationId={currentOrganization.id}
        />
      )}

      {permissions.canEditReports && (
        <Modal isOpen={isNotesOpen} onOpenChange={onNotesOpenChange} size="lg">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex items-center gap-2">
                  <i className="icon-[lucide--notebook-pen] size-5 text-gray-600" />
                  Notas internas
                </ModalHeader>
                <ModalBody>
                  <Textarea
                    label="Notas del equipo de investigación"
                    placeholder="Escribe observaciones internas sobre el caso, evidencia recolectada, pasos de investigación, etc."
                    value={internalNotes}
                    onValueChange={setInternalNotes}
                    minRows={6}
                    maxRows={12}
                    description="Estas notas son confidenciales y solo visibles para el equipo."
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSaveNotes}
                    startContent={
                      <i className="icon-[lucide--save] size-4" />
                    }
                  >
                    Guardar notas
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
