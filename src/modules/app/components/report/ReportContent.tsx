/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  FormSubmission,
  ReportContent as ReportContentType,
} from "@/types/reports";
import React from "react";
import { Card, CardBody, CardHeader, Chip, Progress } from "@heroui/react";
import { formatDate } from "../../utils/reports";
import { ReportAttachments } from "./ReportAttachments";
import {
  getReportTypeLabel,
  getSeverityColor,
  getSeverityLabel,
} from "../../utils/dashboard.utils";

interface ReportContentProps {
  report: FormSubmission;
  parsedContent: ReportContentType;
}

/* ─── helpers ─── */
function SectionCard({
  icon,
  title,
  colorClass = "bg-blue-600",
  children,
}: {
  icon: string;
  title: string;
  colorClass?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 ${colorClass} rounded-lg`}>
            <i className={`${icon} size-4 text-white`} />
          </div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
      </CardHeader>
      <CardBody className="pt-0">{children}</CardBody>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function ActionList({
  items,
  icon,
  color,
}: {
  items: string[];
  icon: string;
  color: string;
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item: string, idx: number) => (
        <li key={idx} className="flex items-start gap-2 text-sm">
          <i className={`${icon} size-3.5 ${color} mt-0.5 shrink-0`} />
          <span className="text-gray-700">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export const ReportContent: React.FC<ReportContentProps> = ({
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
  const hasAiAnalysis = Boolean(aiAnalysis || report.aiSummary);

  const translateYesNo = (value: unknown): string => {
    if (typeof value === "boolean") return value ? "Sí" : "No";
    const v = String(value).toLowerCase();
    if (v === "yes") return "Sí";
    if (v === "no") return "No";
    if (v === "unknown") return "No estoy seguro/a";
    return String(value);
  };

  const renderQuestionnaire = (questionnaire: any) => {
    if (!questionnaire || typeof questionnaire !== "object") {
      return (
        <p className="text-sm text-gray-400 italic">
          No hay información del cuestionario disponible.
        </p>
      );
    }

    const labels: Record<string, string> = {
      where: "¿Dónde ocurrió?",
      when: "¿Cuándo ocurrió?",
      whatHappened: "¿Qué sucedió?",
      howItHappened: "¿Cómo sucedió?",
      hasOtherInvolved: "¿Hay otras personas involucradas?",
      otherInvolved: "Otras personas involucradas",
      additionalDetails: "Detalles adicionales",
      evidenceAvailable: "¿Hay evidencia disponible?",
      evidenceDescription: "Descripción de la evidencia",
      immediateAction: "¿Se requiere acción inmediata?",
      legalImplications: "Implicaciones legales",
    };

    const yesNoKeys = new Set([
      "hasOtherInvolved",
      "evidenceAvailable",
      "immediateAction",
    ]);

    return (
      <div className="space-y-4">
        {Object.entries(questionnaire).map(([key, value]) => {
          const isYesNo = yesNoKeys.has(key);
          if (
            !isYesNo &&
            (value === undefined || value === null || value === "")
          )
            return null;

          const label = labels[key] || key;
          const displayValue =
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
              ? isYesNo
                ? translateYesNo(value)
                : key === "irregularityType"
                  ? getReportTypeLabel(String(value))
                  : String(value)
              : JSON.stringify(value, null, 2);

          return (
            <div
              key={key}
              className="pl-4 border-l-2 border-blue-200 hover:border-blue-400 transition-colors"
            >
              <p className="text-xs font-semibold text-gray-500 mb-0.5">
                {label}
              </p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {displayValue}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAdditionalInfo = () => {
    const fields = [
      {
        key: "workRelationship",
        label: "Relación laboral con la persona reportada",
        value: parsedContent.workRelationship,
      },
      {
        key: "consultedBefore",
        label: "¿Ha consultado este tema con alguien más?",
        value: translateYesNo(parsedContent.consultedBefore || ""),
      },
      {
        key: "consultationDetails",
        label: "Detalles de la consulta previa",
        value: parsedContent.consultationDetails,
      },
      {
        key: "irregularityType",
        label: "Tipo de irregularidad",
        value: getReportTypeLabel(parsedContent.irregularityType || ""),
      },
    ];

    const valid = fields.filter(
      (f) => f.value && f.value !== "" && f.value !== "no"
    );

    if (valid.length === 0) return null;

    return (
      <SectionCard
        icon="icon-[lucide--info]"
        title="Información adicional"
        colorClass="bg-green-600"
      >
        <div className="space-y-4">
          {valid.map((field) => (
            <div
              key={field.key}
              className="pl-4 border-l-2 border-green-200"
            >
              <p className="text-xs font-semibold text-gray-500 mb-0.5">
                {field.label}
              </p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  };

  return (
    <div className="space-y-5">

      {/* ── AI Analysis ── */}
      {hasAiAnalysis && (
        <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-violet-200 bg-violet-50/60">
            <div className="p-2 bg-violet-600 rounded-xl">
              <i className="icon-[lucide--sparkles] size-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                Análisis de Inteligencia Artificial
              </h2>
              <p className="text-xs text-gray-500">
                Procesado el{" "}
                {formatDate(report.processedAt || report.createdAt)}
              </p>
            </div>
            {aiAnalysis?.severity && (
              <div className="ml-auto">
                <Chip
                  color={getSeverityColor(aiAnalysis.severity)}
                  variant="flat"
                  size="sm"
                  startContent={
                    <i className="icon-[lucide--shield-alert] size-3" />
                  }
                >
                  {getSeverityLabel(aiAnalysis.severity)}
                </Chip>
              </div>
            )}
          </div>

          <div className="p-5 space-y-5">
            {/* Summary */}
            {(aiAnalysis?.summary || report.aiSummary) && (
              <div>
                <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2">
                  Resumen ejecutivo
                </h3>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {aiAnalysis?.summary || report.aiSummary}
                </p>
              </div>
            )}

            {/* Confidence bar */}
            {typeof aiAnalysis?.confidence === "number" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">
                    Confianza del análisis
                  </span>
                  <span className="text-xs font-bold text-gray-800">
                    {aiAnalysis.confidence}%
                  </span>
                </div>
                <Progress
                  value={aiAnalysis.confidence}
                  size="sm"
                  color={
                    aiAnalysis.confidence >= 80
                      ? "success"
                      : aiAnalysis.confidence >= 60
                        ? "warning"
                        : "danger"
                  }
                />
              </div>
            )}

            {/* Findings + Risk Factors grid */}
            {(aiAnalysis?.keyFindings?.length > 0 ||
              aiAnalysis?.riskFactors?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiAnalysis?.keyFindings?.length > 0 && (
                  <div className="bg-white rounded-xl border border-green-100 p-4">
                    <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <i className="icon-[lucide--search] size-3.5" />
                      Hallazgos clave
                    </h4>
                    <ActionList
                      items={aiAnalysis.keyFindings}
                      icon="icon-[lucide--check-circle]"
                      color="text-green-500"
                    />
                  </div>
                )}
                {aiAnalysis?.riskFactors?.length > 0 && (
                  <div className="bg-white rounded-xl border border-orange-100 p-4">
                    <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <i className="icon-[lucide--shield-alert] size-3.5" />
                      Factores de riesgo
                    </h4>
                    <ActionList
                      items={aiAnalysis.riskFactors}
                      icon="icon-[lucide--alert-circle]"
                      color="text-orange-400"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Involved Parties */}
            {aiAnalysis?.involvedParties?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                  Partes involucradas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiAnalysis.involvedParties.map(
                    (party: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-gray-200 p-3"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          {party.name}
                        </p>
                        <p className="text-xs text-gray-500">{party.role}</p>
                        {party.department && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {party.department}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Evidence */}
            {aiAnalysis?.evidenceMentioned?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Evidencia mencionada
                </h4>
                <ul className="space-y-1.5">
                  {aiAnalysis.evidenceMentioned.map(
                    (ev: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <i className="icon-[lucide--file-search] size-3.5 text-gray-400 shrink-0" />
                        {ev}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Immediate actions */}
            {aiAnalysis?.immediateActions?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <i className="icon-[lucide--zap] size-3.5" />
                  Acciones inmediatas recomendadas
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.immediateActions.map(
                    (action: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-red-700 shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="text-red-800">{action}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Recommended actions breakdown */}
            {aiAnalysis?.recommendedActions && (
              <div>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                  Plan de acción recomendado
                </h4>
                <div className="space-y-3">
                  {aiAnalysis.recommendedActions.immediate && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                        <i className="icon-[lucide--alert-circle] size-3.5" />
                        Acciones inmediatas
                      </p>
                      <ActionList
                        items={aiAnalysis.recommendedActions.immediate}
                        icon="icon-[lucide--alert-circle]"
                        color="text-red-500"
                      />
                    </div>
                  )}
                  {aiAnalysis.recommendedActions.shortTerm && (
                    <div>
                      <p className="text-xs font-semibold text-orange-600 mb-1.5 flex items-center gap-1">
                        <i className="icon-[lucide--clock] size-3.5" />
                        Corto plazo
                      </p>
                      <ActionList
                        items={aiAnalysis.recommendedActions.shortTerm}
                        icon="icon-[lucide--clock]"
                        color="text-orange-500"
                      />
                    </div>
                  )}
                  {aiAnalysis.recommendedActions.investigation && (
                    <div>
                      <p className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1">
                        <i className="icon-[lucide--search] size-3.5" />
                        Investigación
                      </p>
                      <ActionList
                        items={aiAnalysis.recommendedActions.investigation}
                        icon="icon-[lucide--search]"
                        color="text-blue-500"
                      />
                    </div>
                  )}
                  {aiAnalysis.recommendedActions.preventive && (
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-1.5 flex items-center gap-1">
                        <i className="icon-[lucide--shield] size-3.5" />
                        Preventivas
                      </p>
                      <ActionList
                        items={aiAnalysis.recommendedActions.preventive}
                        icon="icon-[lucide--shield]"
                        color="text-green-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom chips */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-violet-200">
              {(aiAnalysis?.confidence ||
                (report.metadata as any)?.analysisConfidence) && (
                <Chip color="secondary" variant="flat" size="sm">
                  <i className="icon-[lucide--percent] size-3 mr-1" />
                  Confianza:{" "}
                  {aiAnalysis?.confidence ||
                    (report.metadata as any)?.analysisConfidence}
                  %
                </Chip>
              )}
              {aiAnalysis?.type && (
                <Chip color="default" variant="flat" size="sm">
                  Tipo: {aiAnalysis.type}
                </Chip>
              )}
              {aiAnalysis?.suggestedDepartment && (
                <Chip color="warning" variant="flat" size="sm">
                  <i className="icon-[lucide--building-2] size-3 mr-1" />
                  Depto. sugerido: {aiAnalysis.suggestedDepartment}
                </Chip>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── No AI analysis state ── */}
      {!hasAiAnalysis && (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-center">
          <i className="icon-[lucide--brain] size-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            Sin análisis de IA
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Utiliza el botón &quot;Analizar con IA&quot; en la cabecera para generar un
            resumen y recomendaciones automáticas.
          </p>
        </div>
      )}

      {/* ── Reporter ── */}
      <SectionCard
        icon="icon-[lucide--user]"
        title="Información del denunciante"
        colorClass={parsedContent.isAnonymous ? "bg-gray-500" : "bg-blue-600"}
      >
        {parsedContent.isAnonymous ? (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <i className="icon-[lucide--user-x] size-5 text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Reporte anónimo
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                El denunciante eligió mantener su identidad en el anonimato.
              </p>
            </div>
          </div>
        ) : parsedContent.reporter ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow
              label="Nombre"
              value={`${parsedContent.reporter.firstName} ${parsedContent.reporter.lastName}`}
            />
            {parsedContent.reporter.gender && (
              <InfoRow
                label="Género"
                value={parsedContent.reporter.gender}
              />
            )}
            {parsedContent.reporter.email && (
              <InfoRow label="Email" value={parsedContent.reporter.email} />
            )}
            {parsedContent.reporter.phone && (
              <InfoRow
                label="Teléfono"
                value={parsedContent.reporter.phone}
              />
            )}
            {parsedContent.reporter.idDocument && (
              <InfoRow
                label="Documento"
                value={parsedContent.reporter.idDocument}
              />
            )}
          </div>
        ) : report.reporterName || report.reporterEmail ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {report.reporterName && (
              <InfoRow label="Nombre" value={report.reporterName} />
            )}
            {report.reporterEmail && (
              <InfoRow label="Email" value={report.reporterEmail} />
            )}
            {report.reporterPhone && (
              <InfoRow label="Teléfono" value={report.reporterPhone} />
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              Datos del denunciante no disponibles.
            </p>
          </div>
        )}
      </SectionCard>

      {/* ── Reported Person ── */}
      {parsedContent.reported?.firstName && (
        <SectionCard
          icon="icon-[lucide--user-round-x]"
          title="Información del denunciado"
          colorClass="bg-red-600"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow
              label="Nombre"
              value={`${parsedContent.reported.firstName} ${parsedContent.reported.lastName || ""}`}
            />
            {parsedContent.reported.department && (
              <InfoRow
                label="Departamento"
                value={parsedContent.reported.department}
              />
            )}
            {parsedContent.reported.position && (
              <InfoRow label="Cargo" value={parsedContent.reported.position} />
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Report Details ── */}
      <SectionCard
        icon="icon-[lucide--file-text]"
        title="Detalles del reporte"
        colorClass="bg-indigo-600"
      >
        {renderQuestionnaire(parsedContent.questionnaire)}
      </SectionCard>

      {/* ── Attachments ── */}
      {report.attachments && report.attachments.length > 0 ? (
        <ReportAttachments attachments={report.attachments} />
      ) : (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
          <i className="icon-[lucide--paperclip] size-4" />
          Este reporte no tiene archivos adjuntos.
        </div>
      )}

      {/* ── Original Email Content ── */}
      {report.source === "EMAIL" && (
        <SectionCard
          icon="icon-[lucide--mail]"
          title="Contenido original del email"
          colorClass="bg-blue-500"
        >
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-auto max-h-72">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {(() => {
                try {
                  const content = JSON.parse(report.content);
                  return (
                    content.original ||
                    content.originalContent ||
                    "Contenido no disponible"
                  );
                } catch {
                  return "Error al procesar el contenido";
                }
              })()}
            </pre>
          </div>
        </SectionCard>
      )}

      {/* ── Additional Info ── */}
      {renderAdditionalInfo()}
    </div>
  );
};
