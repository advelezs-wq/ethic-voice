"use client";

import { FormSubmission, ReportContent } from "@/types/reports";
import React from "react";
import { Chip, Tooltip, Button } from "@heroui/react";
import {
  formatDate,
  getSourceLabel,
  generateReportReference,
} from "../../utils/reports";
import {
  getSeverityColor,
  getSeverityLabel,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getReportTypeLabel,
} from "../../utils/dashboard.utils";
import { useRouter } from "next/navigation";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { useSafeToast } from "../../hooks/useSafeToast";
import { useAiQueue } from "../../hooks/useAiQueue";
import { useSubmissionQueueInfo } from "../../hooks/useSubmissionQueueInfo";
import { AIQueueInlineStatus } from "../ai/AIQueueInlineStatus";

interface ReportHeaderProps {
  report: FormSubmission;
  parsedContent: ReportContent;
}

const SOURCE_ICON: Record<string, string> = {
  EMAIL: "icon-[lucide--mail]",
  ETHIC_LINE: "icon-[lucide--phone]",
  CUSTOM_FORM: "icon-[lucide--file-text]",
  WHATSAPP: "icon-[lucide--message-circle]",
  API: "icon-[lucide--code]",
};

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  report,
  parsedContent,
}) => {
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
        content.metadata?.aiAnalysis ||
        null
      );
    } catch {
      return null;
    }
  };

  const aiAnalysis = extractAIAnalysis();
  const hasAIAnalysis = !!aiAnalysis || !!report.aiSummary;
  const { planInfo } = usePlanPermissions();
  const { showSuccess, showError, showWarning } = useSafeToast();
  const router = useRouter();
  const { submissionIdToStatus, refresh: refreshQueue } = useAiQueue(8000);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [optimisticQueued, setOptimisticQueued] = React.useState(false);

  const requiresUrgentAction =
    aiAnalysis?.requiresUrgentAction ||
    report.metadata?.requiresUrgentAction ||
    false;

  const severityToConfidence = (sev?: string | null) => {
    if (sev === "HIGH") return 90;
    if (sev === "MEDIUM") return 75;
    if (sev === "LOW") return 60;
    return 70;
  };
  const rawConfidence =
    typeof aiAnalysis?.confidence === "number" && aiAnalysis.confidence > 0
      ? aiAnalysis.confidence
      : (report.metadata as { analysisConfidence?: number } | null)
          ?.analysisConfidence;
  const confidenceForChip = Math.round(
    typeof rawConfidence === "number" && rawConfidence > 0
      ? rawConfidence
      : severityToConfidence(report.aiSeverity as string | null)
  );

  const handleAnalyzeAI = async () => {
    try {
      setAiLoading(true);
      setOptimisticQueued(true);
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
      if (!res.ok || payload?.success === false) throw new Error("AI process failed");
      if (payload.mode === "sync") {
        showSuccess("Análisis de IA completado");
        setOptimisticQueued(false);
        router.refresh();
      } else {
        showWarning("Análisis encolado", payload.message);
        refreshQueue();
      }
    } catch {
      showError("No se pudo procesar el análisis de IA");
      setOptimisticQueued(false);
    } finally {
      setAiLoading(false);
    }
  };

  const sourceIcon = SOURCE_ICON[report.source] || "icon-[lucide--radio]";
  const isProcessingAI =
    optimisticQueued || submissionIdToStatus.get(report.id) === "processing";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      {/* Urgent action banner */}
      {requiresUrgentAction && (
        <div className="bg-red-500 text-white px-5 py-2.5 flex items-center gap-2.5 text-sm font-semibold">
          <i className="icon-[lucide--alert-triangle] size-4 shrink-0" />
          Este reporte requiere acción urgente — revisa las acciones recomendadas
        </div>
      )}

      <div className="px-5 sm:px-7 py-5">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Left: reference + title */}
          <div className="min-w-0 flex-1">
            {/* Reference badge row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-xs font-bold tracking-wide text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                {generateReportReference(report.id)}
              </span>

              {hasAIAnalysis && (
                <Tooltip
                  content={`Procesado por IA con ${confidenceForChip}% de confianza`}
                  placement="bottom"
                >
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full cursor-default">
                    <i className="icon-[lucide--sparkles] size-3" />
                    IA {confidenceForChip}%
                  </span>
                </Tooltip>
              )}

              {!hasAIAnalysis &&
                planInfo?.planType &&
                planInfo.planType !== "STARTER" && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    Sin análisis de IA
                  </span>
                )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {getReportTypeLabel(
                report.type || parsedContent.irregularityType
              )}
            </h1>

            {/* Metadata inline row */}
            <div className="mt-2.5 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <i className="icon-[lucide--calendar] size-3.5" />
                {formatDate(report.submittedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                {parsedContent.isAnonymous ? (
                  <>
                    <i className="icon-[lucide--user-x] size-3.5" />
                    Anónimo
                  </>
                ) : (
                  <>
                    <i className="icon-[lucide--user] size-3.5" />
                    Identificado
                  </>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <i className={`${sourceIcon} size-3.5`} />
                {getSourceLabel(report.source)}
              </span>
              {(report.department?.name ||
                parsedContent.reported?.department) && (
                <span className="flex items-center gap-1.5">
                  <i className="icon-[lucide--building-2] size-3.5" />
                  {report.department?.name ||
                    parsedContent.reported?.department}
                </span>
              )}
            </div>
          </div>

          {/* Right: chips + AI action */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            {/* Status + severity + priority chips */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Chip
                color={getStatusColor(report.status)}
                size="sm"
                variant="solid"
                classNames={{ content: "font-semibold text-xs" }}
              >
                {getStatusLabel(report.status)}
              </Chip>
              {report.aiSeverity && (
                <Chip
                  color={getSeverityColor(report.aiSeverity)}
                  size="sm"
                  variant="flat"
                  startContent={
                    <i className="icon-[lucide--shield-alert] size-3" />
                  }
                >
                  {getSeverityLabel(report.aiSeverity)}
                </Chip>
              )}
              <Chip
                color={getPriorityColor(report.priority)}
                size="sm"
                variant="flat"
                startContent={<i className="icon-[lucide--flag] size-3" />}
              >
                {getPriorityLabel(report.priority)}
              </Chip>
            </div>

            {/* AI action */}
            {!hasAIAnalysis &&
              planInfo?.planType &&
              planInfo.planType !== "STARTER" && (
                <>
                  {isProcessingAI ? (
                    <AIQueueInlineStatus submissionId={report.id} />
                  ) : (
                    <Button
                      size="sm"
                      color="primary"
                      variant="bordered"
                      startContent={
                        <i className="icon-[lucide--brain] size-3.5" />
                      }
                      isLoading={aiLoading}
                      onPress={handleAnalyzeAI}
                    >
                      Analizar con IA
                    </Button>
                  )}
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
