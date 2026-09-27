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
    <div className="mb-6 overflow-hidden rounded-2xl border border-ev-line bg-white">
      {/* Urgent action banner */}
      {requiresUrgentAction && (
        <div className="flex items-center gap-2.5 bg-[#FBE6E1] px-5 py-2.5 text-sm font-medium text-[#862B1D]">
          <i className="icon-[lucide--alert-triangle] size-4 shrink-0" />
          Esta denuncia requiere acción urgente. Revisa las acciones recomendadas en el análisis.
        </div>
      )}

      <div className="px-5 py-6 sm:px-7">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Left: reference + title */}
          <div className="min-w-0 flex-1">
            {/* Reference badge row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-xs font-medium tracking-wide text-ev-night bg-ev-paper border border-ev-line px-2.5 py-1 rounded-full">
                {generateReportReference(report.id)}
              </span>

              {hasAIAnalysis && (
                <Tooltip
                  content={`La IA clasificó esta denuncia y está ${confidenceForChip}% segura de su análisis. Revísalo siempre antes de decidir.`}
                  placement="bottom"
                >
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-ev-moss bg-ev-signal-wash px-2.5 py-1 rounded-full cursor-help">
                    <i className="icon-[lucide--sparkles] size-3" />
                    Analizada por IA · {confidenceForChip}% de confianza
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
            <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ev-night">
              {getReportTypeLabel(
                report.type || parsedContent.irregularityType
              )}
            </h1>

            {/* Metadata inline row */}
            <div className="mt-2.5 flex items-center gap-4 text-sm text-ev-mute flex-wrap">
              <span className="flex items-center gap-1.5">
                <i className="icon-[lucide--calendar] size-3.5" />
                {formatDate(report.submittedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                {/* La columna isAnonymous es la fuente de verdad; el contenido del
                    formulario no siempre la incluye (antes decía "Identificado"
                    en denuncias anónimas). */}
                {(report.isAnonymous ?? parsedContent.isAnonymous) ? (
                  <>
                    <i className="icon-[lucide--user-x] size-3.5" />
                    Denuncia anónima
                  </>
                ) : (
                  <>
                    <i className="icon-[lucide--user] size-3.5" />
                    Denunciante identificado
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
              {report.isConfidential && (
                <Chip
                  color="danger"
                  size="sm"
                  variant="flat"
                  startContent={<i className="icon-[lucide--lock] size-3" />}
                >
                  Confidencial
                </Chip>
              )}
              {report.reporterDataAnonymized && (
                <Chip
                  color="default"
                  size="sm"
                  variant="flat"
                  startContent={
                    <i className="icon-[lucide--user-round-x] size-3" />
                  }
                >
                  Datos anonimizados
                </Chip>
              )}
              {report.closureRequestedAt && !report.closureApprovedAt && (
                <Chip
                  color="primary"
                  size="sm"
                  variant="flat"
                  startContent={<i className="icon-[lucide--clock] size-3" />}
                >
                  Cierre pendiente de aprobación
                </Chip>
              )}
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
