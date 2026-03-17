export const REPORT_STATUS_OPTIONS = [
  { key: "PENDING", label: "Pendiente" },
  { key: "IN_PROGRESS", label: "En progreso" },
  { key: "RESOLVED", label: "Resuelto" },
  { key: "CLOSED", label: "Cerrado" },
  { key: "ARCHIVED", label: "Archivado" },
] as const;

export const REPORT_PRIORITY_OPTIONS = [
  { key: "URGENT", label: "Urgente" },
  { key: "HIGH", label: "Alta" },
  { key: "NORMAL", label: "Normal" },
  { key: "LOW", label: "Baja" },
] as const;

export const REPORT_SEVERITY_OPTIONS = [
  { key: "HIGH", label: "Alta" },
  { key: "MEDIUM", label: "Media" },
  { key: "LOW", label: "Baja" },
  { key: "UNKNOWN", label: "Sin evaluar" },
] as const;

export const REPORT_SOURCE_OPTIONS = [
  { key: "ETHIC_LINE", label: "Línea Ética" },
  { key: "CUSTOM_FORM", label: "Formulario personalizado" },
] as const;

export const REPORT_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  ARCHIVED: "ARCHIVED",
} as const;

export const REPORT_PRIORITY = {
  URGENT: "URGENT",
  HIGH: "HIGH",
  NORMAL: "NORMAL",
  LOW: "LOW",
} as const;

export const REPORT_SEVERITY = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  UNKNOWN: "UNKNOWN",
} as const;

export const SUBMISSION_SOURCE = {
  CUSTOM_FORM: "CUSTOM_FORM",
  ETHIC_LINE: "ETHIC_LINE",
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
  API: "API",
} as const;

export const IRREGULARITY_TYPES = {
  acoso: "Acoso, discriminación y malos tratos",
  corrupcion: "Corrupción y Acuerdos Irregulares",
  fraude: "Fraude, Robo, Hurto y Gastos irregulares",
  mal_uso_bienes: "Mal uso de bienes y servicios",
  robo_informacion: "Robo de información interna",
  mejora_procesos: "Mejora de Procesos",
  adulteracion: "Adulteración de Información y Documentación",
  mal_desempeno: "Mal desempeño, Abuso de Poder y Favoritismo",
  reporte_libre: "Reporte Libre",
} as const;

export const ACTIVITY_TYPES = {
  CREATED: "CREATED",
  ASSIGNED: "ASSIGNED",
  STATUS_CHANGED: "STATUS_CHANGED",
  PRIORITY_CHANGED: "PRIORITY_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
  ATTACHMENT_UPLOADED: "ATTACHMENT_UPLOADED",
  NOTE_ADDED: "NOTE_ADDED",
  CUSTOM_EVENT: "CUSTOM_EVENT", // NEW: For manually added events
} as const;
