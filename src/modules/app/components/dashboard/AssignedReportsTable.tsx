import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/react";
import type { Report } from "@/types/dashboard.types";
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getReportTypeLabel,
  extractReportSummary,
  getDeadlineInfo,
} from "../../utils/dashboard.utils";
import Link from "next/link";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { useSafeToast } from "../../hooks/useSafeToast";
import { useAiQueue } from "../../hooks/useAiQueue";
import { Spinner } from "@heroui/react";
import { useSubmissionQueueInfo } from "../../hooks/useSubmissionQueueInfo";
import { formatEtaShort } from "../../utils/date.utils";
import { AIQueueInlineStatus } from "../../components/ai/AIQueueInlineStatus";
import { useRouter } from "next/navigation";
import { deleteReport } from "@/actions/reports.actions";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { UserRole } from "@/types/auth.types";

interface AssignedReportsTableProps {
  reports: Report[];
}

export const AssignedReportsTable: React.FC<AssignedReportsTableProps> = ({
  reports,
}) => {
  const router = useRouter();
  const { planInfo } = usePlanPermissions();
  const { role } = useUserRole();
  const { showSuccess, showError, showWarning } = useSafeToast();
  const [aiLoadingId, setAiLoadingId] = React.useState<number | null>(null);
  const [deletingReportId, setDeletingReportId] = React.useState<number | null>(
    null
  );
  const { submissionIdToStatus, refresh: refreshQueue } = useAiQueue(8000);
  const [optimisticQueuedIds, setOptimisticQueuedIds] = React.useState<
    Set<number>
  >(new Set());
  const extractReportInfo = (report: Report) => {
    try {
      const content = typeof report.content === "object" ? report.content : {};

      // Try to find AI analysis in different possible locations
      const aiAnalysis =
        content.aiAnalysis ||
        content.processed ||
        content.metadata?.aiAnalysis ||
        null;

      // Extract key information
      const title = report.subject || "Reporte sin título";
      let description = "";
      let keyFindings: string[] = [];
      let immediateActions: string[] = [];
      let confidence = null;
      let requiresUrgentAction = false;

      if (aiAnalysis) {
        description = aiAnalysis.summary || "";
        keyFindings = aiAnalysis.keyFindings || [];
        immediateActions =
          aiAnalysis.immediateActions ||
          aiAnalysis.recommendedActions?.immediate ||
          [];
        confidence = aiAnalysis.confidence;
        requiresUrgentAction = aiAnalysis.requiresUrgentAction || false;
      }

      // If no AI summary, try to extract from report content
      if (!description && report.content) {
        description = extractReportSummary({
          content: JSON.stringify(report.content),
          source: report.source,
          type: report.category,
          aiSummary: null,
          metadata: content.metadata,
        });
      }

      return {
        title,
        description,
        keyFindings,
        immediateActions,
        hasAiAnalysis: !!aiAnalysis,
        confidence,
        requiresUrgentAction,
      };
    } catch (error) {
      console.error("Error extracting report info:", error);
      return {
        title: report.subject || "Reporte",
        description: "Error al procesar contenido",
        keyFindings: [],
        immediateActions: [],
        hasAiAnalysis: false,
        confidence: null,
        requiresUrgentAction: false,
      };
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "EMAIL":
        return <i className="icon-[lucide--mail] size-4 text-blue-500" />;
      case "ETHIC_LINE":
        return (
          <i className="icon-[lucide--shield-check] size-4 text-green-500" />
        );
      default:
        return <i className="icon-[lucide--file-text] size-4 text-gray-500" />;
    }
  };

  const getPriorityIcon = (severity: string) => {
    if (severity === "HIGH" || severity === "URGENT") {
      return <i className="icon-[lucide--zap] size-4 text-red-500" />;
    } else if (severity === "MEDIUM" || severity === "NORMAL") {
      return (
        <i className="icon-[lucide--chevrons-up] size-4 text-orange-500" />
      );
    }
    return null;
  };

  // Group reports by urgency
  const urgentReports = reports.filter((report) => {
    const info = extractReportInfo(report);
    return info.requiresUrgentAction || report.severity === "HIGH";
  });

  const normalReports = reports.filter((report) => {
    const info = extractReportInfo(report);
    return !info.requiresUrgentAction && report.severity !== "HIGH";
  });

  const sortedReports = [...urgentReports, ...normalReports];
  const canDeleteReports =
    role === UserRole.ORG_ADMIN || role === UserRole.SUPER_ADMIN;

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

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-base sm:text-lg font-semibold">
              Reportes Recientes
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Chip color="danger" variant="flat" size="sm">
                {reports.length} total
              </Chip>
              {urgentReports.length > 0 && (
                <Chip color="danger" variant="solid" size="sm">
                  <i className="icon-[lucide--alert-triangle] size-3 mr-1" />
                  {urgentReports.length} urgentes
                </Chip>
              )}
            </div>
          </div>
          <Button as={Link} href="/app/reports" variant="bordered" size="sm">
            Ver todos
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3 sm:space-y-4">
          {sortedReports.map((report) => {
            const reportInfo = extractReportInfo(report);
            const deadlineInfo = report.deadline
              ? getDeadlineInfo(
                  report.severity,
                  new Date(report.submittedAt),
                  report.category
                )
              : null;

            return (
              <Card
                shadow="sm"
                isHoverable
                key={report.id}
                className={`transition-all hover:shadow-md ${
                  reportInfo.requiresUrgentAction
                    ? "border-l-4 border-l-red-500"
                    : ""
                }`}
              >
                <CardBody className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <span className="text-sm font-semibold text-gray-500">
                          {report.idTable}
                        </span>
                        {getSourceIcon(report.source)}
                        {getPriorityIcon(report.severity)}

                        {/* Priority Chip */}
                        <Chip
                          color={getPriorityColor(report.severity)}
                          size="sm"
                          variant="flat"
                        >
                          <i className="icon-[lucide--flag] size-3 mr-1" />
                          {getPriorityLabel(report.severity)}
                        </Chip>

                        {/* Status Chip */}
                        <Chip
                          color={getStatusColor(report.status)}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusLabel(report.status)}
                        </Chip>

                        {/* Special Indicators */}
                        {report.isAnonymous && (
                          <Chip size="sm" variant="flat" color="secondary">
                            <i className="icon-[lucide--user-round-check] size-3 mr-1" />
                            Anónimo
                          </Chip>
                        )}

                        {reportInfo.hasAiAnalysis && (
                          <Tooltip
                            content={`Confianza del análisis: ${reportInfo.confidence}%`}
                          >
                            <Chip size="sm" variant="flat" color="primary">
                              <i className="icon-[lucide--brain] size-3 mr-1" />
                              AI {reportInfo.confidence}%
                            </Chip>
                          </Tooltip>
                        )}
                        {!reportInfo.hasAiAnalysis &&
                          (optimisticQueuedIds.has(report.idTable)
                            ? "processing"
                            : submissionIdToStatus.get(report.idTable)) ===
                            "processing" && (
                            <AIQueueInlineStatus
                              submissionId={report.idTable}
                              size="xs"
                            />
                          )}
                        {!reportInfo.hasAiAnalysis &&
                          (optimisticQueuedIds.has(report.idTable)
                            ? "processing"
                            : submissionIdToStatus.get(report.idTable)) !==
                            "processing" &&
                          planInfo?.planType &&
                          planInfo.planType !== "STARTER" && (
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              isLoading={aiLoadingId === report.idTable}
                              onPress={async () => {
                                try {
                                  setAiLoadingId(report.idTable);
                                  setOptimisticQueuedIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(report.idTable);
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
                                            : JSON.stringify(report.content),
                                        source: report.source as any,
                                        metadata: {
                                          submissionId: report.idTable,
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
                                      next.delete(report.idTable);
                                      return next;
                                    });
                                    window.dispatchEvent(
                                      new CustomEvent("manual-report-created")
                                    );
                                  } else {
                                    showWarning(
                                      "Análisis encolado automáticamente",
                                      payload.message
                                    );
                                    refreshQueue();
                                  }
                                } catch (err) {
                                  showError(
                                    "No se pudo procesar el análisis de IA"
                                  );
                                  setOptimisticQueuedIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(report.idTable);
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

                        {reportInfo.requiresUrgentAction && (
                          <Chip size="sm" variant="solid" color="danger">
                            <i className="icon-[lucide--alert-triangle] size-3 mr-1" />
                            Acción urgente
                          </Chip>
                        )}
                      </div>

                      {/* Title and Summary */}
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-1 text-base">
                        {reportInfo.title}
                      </h4>

                      {reportInfo.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {reportInfo.description}
                        </p>
                      )}

                      {/* Key Findings - Show only if AI analysis exists */}
                      {reportInfo.keyFindings.length > 0 && (
                        <div className="mb-2 p-2 bg-gray-50 rounded-md">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Hallazgos clave:
                          </p>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {reportInfo.keyFindings
                              .slice(0, 2)
                              .map((finding, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-1"
                                >
                                  <i className="icon-[lucide--check-circle] size-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-1">
                                    {finding}
                                  </span>
                                </li>
                              ))}
                            {reportInfo.keyFindings.length > 2 && (
                              <li className="text-gray-500 italic">
                                +{reportInfo.keyFindings.length - 2} más...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Immediate Actions - Show for urgent reports */}
                      {reportInfo.requiresUrgentAction &&
                        reportInfo.immediateActions.length > 0 && (
                          <div className="mb-2 p-2 bg-red-50 rounded-md">
                            <p className="text-xs font-semibold text-red-700 mb-1">
                              Acciones inmediatas:
                            </p>
                            <ul className="text-xs text-red-600 space-y-0.5">
                              {reportInfo.immediateActions
                                .slice(0, 1)
                                .map((action, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-1"
                                  >
                                    <i className="icon-[lucide--alert-circle] size-3 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">
                                      {action}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600">
                        <span>
                          <i className="icon-[lucide--tag] size-3 mr-1 inline" />
                          {getReportTypeLabel(report.category)}
                        </span>
                        {report.department && (
                          <>
                            <span>•</span>
                            <span>
                              <i className="icon-[lucide--building-2] size-3 mr-1 inline" />
                              {report.department}
                            </span>
                          </>
                        )}
                        {deadlineInfo && (
                          <>
                            <span>•</span>
                            <span
                              className={
                                deadlineInfo.isOverdue
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              <span
                                aria-label={`semaforo ${deadlineInfo.semaphore}`}
                                className={`inline-block w-2.5 h-2.5 rounded-full mr-1 ${
                                  deadlineInfo.semaphore === "green"
                                    ? "bg-green-500"
                                    : deadlineInfo.semaphore === "yellow"
                                      ? "bg-yellow-500"
                                      : deadlineInfo.semaphore === "orange"
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                }`}
                              />
                              <i className="icon-[lucide--clock] size-3 mr-1 inline" />
                              {deadlineInfo.text}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Assignment Info */}
                      {report.assignments && report.assignments.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <Chip size="sm" variant="flat" color="primary">
                            <i className="icon-[lucide--users] size-3 mr-1" />
                            {report.assignments.length} investigador(es)
                          </Chip>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0 sm:self-auto self-end flex items-center gap-1">
                      {canDeleteReports && (
                        <Button
                          isIconOnly
                          variant="light"
                          color="danger"
                          size="sm"
                          isLoading={deletingReportId === report.idTable}
                          onPress={() =>
                            handleDeleteReport(report.idTable, reportInfo.title)
                          }
                        >
                          <i className="icon-[lucide--trash-2] size-4" />
                        </Button>
                      )}
                      <Button
                        as={Link}
                        href={`/app/reports/${report.idTable}`}
                        isIconOnly
                        variant="light"
                        size="sm"
                      >
                        <i className="icon-[lucide--arrow-right] size-4" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}

          {reports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="icon-[lucide--inbox] size-12 mx-auto mb-2" />
              <p>No hay reportes recientes</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
