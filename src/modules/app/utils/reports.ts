import {
  IRREGULARITY_TYPES,
  REPORT_PRIORITY,
  REPORT_SEVERITY,
  REPORT_STATUS,
  SUBMISSION_SOURCE,
} from "../constants/reports";

export const REPORT_TYPES = [
  "Acoso y discriminación",
  "Corrupción",
  "Mal uso de recursos",
  "Fraude",
  "Violación de políticas",
  "Seguridad laboral",
  "Conflicto de intereses",
  "Otros",
] as const;

export const DEPARTMENTS = [
  "Recursos Humanos",
  "Finanzas",
  "Operaciones",
  "Tecnología",
  "Ventas",
  "Marketing",
  "Legal",
  "Administración",
  "Otros",
] as const;

export function getReportTypeColor(type: string) {
  const colors = {
    "Acoso y discriminación": "danger",
    Corrupción: "warning",
    "Mal uso de recursos": "primary",
    Fraude: "danger",
    "Violación de políticas": "warning",
    "Seguridad laboral": "success",
    "Conflicto de intereses": "secondary",
    Otros: "default",
  };
  return colors[type as keyof typeof colors] || "default";
}

export function formatReportContent(content: string, maxLength: number = 100) {
  if (!content) return "Sin contenido";

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      const textContent = parsed
        .map((item) => item.value || item.text || "")
        .join(" ")
        .trim();

      if (textContent.length > maxLength) {
        return textContent.substring(0, maxLength) + "...";
      }
      return textContent;
    }
  } catch {
    // If it's not JSON, treat as plain text
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + "...";
    }
    return content;
  }

  return content;
}

export const formatDate = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return new Date(dateString).toLocaleDateString("es-ES", {
    ...defaultOptions,
    ...options,
  });
};

export const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    año: 31536000,
    mes: 2592000,
    semana: 604800,
    día: 86400,
    hora: 3600,
    minuto: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `hace ${interval} ${unit}${interval > 1 ? "s" : ""}`;
    }
  }

  return "hace un momento";
};

export const getIrregularityTypeLabel = (type: string) => {
  return IRREGULARITY_TYPES[type as keyof typeof IRREGULARITY_TYPES] || type;
};

export const getStatusLabel = (status: string) => {
  const labels = {
    [REPORT_STATUS.PENDING]: "Pendiente",
    [REPORT_STATUS.IN_PROGRESS]: "En progreso",
    [REPORT_STATUS.RESOLVED]: "Resuelto",
    [REPORT_STATUS.CLOSED]: "Cerrado",
    [REPORT_STATUS.ARCHIVED]: "Archivado",
  };
  return labels[status as keyof typeof labels] || status;
};

export const getPriorityLabel = (priority: string) => {
  const labels = {
    [REPORT_PRIORITY.URGENT]: "Urgente",
    [REPORT_PRIORITY.HIGH]: "Alta",
    [REPORT_PRIORITY.NORMAL]: "Normal",
    [REPORT_PRIORITY.LOW]: "Baja",
  };
  return labels[priority as keyof typeof labels] || priority;
};

export const getSeverityLabel = (severity: string) => {
  const labels = {
    [REPORT_SEVERITY.CRITICAL]: "Crítica",
    [REPORT_SEVERITY.HIGH]: "Alta",
    [REPORT_SEVERITY.MEDIUM]: "Media",
    [REPORT_SEVERITY.LOW]: "Baja",
    [REPORT_SEVERITY.UNKNOWN]: "Sin evaluar",
  };
  return labels[severity as keyof typeof labels] || severity;
};

export const getSourceLabel = (source: string) => {
  const labels = {
    [SUBMISSION_SOURCE.CUSTOM_FORM]: "Formulario Personalizado",
    [SUBMISSION_SOURCE.ETHIC_LINE]: "Línea Ética",
  };
  return labels[source as keyof typeof labels] || source;
};

export const getStatusColor = (status: string) => {
  const colors = {
    [REPORT_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
    [REPORT_STATUS.IN_PROGRESS]: "bg-blue-100 text-blue-800",
    [REPORT_STATUS.RESOLVED]: "bg-green-100 text-green-800",
    [REPORT_STATUS.CLOSED]: "bg-gray-100 text-gray-800",
    [REPORT_STATUS.ARCHIVED]: "bg-gray-100 text-gray-600",
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export const getPriorityColor = (priority: string) => {
  const colors = {
    [REPORT_PRIORITY.URGENT]: "bg-red-100 text-red-800",
    [REPORT_PRIORITY.HIGH]: "bg-orange-100 text-orange-800",
    [REPORT_PRIORITY.NORMAL]: "bg-blue-100 text-blue-800",
    [REPORT_PRIORITY.LOW]: "bg-green-100 text-green-800",
  };
  return colors[priority as keyof typeof colors] || "bg-blue-100 text-blue-800";
};

export const getSeverityColor = (severity: string) => {
  const colors = {
    [REPORT_SEVERITY.CRITICAL]: "bg-red-100 text-red-800",
    [REPORT_SEVERITY.HIGH]: "bg-orange-100 text-orange-800",
    [REPORT_SEVERITY.MEDIUM]: "bg-yellow-100 text-yellow-800",
    [REPORT_SEVERITY.LOW]: "bg-green-100 text-green-800",
    [REPORT_SEVERITY.UNKNOWN]: "bg-gray-100 text-gray-800",
  };
  return colors[severity as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const isImageFile = (mimeType: string) => {
  return mimeType.startsWith("image/");
};

export const isPdfFile = (mimeType: string) => {
  return mimeType === "application/pdf";
};

export const getFileIcon = (mimeType: string) => {
  if (isImageFile(mimeType)) return "image";
  if (isPdfFile(mimeType)) return "pdf";
  if (mimeType.includes("word")) return "word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "excel";
  return "file";
};

export const parseReportContent = (content: string) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing report content:", error);
    return null;
  }
};

export const generateReportReference = (id: number): string => {
  return `REP-${String(id).padStart(6, "0")}`;
};

export const calculateDaysOverdue = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const isOverdue = (dueDate: string) => {
  return calculateDaysOverdue(dueDate) > 0;
};

export function calculateReportDeadline(
  submittedAt: string,
  severity: string
): {
  deadline: Date;
  daysRemaining: number;
  isOverdue: boolean;
} {
  const submitted = new Date(submittedAt);
  const daysUntilDeadline =
    severity === "HIGH" ? 3 : severity === "MEDIUM" ? 5 : 8;

  const deadline = new Date(submitted);
  deadline.setDate(deadline.getDate() + daysUntilDeadline);

  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    deadline,
    daysRemaining: Math.max(0, daysRemaining),
    isOverdue: daysRemaining < 0,
  };
}
