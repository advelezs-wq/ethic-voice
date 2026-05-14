/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportFilters, ReportItem } from "@/types/reports";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
} from "@heroui/react";
import Link from "next/link";
import { AssignMembersModal } from "./AssignMembersModal";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { useDisclosure } from "@heroui/react";
import { generateReportReference } from "../../utils/reports";
import {
  getSeverityLabel,
  getStatusLabel as getReportStatusLabel,
  getDeadlineInfo,
  getReportTypeLabel,
  getSourceLabel,
  extractReportSummary,
} from "../../utils/dashboard.utils";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { deleteReport, updateReportStatus } from "@/actions/reports.actions";
import { UserRole } from "@/types/auth.types";
import { useSafeToast } from "../../hooks/useSafeToast";
import { useAiQueue } from "../../hooks/useAiQueue";
import { AIQueueInlineStatus } from "../ai/AIQueueInlineStatus";

interface ReportsTableProps {
  reports: ReportItem[];
  filters: ReportFilters;
  selectedReports: number[];
  onSelectionChange: (ids: number[]) => void;
  viewMode: "table" | "cards";
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export function ReportsTable({
  reports,
  selectedReports,
  onSelectionChange,
  viewMode,
  totalCount,
  currentPage,
  pageSize,
}: ReportsTableProps) {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const { planInfo } = usePlanPermissions();
  const { role: userRole } = useUserRole();
  const { showSuccess, showError, showWarning } = useSafeToast();
  const [aiLoadingId, setAiLoadingId] = useState<number | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const { submissionIdToStatus, refresh: refreshQueue } = useAiQueue(8000);
  const [optimisticQueuedIds, setOptimisticQueuedIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedReportForAssignment, setSelectedReportForAssignment] =
    useState<number | null>(null);
  const {
    isOpen: isAssignModalOpen,
    onOpen: onAssignModalOpen,
    onOpenChange: onAssignModalOpenChange,
  } = useDisclosure();

  const handleAssignClick = (reportId: number) => {
    setSelectedReportForAssignment(reportId);
    onAssignModalOpen();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const reportDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - reportDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return reportDate.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year:
          reportDate.getFullYear() !== now.getFullYear()
            ? "numeric"
            : undefined,
      });
    }
  };

  const getDeadline = (report: ReportItem) => {
    // Pasamos tipología cuando esté disponible para aplicar SLA por tipo
    const type = report.type || undefined;
    return getDeadlineInfo(report.priority, report.submittedAt, type);
  };

  // Fixed color return types
  const getSeverityColor = (
    severity: string
  ): "danger" | "warning" | "success" | "default" => {
    const colors: Record<string, "danger" | "warning" | "success" | "default"> =
      {
        URGENT: "danger",
        HIGH: "danger",
        NORMAL: "warning",
        MEDIUM: "warning",
        LOW: "success",
        UNKNOWN: "default",
      };
    return colors[severity as keyof typeof colors] || "default";
  };

  const getStatusColor = (
    status: string
  ): "danger" | "warning" | "success" | "default" | "primary" | "secondary" => {
    const colors: Record<
      string,
      "danger" | "warning" | "success" | "default" | "primary" | "secondary"
    > = {
      PENDING: "warning",
      IN_PROGRESS: "primary",
      RESOLVED: "success",
      CLOSED: "default",
      ARCHIVED: "default",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusLabel = (status: string) => {
    return getReportStatusLabel(status) || "Desconocido";
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "URGENT") {
      return <i className="icon-[lucide--zap] size-4 text-red-500" />;
    } else if (priority === "HIGH") {
      return (
        <i className="icon-[lucide--chevrons-up] size-4 text-orange-500" />
      );
    }
    return null;
  };

  const getSourceIcon = (source: string) => {
    if (source === "EMAIL") {
      return <i className="icon-[lucide--mail] size-4 text-blue-500" />;
    } else if (source === "ETHIC_LINE") {
      return (
        <i className="icon-[lucide--shield-check] size-4 text-green-500" />
      );
    }
    return <i className="icon-[lucide--file-text] size-4 text-gray-500" />;
  };

  // Helper function to extract reported person name
  const getReportedPersonName = (report: ReportItem): string => {
    try {
      const content =
        typeof report.content === "string"
          ? JSON.parse(report.content)
          : report.content;

      if (content.reported?.firstName) {
        const firstName = content.reported.firstName;
        const lastName = content.reported.lastName || "";
        return `${firstName} ${lastName}`.trim();
      }

      return "No especificado";
    } catch {
      return "No especificado";
    }
  };

  const extractReportInfo = (report: ReportItem) => {
    try {
      const content =
        typeof report.content === "string"
          ? JSON.parse(report.content)
          : report.content;

      // Extract AI analysis if available
      const aiAnalysis =
        report.metadata?.aiAnalysis || content.aiAnalysis || content.processed;

      // Extract key information based on source
      let title = "";
      let description = "";
      let category = getReportTypeLabel(report.type);
      let keyFindings = [];
      let immediateActions = [];

      if (report.source === "EMAIL") {
        // For email reports
        title = report.aiSummary || aiAnalysis?.summary || "Reporte por email";
        description = extractReportSummary(report);
        keyFindings = aiAnalysis?.keyFindings || [];
        immediateActions = aiAnalysis?.immediateActions || [];

        // Extract email subject from metadata
        if (report.metadata?.subject) {
          category = report.metadata.subject;
        }
      } else if (report.source === "ETHIC_LINE") {
        // For EthicVoice (línea ética) reports
        const reportedName = content.reported?.firstName || "No especificado";
        title = `${category} - ${reportedName}`;
        description = extractReportSummary(report);

        if (aiAnalysis) {
          keyFindings = aiAnalysis.keyFindings || [];
          immediateActions =
            aiAnalysis.recommendedActions?.immediate ||
            aiAnalysis.immediateActions ||
            [];
        }
      } else if (report.source === "API") {
        title =
          content.subject ||
          content.title ||
          report.metadata?.subject ||
          report.aiSummary ||
          "Reporte manual";
        description = extractReportSummary(report) || content.questionnaire?.whatHappened || "";
        if (aiAnalysis) {
          keyFindings = aiAnalysis.keyFindings || [];
          immediateActions =
            aiAnalysis.recommendedActions?.immediate ||
            aiAnalysis.immediateActions ||
            [];
        }
      }

      return {
        title: title || report.aiSummary || "Reporte",
        description,
        category,
        keyFindings,
        immediateActions,
        hasAiAnalysis: !!aiAnalysis,
        confidence: aiAnalysis?.confidence,
        requiresUrgentAction:
          aiAnalysis?.requiresUrgentAction ||
          report.metadata?.requiresUrgentAction,
      };
    } catch (error) {
      console.error("Error parsing report content:", error);
      return {
        title: report.type || "Reporte",
        description: "Error al procesar contenido",
        category: "Sin categorizar",
        keyFindings: [],
        immediateActions: [],
        hasAiAnalysis: false,
        confidence: null,
        requiresUrgentAction: false,
      };
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    router.push(`/app/reports?${params.toString()}`);
  };

  const toggleReportSelection = (reportId: number) => {
    if (selectedReports.includes(reportId)) {
      onSelectionChange(selectedReports.filter((id) => id !== reportId));
    } else {
      onSelectionChange([...selectedReports, reportId]);
    }
  };

  const selectAllReports = () => {
    if (selectedReports.length === reports.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(reports.map((r) => r.id));
    }
  };

  const handleDeleteReport = async (reportId: number, title?: string) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar este reporte${
        title ? `: "${title}"` : ""
      }? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      setDeletingReportId(reportId);
      await deleteReport(reportId);
      onSelectionChange(selectedReports.filter((id) => id !== reportId));
      showSuccess("Reporte eliminado correctamente");
      window.dispatchEvent(new CustomEvent("manual-report-created"));
      router.refresh();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el reporte"
      );
    } finally {
      setDeletingReportId(null);
    }
  };

  if (viewMode === "cards") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => {
            const deadline = getDeadline(report);
            const reportInfo = extractReportInfo(report);
            const isSelected = selectedReports.includes(report.id);

            return (
              <Card
                key={report.id}
                className={`border border-emerald-100 bg-white/95 transition-all hover:shadow-[0_24px_50px_-36px_rgba(5,26,36,0.78)] ${
                  isSelected ? "ring-2 ring-primary" : ""
                } ${
                  reportInfo.requiresUrgentAction
                    ? "border-l-4 border-l-red-500"
                    : ""
                }`}
              >
                <CardBody className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Selection Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        title={`Seleccionar reporte ${report.id}`}
                        checked={isSelected}
                        onChange={() => toggleReportSelection(report.id)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="text-sm font-semibold text-gray-500">
                            {generateReportReference(report.id)}
                          </span>
                          {getSourceIcon(report.source)}
                          {getPriorityIcon(report.priority || "NORMAL")}
                          <Chip
                            color={getSeverityColor(report.aiSeverity)}
                            size="sm"
                            variant="flat"
                          >
                            {getSeverityLabel(report.aiSeverity)}
                          </Chip>
                          <Chip
                            color={getStatusColor(report.status)}
                            size="sm"
                            variant="flat"
                          >
                            {getStatusLabel(report.status)}
                          </Chip>
                          {report.isAnonymous && (
                            <Chip size="sm" variant="flat" color="secondary">
                              <i className="icon-[lucide--user-round-check] size-3 mr-1" />
                              Anónimo
                            </Chip>
                          )}
                          {reportInfo.hasAiAnalysis && (
                            <Tooltip
                              content={`Confianza: ${reportInfo.confidence}%`}
                            >
                              <Chip size="sm" variant="flat" color="primary">
                                <i className="icon-[lucide--brain] size-3 mr-1" />
                                AI
                              </Chip>
                            </Tooltip>
                          )}
                          {reportInfo.requiresUrgentAction && (
                            <Chip size="sm" variant="flat" color="danger">
                              <i className="icon-[lucide--alert-triangle] size-3 mr-1" />
                              Urgente
                            </Chip>
                          )}
                        </div>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button variant="light" isIconOnly size="sm">
                              <i className="icon-[material-symbols--more-horiz] size-5" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="view"
                              startContent={
                                <i className="icon-[lucide--eye] size-4" />
                              }
                              onPress={() =>
                                router.push(`/app/reports/${report.id}`)
                              }
                            >
                              Ver detalles
                            </DropdownItem>
                            <DropdownItem
                              key="assign"
                              startContent={
                                <i className="icon-[lucide--user-round-plus] size-4" />
                              }
                              onPress={() => handleAssignClick(report.id)}
                              className={
                                userRole === UserRole.ORG_ADMIN ||
                                userRole === UserRole.SUPER_ADMIN
                                  ? undefined
                                  : "hidden"
                              }
                            >
                              Asignar investigadores
                            </DropdownItem>
                            <DropdownItem
                              key="archive"
                              startContent={
                                <i className="icon-[lucide--archive] size-4" />
                              }
                              className={
                                userRole === UserRole.ORG_ADMIN ||
                                userRole === UserRole.SUPER_ADMIN
                                  ? undefined
                                  : "hidden"
                              }
                              onPress={async () => {
                                try {
                                  await updateReportStatus(
                                    report.id,
                                    "ARCHIVED" as any
                                  );
                                  router.refresh();
                                } catch {
                                  showError("No se pudo archivar el reporte");
                                }
                              }}
                            >
                              Archivar
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={
                                <i className="icon-[lucide--trash-2] size-4" />
                              }
                              onPress={() =>
                                handleDeleteReport(report.id, reportInfo.title)
                              }
                            >
                              Eliminar reporte
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>

                      <h3 className="text-base md:text-lg font-semibold text-[#0d212c] mb-2">
                        {reportInfo.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {reportInfo.description}
                      </p>

                      {/* Key Findings Section */}
                      {reportInfo.keyFindings.length > 0 && (
                        <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50/55 p-3">
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">
                            Hallazgos clave:
                          </h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {reportInfo.keyFindings
                              .slice(0, 2)
                              .map((finding: React.ReactNode, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-1"
                                  >
                                    <i className="icon-[lucide--check-circle] size-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                      {finding}
                                    </span>
                                  </li>
                                )
                              )}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Categoría</p>
                          <p className="text-sm font-medium">
                            {reportInfo.category}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Departamento</p>
                          <p className="text-sm font-medium">
                            {report.department?.name || "No asignado"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Denunciante</p>
                          <p className="text-sm font-medium">
                            {report.isAnonymous
                              ? "Anónimo"
                              : report.reporterName ||
                                report.reporterEmail ||
                                "Sin nombre"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Denunciado</p>
                          <p className="text-sm font-medium">
                            {getReportedPersonName(report)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Fuente</p>
                          <p className="text-sm font-medium">
                            {getSourceLabel(report.source)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                          <span className="text-gray-600">
                            <i className="icon-[lucide--calendar] size-4 mr-1 inline" />
                            {formatDate(report.submittedAt)}
                          </span>
                          <span
                            className={`flex items-center gap-2 font-medium ${
                              deadline.isOverdue
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            <span
                              aria-label={`semaforo ${deadline.semaphore}`}
                              className={`inline-block w-2.5 h-2.5 rounded-full ${
                                deadline.semaphore === "green"
                                  ? "bg-green-500"
                                  : deadline.semaphore === "yellow"
                                    ? "bg-yellow-500"
                                    : deadline.semaphore === "orange"
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                              }`}
                            />
                            <i className="icon-[lucide--clock] size-4 inline" />
                            {deadline.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {report.assignments &&
                          report.assignments.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Chip size="sm" variant="flat">
                                <i className="icon-[lucide--users] size-3 mr-1" />
                                {report.assignments.length} asignado(s)
                              </Chip>
                              <Button
                                size="sm"
                                variant="light"
                                color="primary"
                                onPress={() => handleAssignClick(report.id)}
                              >
                                Gestionar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="bordered"
                              startContent={
                                <i className="icon-[lucide--user-round-plus] size-4" />
                              }
                              onPress={() => handleAssignClick(report.id)}
                            >
                              Asignar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isLoading={deletingReportId === report.id}
                            startContent={
                              <i className="icon-[lucide--trash-2] size-4" />
                            }
                            onPress={() =>
                              handleDeleteReport(report.id, reportInfo.title)
                            }
                            className={
                              userRole === UserRole.ORG_ADMIN ||
                              userRole === UserRole.SUPER_ADMIN
                                ? ""
                                : "hidden"
                            }
                          >
                            Eliminar
                          </Button>
                          <Button
                            as={Link}
                            href={`/app/reports/${report.id}`}
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={
                              <i className="icon-[lucide--arrow-right] size-4" />
                            }
                          >
                            Ver reporte
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              showControls
              showShadow
            />
          </div>
        )}
      </div>
    );
  }

  // Enhanced Table view
  return (
    <div className="space-y-4">
      <Card className="border border-emerald-100 bg-white/95 shadow-none">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[1100px]">
              <thead className="bg-emerald-50/50">
                <tr>
                  <th className="p-4 text-left w-12">
                    <input
                      type="checkbox"
                      title="Seleccionar todos los reportes"
                      checked={
                        selectedReports.length === reports.length &&
                        reports.length > 0
                      }
                      onChange={selectAllReports}
                      className="w-4 h-4 text-primary border-gray-300 rounded"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 w-24 whitespace-nowrap">
                    ID
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 md:w-[18rem] lg:w-[20rem] xl:w-[26rem]">
                    Asunto / Resumen
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 md:w-40 lg:w-48">
                    Denunciado
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 min-w-[140px]">
                    Análisis
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 w-24 whitespace-nowrap">
                    Severidad
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 w-24 lg:w-28">
                    Estado
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 w-24 whitespace-nowrap">
                    Fecha
                  </th>
                  <th
                    className={`p-4 text-left text-sm font-medium text-gray-700 md:w-40 lg:w-44 whitespace-nowrap ${
                      userRole === UserRole.ORG_ADMIN ||
                      userRole === UserRole.SUPER_ADMIN
                        ? ""
                        : "hidden"
                    }`}
                  >
                    Asignado
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 w-20 whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const deadline = getDeadline(report);
                  const reportInfo = extractReportInfo(report);
                  const isSelected = selectedReports.includes(report.id);

                  return (
                    <tr
                      key={report.id}
                      className={`hover:bg-emerald-50/30 border-b border-emerald-100 transition-colors ${
                        isSelected ? "bg-primary-50" : ""
                      } ${
                        reportInfo.requiresUrgentAction
                          ? "border-l-4 border-l-red-500"
                          : ""
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          title={`Seleccionar reporte ${report.id}`}
                          checked={isSelected}
                          onChange={() => toggleReportSelection(report.id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(report.source)}
                          {getPriorityIcon(report.priority || "NORMAL")}
                          <span className="font-medium text-gray-900 text-sm">
                            {generateReportReference(report.id)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 md:w-[28rem] whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-2 text-sm">
                            {reportInfo.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {reportInfo.category}
                          </p>
                          {report.reporterName && !report.isAnonymous && (
                            <p className="text-xs text-gray-500 truncate">
                              Por: {report.reporterName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 md:w-48 whitespace-nowrap">
                        <div>
                          <span className="text-sm text-gray-900 font-medium truncate block">
                            {getReportedPersonName(report)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell min-w-[100px]">
                        {reportInfo.hasAiAnalysis ? (
                          <div className="space-y-1">
                            {reportInfo.keyFindings.length > 0 && (
                              <Tooltip
                                content={
                                  <div className="max-w-xs">
                                    <p className="font-semibold mb-1">
                                      Hallazgos clave:
                                    </p>
                                    <ul className="text-xs space-y-1">
                                      {reportInfo.keyFindings.map(
                                        (
                                          finding: React.ReactNode,
                                          idx: number
                                        ) => (
                                          <li key={idx}>• {finding}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                }
                              >
                                <div className="flex items-center gap-1 text-xs text-gray-600 cursor-help">
                                  <i className="icon-[lucide--search] size-3" />
                                  <span className="line-clamp-1">
                                    {reportInfo.keyFindings[0]}
                                  </span>
                                </div>
                              </Tooltip>
                            )}
                            <div className="flex items-center gap-2">
                              <Chip size="sm" variant="flat" color="primary">
                                <i className="icon-[lucide--brain] size-3 mr-1" />
                                AI {reportInfo.confidence}%
                              </Chip>
                              {reportInfo.requiresUrgentAction && (
                                <Chip size="sm" variant="flat" color="danger">
                                  <i className="icon-[lucide--alert-triangle] size-3" />
                                </Chip>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const status = optimisticQueuedIds.has(report.id)
                                ? "processing"
                                : submissionIdToStatus.get(report.id);
                              if (status === "processing") {
                                return (
                                  <AIQueueInlineStatus
                                    submissionId={report.id}
                                  />
                                );
                              }
                              // If plan has permissions, show ONLY the button (no gray text)
                              if (
                                planInfo?.planType &&
                                planInfo.planType !== "STARTER"
                              ) {
                                return null;
                              }
                              // Otherwise, show informative gray text
                              return (
                                <span className="text-sm text-gray-400">
                                  Sin análisis AI
                                </span>
                              );
                            })()}
                            {(optimisticQueuedIds.has(report.id)
                              ? "processing"
                              : submissionIdToStatus.get(report.id)) !==
                              "processing" &&
                              planInfo?.planType &&
                              planInfo.planType !== "STARTER" && (
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="flat"
                                  isLoading={aiLoadingId === report.id}
                                  onPress={async () => {
                                    try {
                                      setAiLoadingId(report.id);
                                      // Optimista: marcar como en cola de inmediato
                                      setOptimisticQueuedIds((prev) => {
                                        const next = new Set(prev);
                                        next.add(report.id);
                                        return next;
                                      });
                                      const res = await fetch(
                                        "/api/ai/process/manual",
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            content:
                                              typeof report.content === "string"
                                                ? report.content
                                                : JSON.stringify(
                                                    report.content
                                                  ),
                                            source: report.source as any,
                                            metadata: {
                                              submissionId: report.id,
                                            },
                                            sync: true,
                                            timeoutMs: 12000,
                                            fallbackToQueue: true,
                                          }),
                                        }
                                      );
                                      const payload = await res.json();
                                      if (!res.ok || payload?.success === false) {
                                        throw new Error("AI process failed");
                                      }
                                      if (payload.mode === "sync") {
                                        showSuccess("Análisis de IA completado");
                                        setOptimisticQueuedIds((prev) => {
                                          const next = new Set(prev);
                                          next.delete(report.id);
                                          return next;
                                        });
                                        router.refresh();
                                      } else {
                                        showWarning(
                                          "Análisis encolado automáticamente",
                                          payload.message
                                        );
                                        // Forzar actualización inmediata del estado de la cola
                                        refreshQueue();
                                      }
                                    } catch (e) {
                                      showError(
                                        "No se pudo procesar el análisis de IA"
                                      );
                                      // Revertir optimismo si falló
                                      setOptimisticQueuedIds((prev) => {
                                        const next = new Set(prev);
                                        next.delete(report.id);
                                        return next;
                                      });
                                    } finally {
                                      setAiLoadingId(null);
                                    }
                                  }}
                                >
                                  Analizar con IA
                                </Button>
                              )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Chip
                          color={getSeverityColor(report.aiSeverity)}
                          size="sm"
                        >
                          {getSeverityLabel(report.aiSeverity)}
                        </Chip>
                      </td>
                      <td className="p-4">
                        <Chip color={getStatusColor(report.status)} size="sm">
                          {getStatusLabel(report.status)}
                        </Chip>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="text-sm">
                          <p className="text-gray-600">
                            {formatDate(report.submittedAt)}
                          </p>
                          <p
                            className={`flex items-center gap-2 text-xs ${
                              deadline.isOverdue
                                ? "text-red-600 font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            <span
                              aria-label={`semaforo ${deadline.semaphore}`}
                              className={`inline-block w-2.5 h-2.5 rounded-full ${
                                deadline.semaphore === "green"
                                  ? "bg-green-500"
                                  : deadline.semaphore === "yellow"
                                    ? "bg-yellow-500"
                                    : deadline.semaphore === "orange"
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                              }`}
                            />
                            {deadline.text}
                          </p>
                        </div>
                      </td>
                      {(userRole === UserRole.ORG_ADMIN ||
                        userRole === UserRole.SUPER_ADMIN) && (
                        <td className="p-4 md:w-44 whitespace-nowrap">
                          {report.assignments &&
                          report.assignments.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Tooltip
                                content={
                                  <div>
                                    {report.assignments.map((a) => (
                                      <p key={a.id}>{a.userName}</p>
                                    ))}
                                  </div>
                                }
                              >
                                <span className="text-sm cursor-help truncate">
                                  {report.assignments.length} asignado(s)
                                </span>
                              </Tooltip>
                              <Button
                                size="sm"
                                variant="light"
                                isIconOnly
                                onPress={() => handleAssignClick(report.id)}
                              >
                                <i className="icon-[lucide--edit] size-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => handleAssignClick(report.id)}
                            >
                              Asignar
                            </Button>
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() =>
                              router.push(`/app/reports/${report.id}`)
                            }
                          >
                            <i className="icon-[lucide--eye] size-4" />
                          </Button>
                          {(userRole === UserRole.ORG_ADMIN ||
                            userRole === UserRole.SUPER_ADMIN) && (
                            <Dropdown>
                              <DropdownTrigger>
                                <Button size="sm" variant="light" isIconOnly>
                                  <i className="icon-[material-symbols--more-horiz] size-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  key="assign"
                                  startContent={
                                    <i className="icon-[lucide--user-round-plus] size-4" />
                                  }
                                  onPress={() => handleAssignClick(report.id)}
                                >
                                  Asignar investigadores
                                </DropdownItem>
                                <DropdownItem
                                  key="archive"
                                  onPress={async () => {
                                    try {
                                      await updateReportStatus(
                                        report.id,
                                        "ARCHIVED" as any
                                      );
                                      router.refresh();
                                    } catch {
                                      showError(
                                        "No se pudo archivar el reporte"
                                      );
                                    }
                                  }}
                                >
                                  Archivar
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={
                                    <i className="icon-[lucide--trash-2] size-4" />
                                  }
                                  onPress={() =>
                                    handleDeleteReport(report.id, reportInfo.title)
                                  }
                                >
                                  Eliminar reporte
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            showControls
            showShadow
          />
        </div>
      )}

      {currentOrganization && selectedReportForAssignment && (
        <AssignMembersModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            onAssignModalOpenChange();
            setSelectedReportForAssignment(null);
          }}
          reportId={selectedReportForAssignment}
          currentAssignments={
            reports.find((r) => r.id === selectedReportForAssignment)
              ?.assignments || []
          }
          onSuccess={() => {
            onAssignModalOpenChange();
            setSelectedReportForAssignment(null);
            router.refresh();
          }}
          organizationId={currentOrganization.id}
        />
      )}
    </div>
  );
}
