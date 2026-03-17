/* eslint-disable @typescript-eslint/no-explicit-any */
import { Priority, ReportStatus } from "@prisma/client";

// AI Severity type (used for AI analysis)
export type AISeverity = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

// For AI Severity (aiSeverity field)
export function getSeverityColor(
  severity: AISeverity | string
):
  | "default"
  | "success"
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | undefined {
  switch (severity) {
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "primary";
    case "UNKNOWN":
      return "secondary";
    default:
      return "default";
  }
}

// For Report Status (status field from database)
export function getStatusColor(
  status: ReportStatus | string
):
  | "success"
  | "default"
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | undefined {
  switch (status) {
    case "PENDING":
      return "danger";
    case "IN_PROGRESS":
      return "warning";
    case "RESOLVED":
      return "success";
    case "CLOSED":
      return "default";
    case "ARCHIVED":
      return "default";
    default:
      return "default";
  }
}

// For Priority (priority field from database)
export function getPriorityColor(
  priority: Priority | string
):
  | "primary"
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | undefined {
  switch (priority) {
    case "URGENT":
      return "danger";
    case "NORMAL":
      return "warning";
    case "LOW":
      return "primary";
    default:
      return "default";
  }
}

// For AI Severity labels
export function getSeverityLabel(severity: AISeverity | string): string {
  switch (severity) {
    case "HIGH":
      return "Alta";
    case "MEDIUM":
      return "Media";
    case "LOW":
      return "Baja";
    case "UNKNOWN":
      return "Desconocida";
    default:
      return "Desconocida";
  }
}

// For Priority labels
export function getPriorityLabel(priority: Priority | string): string {
  switch (priority) {
    case "URGENT":
      return "Urgente";
    case "NORMAL":
      return "Normal";
    case "LOW":
      return "Baja";
    default:
      return "Desconocida";
  }
}

// For Report Status labels
export function getStatusLabel(status: ReportStatus | string): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "IN_PROGRESS":
      return "En progreso";
    case "RESOLVED":
      return "Resuelto";
    case "CLOSED":
      return "Cerrado";
    case "ARCHIVED":
      return "Archivado";
    default:
      return "Desconocido";
  }
}

// Format report ID with prefix
export function formatReportId(id: number): string {
  return `LIN-${id.toString().padStart(3, "0")}`;
}

// SLA por tipología/etapas (días totales) – basado en ISO 37002
const SLA_BY_TYPE: Record<string, number> = {
  corrupcion: 30,
  "mal uso de bienes": 25,
  "mal uso de recursos": 25,
  "robo de informacion": 18,
  "robo de información": 18,
  "mejora de procesos": 33,
  fraude: 30,
  adulteracion: 25,
  adulteración: 25,
  acoso: 23,
  "mal desempeño": 20,
  "informe libre": 25,
};

// Porcentaje→semaforo
function semaphoreFromPercent(
  percent: number
): "green" | "yellow" | "orange" | "red" {
  if (percent <= 60) return "green";
  if (percent <= 85) return "yellow";
  if (percent <= 100) return "orange";
  return "red";
}

// Normaliza tipología entrante
function normalizeType(type?: string | null): string | null {
  if (!type) return null;
  const t = String(type).toLowerCase().trim();
  return t;
}

export function getSlaTotalDays(
  priorityOrType: string,
  explicitType?: string | null
): number {
  const typeNorm =
    normalizeType(explicitType as string) ||
    normalizeType(String(priorityOrType));
  return (
    (typeNorm && SLA_BY_TYPE[typeNorm]) ||
    (String(priorityOrType) === "URGENT"
      ? 3
      : String(priorityOrType) === "NORMAL"
        ? 5
        : 8)
  );
}

// Calcula texto/porcentaje/estado respecto a SLA total por tipología
export function getDeadlineInfo(
  priorityOrType: Priority | string,
  submittedAt: Date,
  explicitType?: string | null
): {
  remainingDays: number;
  text: string;
  isOverdue: boolean;
  percentConsumed: number;
  semaphore: "green" | "yellow" | "orange" | "red";
} {
  const typeNorm =
    normalizeType(explicitType as string) ||
    normalizeType(String(priorityOrType));
  // SLA por tipología si existe, si no, fallback por prioridad
  const totalDays =
    (typeNorm && SLA_BY_TYPE[typeNorm]) ||
    (String(priorityOrType) === "URGENT"
      ? 3
      : String(priorityOrType) === "NORMAL"
        ? 5
        : 8);

  const daysSinceSubmission = Math.floor(
    (new Date().getTime() - new Date(submittedAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const remaining = totalDays - daysSinceSubmission;
  const percent = Math.round((daysSinceSubmission / totalDays) * 100);
  const semaphore = semaphoreFromPercent(percent);

  if (remaining < 0) {
    return {
      remainingDays: 0,
      text: `Vencido hace ${Math.abs(remaining)} días`,
      isOverdue: true,
      percentConsumed: Math.min(200, percent),
      semaphore: "red",
    };
  }

  if (remaining === 0) {
    return {
      remainingDays: 0,
      text: "Vence hoy",
      isOverdue: false,
      percentConsumed: percent,
      semaphore,
    };
  }

  return {
    remainingDays: remaining,
    text: `${remaining} días restantes`,
    isOverdue: false,
    percentConsumed: percent,
    semaphore,
  };
}

// Get report type label
export function getReportTypeLabel(type: string | null): string {
  if (!type) return "Sin categorizar";

  const typeLabels: Record<string, string> = {
    acoso: "Acoso",
    discriminacion: "Discriminación",
    discriminación: "Discriminación",
    corrupcion: "Corrupción",
    robo: "Robo",
    fraude: "Fraude",
    "conflicto-interes": "Conflicto de interés",
    conflicto_interes: "Conflicto de interés",
    "mal-uso-recursos": "Mal uso de recursos",
    mal_uso_recursos: "Mal uso de recursos",
    "violacion-politicas": "Violación de políticas",
    violacion_politicas: "Violación de políticas",
    seguridad: "Seguridad",
    "robo-info": "Robo de información",
    robo_informacion: "Robo de información",
    robo_información: "Robo de información",
    mejora_procesos: "Mejora de procesos",
    "mejora-procesos": "Mejora de procesos",
    otro: "Otro",
    otros: "Otros",
    indefinido: "Indefinido",
    "N/A": "No aplica",
  };

  const key = String(type).toLowerCase().trim();
  if (typeLabels[key]) return typeLabels[key];

  // Humanize generic slugs like "mejora_procesos" or "no_especificado"
  const humanized = key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/\bDe\b|\bDel\b|\bLa\b|\bEl\b|\bY\b/g, (m) => m.toLowerCase());
  return humanized || "Sin categorizar";
}

// Get source label
export function getSourceLabel(source: string): string {
  const sourceLabels: Record<string, string> = {
    EMAIL: "Correo electrónico",
    ETHIC_LINE: "Línea ética",
    CUSTOM_FORM: "Formulario personalizado",
    API: "Reporte manual",
  };

  return sourceLabels[source] || source;
}

// Extract report summary for display
export function extractReportSummary(report: {
  content: string;
  source: string;
  type: string | null;
  aiSummary: string | null;
  metadata?: any;
}): string {
  try {
    // If we have AI summary, use it
    if (report.aiSummary) {
      return report.aiSummary;
    }

    const content =
      typeof report.content === "string"
        ? JSON.parse(report.content)
        : report.content;

    // Try to get summary from different sources
    if (report.metadata?.aiAnalysis?.summary) {
      return report.metadata.aiAnalysis.summary;
    }

    if (content.processed?.summary) {
      return content.processed.summary;
    }

    if (content.aiAnalysis?.summary) {
      return content.aiAnalysis.summary;
    }

    // For ETHIC_LINE reports
    if (report.source === "ETHIC_LINE") {
      const whatHappened = content.questionnaire?.whatHappened;
      const additionalDetails = content.questionnaire?.additionalDetails;
      return whatHappened || additionalDetails || "Sin descripción disponible";
    }

    // For EMAIL reports
    if (report.source === "EMAIL" && content.original) {
      return content.original.substring(0, 150) + "...";
    }

    return "Sin resumen disponible";
  } catch (error) {
    console.error("Error extracting report summary:", error);
    return "Error al procesar el contenido";
  }
}

export function getSlaStageDays(
  priorityOrType: Priority | string,
  explicitType?: string | null
): {
  ackDays: number;
  assignDays: number;
  investigateDays: number;
  closeDays: number;
  totalDays: number;
} {
  const totalDays = getSlaTotalDays(String(priorityOrType), explicitType);
  const ackDays = 2;
  const assignDays = 3;
  const closeDays = 5;
  const base = ackDays + assignDays + closeDays;
  const investigateDays = Math.max(1, totalDays - base);
  return { ackDays, assignDays, investigateDays, closeDays, totalDays };
}
