/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/report-display.utils.ts
import { ReportItem } from "@/types/reports";
import { SubmissionSource } from "@/types/submission.types";

export interface ExtractedReportInfo {
  title: string;
  category: string;
  departmentAffected: string;
  urgencyIndicator: string;
  mainConcern: string;
  confidence: number | null;
  hasAiAnalysis: boolean;
  keyInsights: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Extracts comprehensive display information from a report
 */
export function extractReportDisplayInfo(
  report: ReportItem
): ExtractedReportInfo {
  try {
    const content =
      typeof report.content === "string"
        ? JSON.parse(report.content)
        : report.content;

    // Check if this report has AI analysis
    const hasAiAnalysis = !!(content.aiAnalysis || report.aiSummary);

    if (hasAiAnalysis) {
      return extractAiAnalyzedReportInfo(report, content);
    } else {
      return extractManualReportInfo(report, content);
    }
  } catch (error) {
    console.error("Error parsing report content:", error);
    return createFallbackDisplayInfo(report);
  }
}

/**
 * Extracts info from AI-analyzed reports
 */
function extractAiAnalyzedReportInfo(
  report: ReportItem,
  content: any
): ExtractedReportInfo {
  const aiAnalysis = content.aiAnalysis || {};

  return {
    title:
      aiAnalysis.displayTitle ||
      generateTitleFromAiAnalysis(content, report) ||
      report.aiSummary?.substring(0, 60) + "..." ||
      "Reporte procesado por IA",

    category:
      aiAnalysis.categoryLabel ||
      getCategoryLabel(report.type || content.irregularityType) ||
      "Sin categorizar",

    departmentAffected:
      aiAnalysis.departmentAffected ||
      content.reported?.department ||
      "Sin especificar",

    urgencyIndicator:
      aiAnalysis.urgencyLevel ||
      (aiAnalysis.requiresUrgentAction ? "CRÍTICO" : report.priority) ||
      "NORMAL",

    mainConcern:
      aiAnalysis.mainConcern ||
      aiAnalysis.keyFindings?.[0] ||
      report.aiSummary?.substring(0, 100) ||
      "Reporte requiere revisión",

    confidence: aiAnalysis.confidence || null,
    hasAiAnalysis: true,

    keyInsights: extractKeyInsights(aiAnalysis),
    riskLevel: determineRiskLevel(report, aiAnalysis),
  };
}

/**
 * Extracts info from manually submitted reports (ETHIC_LINE and API)
 */
function extractManualReportInfo(
  report: ReportItem,
  content: any
): ExtractedReportInfo {
  if (report.source === SubmissionSource.ETHIC_LINE) {
    return {
      title: generateEthicLineTitle(content),
      category: getCategoryLabel(content.irregularityType),
      departmentAffected: content.reported?.department || "Sin especificar",
      urgencyIndicator: report.priority || "NORMAL",
      mainConcern: extractMainConcernFromQuestionnaire(content.questionnaire),
      confidence: null,
      hasAiAnalysis: false,
      keyInsights: extractManualInsights(content),
      riskLevel: mapPriorityToRiskLevel(report.priority),
    };
  }

  // Handle API/manual reports with new ETHIC_LINE compatible structure
  if (report.source === "API") {
    // Check if it's the new ETHIC_LINE compatible format
    if (content.irregularityType && content.questionnaire) {
      return {
        title: generateApiReportTitle(content),
        category: getCategoryLabel(content.irregularityType),
        departmentAffected: extractApiDepartment(content) || "Sin especificar",
        urgencyIndicator: report.priority || "NORMAL",
        mainConcern: extractApiMainConcern(content),
        confidence: null,
        hasAiAnalysis: false,
        keyInsights: extractApiInsights(content),
        riskLevel: mapPriorityToRiskLevel(report.priority),
      };
    }

    // Legacy flat structure support
    return {
      title: content.titulo_reporte || "Reporte Manual",
      category: getCategoryLabel(
        content.tipo_irregularidad || content.irregularityType
      ),
      departmentAffected: "Sin especificar",
      urgencyIndicator: report.priority || "NORMAL",
      mainConcern:
        content.descripcion_detallada ||
        content.description ||
        "Detalles en revisión",
      confidence: null,
      hasAiAnalysis: false,
      keyInsights: extractLegacyApiInsights(content),
      riskLevel: mapPriorityToRiskLevel(report.priority),
    };
  }

  // Custom form or other sources
  return {
    title: extractCustomFormTitle(content),
    category: "Formulario Personalizado",
    departmentAffected: "Sin especificar",
    urgencyIndicator: report.priority || "NORMAL",
    mainConcern: extractFirstMeaningfulContent(content),
    confidence: null,
    hasAiAnalysis: false,
    keyInsights: [],
    riskLevel: mapPriorityToRiskLevel(report.priority),
  };
}

/**
 * Creates fallback info when parsing fails
 */
function createFallbackDisplayInfo(report: ReportItem): ExtractedReportInfo {
  return {
    title: `Reporte REP-${String(report.id).padStart(6, "0")}`,
    category: report.type || "Sin categorizar",
    departmentAffected: report.department?.name || "Sin especificar",
    urgencyIndicator: report.priority || "NORMAL",
    mainConcern: report.aiSummary || "Contenido no disponible",
    confidence: null,
    hasAiAnalysis: !!report.aiSummary,
    keyInsights: [],
    riskLevel: mapPriorityToRiskLevel(report.priority),
  };
}

/**
 * Generates title from AI analysis
 */
function generateTitleFromAiAnalysis(content: any, report: ReportItem): string {
  const irregularityType = content.irregularityType || report.type;
  const department =
    content.reported?.department || content.aiAnalysis?.departmentAffected;

  if (irregularityType && department) {
    const typeLabel = getCategoryLabel(irregularityType);
    return `${typeLabel} - ${department}`;
  }

  if (irregularityType) {
    return getCategoryLabel(irregularityType);
  }

  return "";
}

/**
 * Generates title for EthicVoice (línea ética) reports
 */
function generateEthicLineTitle(content: any): string {
  const irregularityType = content.irregularityType;
  const reportedName =
    content.reported?.firstName || content.reported?.lastName;
  const department = content.reported?.department;

  const typeLabel = getCategoryLabel(irregularityType);

  if (reportedName && department) {
    return `${typeLabel} - ${reportedName} (${department})`;
  } else if (department) {
    return `${typeLabel} - ${department}`;
  } else if (reportedName) {
    return `${typeLabel} - ${reportedName}`;
  } else {
    return typeLabel;
  }
}

/**
 * Generates title for API reports
 */
function generateApiReportTitle(content: any): string {
  // For new ETHIC_LINE compatible structure
  if (content.irregularityType && content.questionnaire) {
    return generateEthicLineTitle(content);
  }

  // Legacy support for flat structure
  const title = content.titulo_reporte || content.title;
  if (title) {
    return title.length > 60 ? title.substring(0, 60) + "..." : title;
  }

  // Fall back to category label
  const irregularityType =
    content.tipo_irregularidad || content.irregularityType;
  const typeLabel = getCategoryLabel(irregularityType);

  // Add location if available
  const location = content.ubicacion || content.location;
  if (location) {
    return `${typeLabel} - ${location}`;
  }

  return typeLabel;
}

/**
 * Extracts department from API reports
 */
function extractApiDepartment(content: any): string {
  // Manual reports don't have department in content
  // This will be "Sin especificar" as expected
  return "Sin especificar";
}

/**
 * Extracts main concern from API reports
 */
function extractApiMainConcern(content: any): string {
  // For new ETHIC_LINE compatible structure
  if (content.questionnaire && content.questionnaire.whatHappened) {
    return content.questionnaire.whatHappened;
  }

  // Legacy support
  return (
    content.descripcion_detallada ||
    content.description ||
    content.titulo_reporte ||
    "Detalles en revisión"
  );
}

/**
 * Extracts insights from API reports
 */
function extractApiInsights(content: any): string[] {
  const insights: string[] = [];

  // For new ETHIC_LINE compatible structure
  if (content.questionnaire) {
    if (content.questionnaire.where) {
      insights.push(`Ubicación: ${content.questionnaire.where}`);
    }

    if (content.questionnaire.when) {
      insights.push(`Fecha: ${content.questionnaire.when}`);
    }

    if (
      content.questionnaire.hasOtherInvolved === "yes" &&
      content.questionnaire.otherInvolved
    ) {
      insights.push(`Involucrados: ${content.questionnaire.otherInvolved}`);
    }

    if (content.manualReportData?.channelType) {
      const channelLabels: Record<string, string> = {
        phone: "Teléfono",
        whatsapp: "WhatsApp",
        email: "Email",
        in_person: "Presencial",
      };
      insights.push(
        `Canal: ${channelLabels[content.manualReportData.channelType] || content.manualReportData.channelType}`
      );
    }

    return insights.slice(0, 3);
  }

  // Legacy support for flat structure
  return extractLegacyApiInsights(content);
}

/**
 * Extracts insights from legacy API reports (flat structure)
 */
function extractLegacyApiInsights(content: any): string[] {
  const insights: string[] = [];

  if (content.ubicacion || content.location) {
    insights.push(`Ubicación: ${content.ubicacion || content.location}`);
  }

  if (content.canal_recepcion) {
    const channelLabels: Record<string, string> = {
      phone: "Teléfono",
      whatsapp: "WhatsApp",
      email: "Email",
      in_person: "Presencial",
    };
    insights.push(
      `Canal: ${channelLabels[content.canal_recepcion] || content.canal_recepcion}`
    );
  }

  if (content.personas_involucradas && content.personas_involucradas !== "NO") {
    insights.push(`Involucrados: ${content.personas_involucradas}`);
  }

  return insights.slice(0, 3);
}

/**
 * Extracts title from custom forms
 */
function extractCustomFormTitle(content: any): string {
  // Try to find meaningful content
  const values = Object.values(content).filter(
    (v) => typeof v === "string" && v.length > 5
  ) as string[];

  if (values.length > 0) {
    const firstValue = values[0];
    return firstValue.length > 50
      ? firstValue.substring(0, 50) + "..."
      : firstValue;
  }

  return "Formulario personalizado";
}

/**
 * Gets user-friendly category labels
 */
function getCategoryLabel(irregularityType: string): string {
  const labels: Record<string, string> = {
    corrupcion: "Corrupción",
    acoso: "Acoso Laboral",
    harassment: "Acoso Laboral", // Manual report type
    "robo-info": "Fuga de Información",
    discriminacion: "Discriminación",
    violencia: "Violencia",
    fraude: "Fraude",
    "conflicto-interes": "Conflicto de Interés",
    "mal-uso-recursos": "Mal Uso de Recursos",
    "mal-uso": "Mal Uso de Recursos",
    "incumplimiento-politicas": "Incumplimiento de Políticas",
    "mal-desempeno": "Mal Desempeño",
    adulteracion: "Adulteración de Documentos",
    "reporte-libre": "Reporte Libre",
    otro: "Otros",
    otros: "Otros",
    indefinido: "Sin Clasificar",
    "N/A": "Sin Categorizar",
  };

  return labels[irregularityType] || irregularityType || "Sin categorizar";
}

/**
 * Extracts main concern from questionnaire
 */
function extractMainConcernFromQuestionnaire(questionnaire: any): string {
  if (!questionnaire) return "Sin detalles disponibles";

  return (
    questionnaire.whatHappened ||
    questionnaire.howItHappened ||
    questionnaire.additionalDetails ||
    "Detalles en revisión"
  );
}

/**
 * Extracts first meaningful content from any object
 */
function extractFirstMeaningfulContent(content: any): string {
  const searchForMeaningfulContent = (obj: any): string => {
    if (typeof obj === "string" && obj.length > 10) {
      return obj;
    }

    if (typeof obj === "object" && obj !== null) {
      for (const value of Object.values(obj)) {
        const result = searchForMeaningfulContent(value);
        if (result) return result;
      }
    }

    return "";
  };

  const result = searchForMeaningfulContent(content);
  return result
    ? result.length > 100
      ? result.substring(0, 100) + "..."
      : result
    : "Contenido requiere revisión";
}

/**
 * Extracts key insights from AI analysis
 */
function extractKeyInsights(aiAnalysis: any): string[] {
  const insights: string[] = [];

  if (aiAnalysis.keyFindings?.length > 0) {
    insights.push(...aiAnalysis.keyFindings.slice(0, 3));
  }

  if (aiAnalysis.riskFactors?.length > 0) {
    insights.push(`Riesgo: ${aiAnalysis.riskFactors[0]}`);
  }

  if (aiAnalysis.immediateActions?.length > 0) {
    insights.push(`Acción: ${aiAnalysis.immediateActions[0]}`);
  }

  return insights.slice(0, 3); // Limit to 3 insights
}

/**
 * Extracts insights from manual reports
 */
function extractManualInsights(content: any): string[] {
  const insights: string[] = [];

  if (content.questionnaire?.where) {
    insights.push(`Ubicación: ${content.questionnaire.where}`);
  }

  if (content.questionnaire?.when) {
    insights.push(`Fecha: ${content.questionnaire.when}`);
  }

  if (content.reported?.position) {
    insights.push(`Cargo: ${content.reported.position}`);
  }

  return insights.slice(0, 3);
}

/**
 * Determines risk level based on report data
 */
function determineRiskLevel(
  report: ReportItem,
  aiAnalysis?: any
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (aiAnalysis?.requiresUrgentAction) {
    return "CRITICAL";
  }

  if (report.priority === "URGENT" || report.aiSeverity === "HIGH") {
    return "HIGH";
  }

  if (report.priority === "HIGH" || report.aiSeverity === "MEDIUM") {
    return "MEDIUM";
  }

  return "LOW";
}

/**
 * Maps priority to risk level
 */
function mapPriorityToRiskLevel(
  priority: string
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const mapping: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
    URGENT: "CRITICAL",
    HIGH: "HIGH",
    NORMAL: "MEDIUM",
    LOW: "LOW",
  };

  return mapping[priority] || "MEDIUM";
}

/**
 * Gets risk level color for UI
 */
export function getRiskLevelColor(riskLevel: string): string {
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
    LOW: "bg-green-100 text-green-800 border-green-200",
  };

  return colors[riskLevel] || colors["MEDIUM"];
}

/**
 * Formats confidence percentage
 */
export function formatConfidence(confidence: number | null): string {
  if (confidence === null) return "N/A";
  return `${Math.round(confidence)}%`;
}

/**
 * Gets appropriate icon for report category
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Corrupción: "icon-[lucide--shield-alert]",
    "Acoso Laboral": "icon-[lucide--user-minus]",
    "Fuga de Información": "icon-[lucide--file-lock]",
    Discriminación: "icon-[lucide--user-minus]",
    Violencia: "icon-[lucide--alert-triangle]",
    Fraude: "icon-[lucide--credit-card]",
    "Conflicto de Interés": "icon-[lucide--git-merge]",
    "Mal Uso de Recursos": "icon-[lucide--coins]",
    "Sin categorizar": "icon-[lucide--help-circle]",
    "Formulario Personalizado": "icon-[lucide--file-text]",
  };

  return icons[category] || "icon-[lucide--file-text]";
}
