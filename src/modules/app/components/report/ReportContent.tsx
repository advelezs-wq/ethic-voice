/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  FormSubmission,
  ReportContent as ReportContentType,
} from "@/types/reports";
import React from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { formatDate } from "../../utils/reports";
import { ReportAttachments } from "./ReportAttachments";
import { getReportTypeLabel } from "../../utils/dashboard.utils";

interface ReportContentProps {
  report: FormSubmission;
  parsedContent: ReportContentType;
}

export const ReportContent: React.FC<ReportContentProps> = ({
  report,
  parsedContent,
}) => {
  // Extract AI analysis
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

  const translateYesNo = (value: unknown): string => {
    if (typeof value === "boolean") return value ? "Sí" : "No";
    const v = String(value).toLowerCase();
    if (v === "yes") return "Sí";
    if (v === "no") return "No";
    if (v === "unknown") return "No estoy seguro/a";
    return String(value);
  };

  const renderQuestionnaire = (questionnaire: any) => {
    // Safety check for undefined/null questionnaire
    if (!questionnaire || typeof questionnaire !== "object") {
      return (
        <div className="text-gray-500 italic">
          No hay información del cuestionario disponible
        </div>
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
          // Skip only when value is empty (but keep explicit no/false for yes/no questions)
          const isYesNo = yesNoKeys.has(key);
          if (
            !isYesNo &&
            (value === undefined || value === null || value === "")
          ) {
            return null;
          }

          const label = labels[key as keyof typeof labels] || key;
          const displayValue =
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
              ? isYesNo
                ? translateYesNo(value)
                : // Humanize certain fields
                  key === "irregularityType"
                  ? getReportTypeLabel(String(value))
                  : String(value)
              : JSON.stringify(value, null, 2);

          return (
            <div key={key} className="border-l-4 border-blue-900 pl-4">
              <p className="font-medium text-gray-900 mb-1">{label}</p>
              <p className="text-gray-700 whitespace-pre-wrap">
                {displayValue}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAdditionalInformation = () => {
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

    const validFields = fields.filter(
      (field) => field.value && field.value !== "" && field.value !== "no"
    );

    if (validFields.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Información Adicional
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {validFields.map((field) => (
              <div key={field.key} className="border-l-4 border-green-600 pl-4">
                <p className="font-medium text-gray-900 mb-1">{field.label}</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Summary Card */}
      {aiAnalysis && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader className="bg-blue-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <i className="icon-[lucide--brain] size-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Análisis de Inteligencia Artificial
                </h2>
                <p className="text-sm text-gray-600">
                  Procesado el{" "}
                  {formatDate(report.processedAt || report.createdAt)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Summary */}
            {aiAnalysis.summary && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Resumen</h3>
                <p className="text-gray-700">{aiAnalysis.summary}</p>
              </div>
            )}

            {/* Key Findings */}
            {aiAnalysis.keyFindings && aiAnalysis.keyFindings.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Hallazgos Clave
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.keyFindings.map(
                    (finding: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <i className="icon-[lucide--check-circle] size-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{finding}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Involved Parties */}
            {aiAnalysis.involvedParties &&
              aiAnalysis.involvedParties.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Partes Involucradas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiAnalysis.involvedParties.map(
                      (party: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-lg border"
                        >
                          <p className="font-medium text-gray-900">
                            {party.name}
                          </p>
                          <p className="text-sm text-gray-600">{party.role}</p>
                          {party.department && (
                            <p className="text-xs text-gray-500 mt-1">
                              {party.department}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Evidence Mentioned */}
            {aiAnalysis.evidenceMentioned &&
              aiAnalysis.evidenceMentioned.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Evidencia Mencionada
                  </h3>
                  <ul className="space-y-1">
                    {aiAnalysis.evidenceMentioned.map(
                      (evidence: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-gray-700"
                        >
                          <i className="icon-[lucide--file-text] size-4 text-gray-500" />
                          <span>{evidence}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* Recommended Actions */}
            {aiAnalysis.recommendedActions && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Acciones Recomendadas
                </h3>
                <div className="space-y-4">
                  {aiAnalysis.recommendedActions.immediate && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-700 mb-1">
                        Inmediatas
                      </h4>
                      <ul className="space-y-1">
                        {aiAnalysis.recommendedActions.immediate.map(
                          (action: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-red-600"
                            >
                              <i className="icon-[lucide--alert-circle] size-4 mt-0.5" />
                              <span>{action}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  {aiAnalysis.recommendedActions.shortTerm && (
                    <div>
                      <h4 className="text-sm font-semibold text-orange-700 mb-1">
                        Corto Plazo
                      </h4>
                      <ul className="space-y-1">
                        {aiAnalysis.recommendedActions.shortTerm.map(
                          (action: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-orange-600"
                            >
                              <i className="icon-[lucide--clock] size-4 mt-0.5" />
                              <span>{action}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  {aiAnalysis.recommendedActions.investigation && (
                    <div>
                      <h4 className="text-sm font-semibold text-blue-700 mb-1">
                        Investigación
                      </h4>
                      <ul className="space-y-1">
                        {aiAnalysis.recommendedActions.investigation.map(
                          (action: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-blue-600"
                            >
                              <i className="icon-[lucide--search] size-4 mt-0.5" />
                              <span>{action}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  {aiAnalysis.recommendedActions.preventive && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-1">
                        Preventivas
                      </h4>
                      <ul className="space-y-1">
                        {aiAnalysis.recommendedActions.preventive.map(
                          (action: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-green-600"
                            >
                              <i className="icon-[lucide--shield] size-4 mt-0.5" />
                              <span>{action}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confidence and Type */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Chip color="primary" variant="flat">
                Confianza: {aiAnalysis.confidence}%
              </Chip>
              {aiAnalysis.type && (
                <Chip color="secondary" variant="flat">
                  Tipo: {aiAnalysis.type}
                </Chip>
              )}
              {aiAnalysis.suggestedDepartment && (
                <Chip color="warning" variant="flat">
                  Dept. Sugerido: {aiAnalysis.suggestedDepartment}
                </Chip>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Reporter Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            {parsedContent.isAnonymous ? (
              <i className="icon-[lucide--user-round-x] size-6 text-gray-900" />
            ) : (
              <i className="icon-[lucide--user] size-6 text-blue-900" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              Información del Denunciante
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          {parsedContent.isAnonymous ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 font-medium">Reporte Anónimo</p>
              <p className="text-gray-600 text-sm mt-1">
                El denunciante ha elegido mantener su identidad en el anonimato.
              </p>
            </div>
          ) : parsedContent.reporter ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Nombre completo
                </p>
                <p className="text-gray-900">
                  {parsedContent.reporter.firstName}{" "}
                  {parsedContent.reporter.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Género</p>
                <p className="text-gray-900 capitalize">
                  {parsedContent.reporter.gender}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                <p className="text-gray-900">{parsedContent.reporter.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Teléfono
                </p>
                <p className="text-gray-900">{parsedContent.reporter.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Documento de identidad
                </p>
                <p className="text-gray-900">
                  {parsedContent.reporter.idDocument}
                </p>
              </div>
            </div>
          ) : report.reporterName || report.reporterEmail ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.reporterName && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Nombre
                  </p>
                  <p className="text-gray-900">{report.reporterName}</p>
                </div>
              )}
              {report.reporterEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Email
                  </p>
                  <p className="text-gray-900">{report.reporterEmail}</p>
                </div>
              )}
              {report.reporterPhone && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Teléfono
                  </p>
                  <p className="text-gray-900">{report.reporterPhone}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                Información del reportero no disponible
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Los datos del denunciante no están disponibles en este reporte.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Reported Person Information */}
      {parsedContent.reported && parsedContent.reported.firstName && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <i className="icon-[lucide--user] size-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Información del Denunciado
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Nombre completo
                </p>
                <p className="text-gray-900">
                  {parsedContent.reported.firstName}{" "}
                  {parsedContent.reported.lastName}
                </p>
              </div>
              {parsedContent.reported.department && (
                <div className="flex items-center space-x-2">
                  <i className="icon-[lucide--building] size-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Departamento
                    </p>
                    <p className="text-gray-900">
                      {parsedContent.reported.department}
                    </p>
                  </div>
                </div>
              )}
              {parsedContent.reported.position && (
                <div className="flex items-center space-x-2">
                  <i className="icon-[lucide--briefcase] size-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Cargo
                    </p>
                    <p className="text-gray-900">
                      {parsedContent.reported.position}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Report Details */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Detalles del Reporte
          </h2>
        </CardHeader>
        <CardBody>{renderQuestionnaire(parsedContent.questionnaire)}</CardBody>
      </Card>

      {/* Attachments */}
      {report.attachments && report.attachments.length > 0 ? (
        <ReportAttachments attachments={report.attachments} />
      ) : (
        <div className="text-sm text-gray-500 p-4 border border-dashed border-gray-300 rounded-lg">
          📎 Este reporte no tiene archivos adjuntos
        </div>
      )}

      {/* Original Content (for EMAIL reports) */}
      {report.source === "EMAIL" && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <i className="icon-[lucide--mail] size-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Contenido Original del Email
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {(() => {
                  try {
                    const content = JSON.parse(report.content);
                    return (
                      content.original ||
                      content.originalContent ||
                      "No disponible"
                    );
                  } catch {
                    return "Error al procesar contenido";
                  }
                })()}
              </pre>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Metadata intentionally minimized: no technical data shown */}

      {/* Additional Information */}
      {renderAdditionalInformation()}
    </div>
  );
};
