"use client";

import { FormSubmission, ReportContent } from "@/types/reports";
import React from "react";
import { Chip, Tooltip, Progress, Button } from "@heroui/react";
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
import { Spinner } from "@heroui/react";
import { useSubmissionQueueInfo } from "../../hooks/useSubmissionQueueInfo";
import { formatEtaShort } from "../../utils/date.utils";
import { AIQueueInlineStatus } from "../ai/AIQueueInlineStatus";

interface ReportHeaderProps {
  report: FormSubmission;
  parsedContent: ReportContent;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  report,
  parsedContent,
}) => {
  // Extract AI analysis from different possible locations
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
    } catch (error) {
      console.error("Error extracting AI analysis:", error);
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

  // Robust confidence fallback
  const severityToConfidence = (sev?: string | null) => {
    if (sev === "HIGH") return 90;
    if (sev === "MEDIUM") return 75;
    if (sev === "LOW") return 60;
    return 70;
  };
  const rawConfidence =
    typeof aiAnalysis?.confidence === "number" && aiAnalysis.confidence > 0
      ? aiAnalysis.confidence
      : (report.metadata as any)?.analysisConfidence;
  const confidenceForChip = Math.round(
    typeof rawConfidence === "number" && rawConfidence > 0
      ? rawConfidence
      : severityToConfidence(report.aiSeverity as any)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 sm:mb-8 overflow-hidden">
      {!hasAIAnalysis &&
        planInfo?.planType &&
        planInfo.planType !== "STARTER" && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-gray-800">
                <div className="font-medium mb-0.5">
                  Pon esta denuncia en nuestra cola de análisis de IA
                </div>
                <div className="text-gray-600">
                  Obtén el resumen, hallazgos y prioridades automáticamente para
                  acelerar la gestión del caso.
                </div>
              </div>
              {optimisticQueued ||
              submissionIdToStatus.get(report.id) === "processing" ? (
                <AIQueueInlineStatus submissionId={report.id} />
              ) : (
                <Button
                  color="primary"
                  startContent={<i className="icon-[lucide--brain] size-4" />}
                  isLoading={aiLoading}
                  onPress={async () => {
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
                          source: report.source as any,
                          metadata: { submissionId: report.id },
                          sync: true,
                          timeoutMs: 12000,
                          fallbackToQueue: true,
                        }),
                      });
                      const payload = await res.json();
                      if (!res.ok || payload?.success === false) {
                        throw new Error("AI process failed");
                      }
                      if (payload.mode === "sync") {
                        showSuccess("Análisis de IA completado");
                        setOptimisticQueued(false);
                        router.refresh();
                      } else {
                        showWarning(
                          "Análisis encolado automáticamente",
                          payload.message
                        );
                        refreshQueue();
                      }
                    } catch (e) {
                      showError("No se pudo procesar el análisis de IA");
                      setOptimisticQueued(false);
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                >
                  Analizar con IA
                </Button>
              )}
            </div>
          </div>
        )}
      {/* Urgent Action Banner */}
      {requiresUrgentAction && (
        <div className="bg-red-500 text-white px-6 py-3 flex items-center gap-3">
          <i className="icon-[lucide--alert-triangle] size-5" />
          <span className="font-semibold">
            Este reporte requiere acción urgente
          </span>
        </div>
      )}

      <div className="p-4 sm:p-8">
        <div className="flex items-start justify-between gap-3 sm:gap-6 mb-4 sm:mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {generateReportReference(report.id)}
              </h1>
              {hasAIAnalysis && (
                <Tooltip
                  content={`Análisis AI con ${confidenceForChip}% de confianza`}
                >
                  <Chip color="primary" variant="flat" size="sm">
                    <i className="icon-[lucide--brain] size-3 mr-1" />
                    AI {confidenceForChip}%
                  </Chip>
                </Tooltip>
              )}
            </div>
            <p className="text-base sm:text-lg text-gray-600">
              {getReportTypeLabel(
                report.type || parsedContent.irregularityType
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Chip
                color={getSeverityColor(report.aiSeverity)}
                size="sm"
                variant="flat"
              >
                AI: {getSeverityLabel(report.aiSeverity)}
              </Chip>
              <Chip
                color={getPriorityColor(report.priority)}
                size="sm"
                variant="flat"
              >
                <i className="icon-[lucide--flag] size-3 mr-1" />
                {getPriorityLabel(report.priority)}
              </Chip>
            </div>
            <Chip
              color={getStatusColor(report.status)}
              size="sm"
              variant="solid"
            >
              {getStatusLabel(report.status)}
            </Chip>
          </div>
        </div>

        {/* AI Summary Section */}
        {(report.aiSummary || aiAnalysis?.summary) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <i className="icon-[lucide--sparkles] size-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Resumen generado por IA
                </h3>
                <p className="text-blue-800 text-sm">
                  {report.aiSummary || aiAnalysis.summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Findings */}
        {aiAnalysis?.keyFindings && aiAnalysis.keyFindings.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <i className="icon-[lucide--search] size-4 text-gray-600" />
                Hallazgos Clave
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {aiAnalysis.keyFindings
                  .slice(0, 3)
                  .map((finding: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <i className="icon-[lucide--check-circle] size-3 text-green-500 mt-1 flex-shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Risk Factors */}
            {aiAnalysis.riskFactors && aiAnalysis.riskFactors.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <i className="icon-[lucide--shield-alert] size-4 text-orange-600" />
                  Factores de Riesgo
                </h4>
                <ul className="space-y-1 text-sm text-orange-800">
                  {aiAnalysis.riskFactors
                    .slice(0, 3)
                    .map((risk: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <i className="icon-[lucide--alert-circle] size-3 text-orange-500 mt-1 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Immediate Actions */}
        {aiAnalysis?.immediateActions &&
          aiAnalysis.immediateActions.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <i className="icon-[lucide--zap] size-4 text-red-600" />
                Acciones Inmediatas Recomendadas
              </h4>
              <ul className="space-y-2 text-sm text-red-800">
                {aiAnalysis.immediateActions.map(
                  (action: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-semibold text-red-900">
                        {idx + 1}.
                      </span>
                      <span>{action}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="icon-[lucide--calendar] size-5 text-blue-900" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Fecha de reporte
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(report.submittedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="icon-[lucide--user] size-5 text-green-900" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Tipo de reporte
              </p>
              <p className="text-sm text-gray-600">
                {parsedContent.isAnonymous ? "Anónimo" : "Identificado"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="icon-[lucide--shield] size-5 text-purple-900" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Fuente</p>
              <p className="text-sm text-gray-600">
                {getSourceLabel(report.source)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="icon-[lucide--building-2] size-5 text-orange-900" />
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <i className="icon-[lucide--building] size-4" />
              <span>
                {report.department?.name ||
                  (parsedContent.reported &&
                    parsedContent.reported.department) ||
                  "Sin departamento"}
              </span>
            </div>
          </div>
        </div>

        {/* AI Confidence Bar */}
        {hasAIAnalysis && confidenceForChip && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Confianza del análisis AI
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {confidenceForChip}%
              </span>
            </div>
            <Progress
              value={confidenceForChip}
              color={
                confidenceForChip >= 80
                  ? "success"
                  : confidenceForChip >= 60
                    ? "warning"
                    : "danger"
              }
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};
