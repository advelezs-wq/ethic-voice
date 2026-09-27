import React from "react";
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
import { EmptyState } from "@/modules/app/components/ui";
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
      const title = report.subject || "Denuncia sin asunto";
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
      `¿Seguro que deseas eliminar esta denuncia${
        title ? `: "${title}"` : ""
      }? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      setDeletingReportId(reportId);
      await deleteReport(reportId);
      showSuccess("Denuncia eliminada");
      window.dispatchEvent(new CustomEvent("manual-report-created"));
      router.refresh();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la denuncia"
      );
    } finally {
      setDeletingReportId(null);
    }
  };

  const runAi = async (report: Report) => {
    try {
      setAiLoadingId(report.idTable);
      setOptimisticQueuedIds((prev) => new Set(prev).add(report.idTable));
      const res = await fetch("/api/ai/process/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: typeof report.content === "string" ? report.content : JSON.stringify(report.content),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          source: report.source as any,
          metadata: { submissionId: report.idTable },
          sync: true,
          timeoutMs: 12000,
          fallbackToQueue: true,
        }),
      });
      const payload = await res.json();
      if (!res.ok || payload?.success === false) throw new Error("AI process failed");
      if (payload.mode === "sync") {
        showSuccess("Análisis de IA completado");
        setOptimisticQueuedIds((prev) => {
          const next = new Set(prev);
          next.delete(report.idTable);
          return next;
        });
        window.dispatchEvent(new CustomEvent("manual-report-created"));
      } else {
        showWarning("El análisis quedó en cola", payload.message);
        refreshQueue();
      }
    } catch {
      showError("No se pudo procesar el análisis de IA");
      setOptimisticQueuedIds((prev) => {
        const next = new Set(prev);
        next.delete(report.idTable);
        return next;
      });
    } finally {
      setAiLoadingId(null);
    }
  };

  const SOURCE_LABEL: Record<string, string> = {
    ETHIC_LINE: "Línea ética",
    CUSTOM_FORM: "Formulario",
    EMAIL: "Correo",
    WHATSAPP: "WhatsApp",
    API: "Registro manual",
  };

  const PRIORITY_DOT: Record<string, string> = {
    URGENT: "bg-ev-coral",
    HIGH: "bg-ev-coral",
    NORMAL: "bg-ev-amber",
    LOW: "bg-ev-haze",
  };

  return (
    <section className="rounded-2xl border border-ev-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ev-line px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
            Denuncias recientes
          </h3>
          {urgentReports.length > 0 && (
            <span className="ev-label rounded-full bg-[#FBE6E1] px-2 py-0.5 text-[#9C2F1F]">
              {urgentReports.length} {urgentReports.length === 1 ? "prioritaria" : "prioritarias"}
            </span>
          )}
        </div>
        <Link
          href="/app/reports"
          className="text-sm font-medium text-ev-night underline decoration-ev-line underline-offset-4 hover:decoration-ev-night"
        >
          Ver todas las denuncias
        </Link>
      </header>

      {reports.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={<i className="icon-[lucide--inbox] size-6" />}
            title="Aún no hay denuncias"
            description="Cuando alguien reporte por la línea ética, el correo o un formulario, la verás aquí."
          />
        </div>
      ) : (
        <ul className="divide-y divide-ev-line">
          {sortedReports.map((report) => {
            const reportInfo = extractReportInfo(report);
            const deadlineInfo = report.deadline
              ? getDeadlineInfo(report.severity, new Date(report.submittedAt), report.category)
              : null;
            const queued =
              (optimisticQueuedIds.has(report.idTable)
                ? "processing"
                : submissionIdToStatus.get(report.idTable)) === "processing";
            const isOpen = report.status !== "closed" && report.status !== "archived";

            return (
              <li key={report.id} className="group relative">
                <div className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-ev-paper/60">
                  <span
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[report.severity] ?? "bg-ev-haze"}`}
                    title={`Prioridad ${getPriorityLabel(report.severity).toLowerCase()}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/app/reports/${report.idTable}`}
                      className="font-medium text-ev-night after:absolute after:inset-0 hover:underline"
                    >
                      {reportInfo.title}
                    </Link>
                    {reportInfo.description && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-ev-mute">{reportInfo.description}</p>
                    )}
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-ev-mute">
                      <span className="font-mono text-ev-haze">#{report.idTable}</span>
                      <span>{getReportTypeLabel(report.category)}</span>
                      <span>· {SOURCE_LABEL[report.source] ?? "Otro canal"}</span>
                      {report.isAnonymous && <span>· Anónima</span>}
                      {report.department && <span>· {report.department}</span>}
                      {report.assignments && report.assignments.length > 0 ? (
                        <span>
                          · Responsable: {report.assignments.map((a) => a.userName).join(", ")}
                        </span>
                      ) : (
                        isOpen && <span className="text-[#8C5C15]">· Sin responsable</span>
                      )}
                    </p>
                  </div>

                  <div className="relative z-10 flex shrink-0 flex-col items-end gap-2">
                    <span className="flex items-center gap-2">
                      <Chip color={getPriorityColor(report.severity)} size="sm" variant="flat">
                        {getPriorityLabel(report.severity)}
                      </Chip>
                      <Chip color={getStatusColor(report.status)} size="sm" variant="flat">
                        {getStatusLabel(report.status)}
                      </Chip>
                    </span>
                    {deadlineInfo && isOpen && (
                      <span
                        className={`text-[0.8125rem] ${
                          deadlineInfo.isOverdue ? "font-medium text-[#9C2F1F]" : "text-ev-mute"
                        }`}
                      >
                        {deadlineInfo.text}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {!reportInfo.hasAiAnalysis && queued && (
                        <AIQueueInlineStatus submissionId={report.idTable} size="xs" />
                      )}
                      {!reportInfo.hasAiAnalysis &&
                        !queued &&
                        planInfo?.planType &&
                        planInfo.planType !== "STARTER" && (
                          <Button
                            size="sm"
                            variant="light"
                            className="h-7 px-2 text-xs text-ev-mute"
                            isLoading={aiLoadingId === report.idTable}
                            startContent={
                              aiLoadingId === report.idTable ? null : (
                                <i className="icon-[lucide--sparkles] size-3.5" aria-hidden />
                              )
                            }
                            onPress={() => runAi(report)}
                          >
                            Analizar con IA
                          </Button>
                        )}
                      {canDeleteReports && (
                        <Tooltip content="Eliminar denuncia">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            aria-label="Eliminar denuncia"
                            className="h-7 w-7 min-w-7 text-ev-haze opacity-0 transition-opacity hover:text-[#B23A28] focus-visible:opacity-100 group-hover:opacity-100"
                            isLoading={deletingReportId === report.idTable}
                            onPress={() => handleDeleteReport(report.idTable, reportInfo.title)}
                          >
                            <i className="icon-[lucide--trash-2] size-3.5" />
                          </Button>
                        </Tooltip>
                      )}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
