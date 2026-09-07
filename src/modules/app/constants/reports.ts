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

// Ids canónicos: deben coincidir con IRREGULARITY_TYPES en
// modules/submit/constants/ethicline.constants.ts (fuente de verdad para el
// formulario público). Se mantienen las claves legacy (con guion bajo, y
// "adulteracion"/"mal_desempeno" previas a la fusión/renombre de sep-2026)
// para que reportes históricos sigan mostrando una etiqueta correcta.
export const IRREGULARITY_TYPES = {
  corrupcion: "Corrupción",
  "mal-uso": "Mal uso de bienes",
  "robo-adulteracion": "Robo o adulteración de información",
  "laft-aml": "LA/FT – AML",
  fraude: "Fraude",
  mejora: "Mejora de procesos",
  acoso: "Acoso y discriminación",
  "abuso-poder": "Abuso de poder",
  "reporte-libre": "Reporte Libre",

  // Legacy aliases (reportes creados antes de sep-2026)
  mal_uso_bienes: "Mal uso de bienes",
  "robo-info": "Robo de información",
  robo_informacion: "Robo de información",
  adulteracion: "Adulteración de información",
  mejora_procesos: "Mejora de procesos",
  "mal-desempeno": "Abuso de poder",
  mal_desempeno: "Abuso de poder",
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
