export const STEPS = [
  "Nuevo reporte",
  "Tipo de Irregularidad",
  "Cuestionario",
  "Evidencias",
];

export const QUESTIONNAIRE_FIELDS = {
  whatHappened: "¿En qué consistió el hecho?",
  howItHappened: "¿Cómo se llevó a cabo?",
  where: "¿Dónde sucedió?",
  when: "¿Cuándo sucedió?",
  hasOtherInvolved: "¿Existen otros involucrados?",
  otherInvolved: "Otros involucrados",
  additionalDetails: "Detalles adicionales",
  freeReport: "Reporte libre",
};

export const DEPARTMENTS = [
  "Administración",
  "Atención al Cliente",
  "Auditoría interna",
  "Compras",
  "Finanzas",
  "Logística",
  "Mantenimiento",
  "Operaciones",
  "Otro",
  "Producción",
  "Recursos Humanos",
  "Seguridad",
  "Sistemas",
  "Tesorería",
  "Ventas",
];

export const POSITIONS = [
  "Analista",
  "Auxiliar",
  "Director",
  "Empleado",
  "Encargado",
  "Gerente",
  "Jefe",
  "Líder",
  "Operador",
  "Otro",
  "Presidente",
  "Supervisor",
  "Empleado Tercerizado",
  "Vicepresidente",
];

export const GENDERS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "otro", label: "Otro" },
  { value: "no-informar", label: "Prefiero no informar" },
];

export const IRREGULARITY_TYPES = [
  {
    id: "corrupcion",
    title: "Corrupción",
    subtitle: "Corrupción y Acuerdos Irregulares",
    color: "#dc2626", // red-600
  },
  {
    id: "mal-uso",
    title: "Mal uso de bienes",
    subtitle: "Mal uso de bienes y servicios",
    color: "#ea580c", // orange-600
  },
  {
    id: "robo-info",
    title: "Robo de información",
    subtitle: "Robo de información interna",
    color: "#d97706", // amber-600
  },
  {
    id: "mejora",
    title: "Mejora de procesos",
    subtitle: "Mejora de Procesos",
    color: "#16a34a", // green-600
  },
  {
    id: "fraude",
    title: "Fraude",
    subtitle: "Fraude, Robo, Hurto y Gastos irregulares",
    color: "#dc2626", // red-600
  },
  {
    id: "adulteracion",
    title: "Adulteración",
    subtitle: "Adulteración de Información",
    color: "#ca8a04", // yellow-600
  },
  {
    id: "acoso",
    title: "Acoso",
    subtitle: "Acoso, discriminación y malos tratos",
    color: "#b91c1c", // red-700
  },
  {
    id: "mal-desempeno",
    title: "Mal desempeño",
    subtitle: "Mal desempeño y Abuso de Poder",
    color: "#f97316", // orange-500
  },
  {
    id: "reporte-libre",
    title: "Reporte Libre",
    subtitle: "Escriba detalladamente el hecho",
    color: "#6b7280", // gray-500
  },
];

export const REPORT_STATUS = {
  NEW: "new",
  IN_PROGRESS: "progress",
  CLOSED: "closed",
} as const;

export const SEVERITY_LEVELS = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  UNKNOWN: "UNKNOWN",
} as const;

export const WORK_RELATIONSHIPS = [
  { value: "empleado-actual", label: "Empleado actual" },
  { value: "ex-empleado", label: "Ex-empleado" },
  { value: "proveedor", label: "Proveedor" },
  { value: "cliente", label: "Cliente" },
  { value: "otro", label: "Otro" },
];

export const YES_NO_OPTIONS = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];
