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
    subtitle: "Soborno, corrupción y acuerdos irregulares",
    color: "#dc2626", // red-600
  },
  {
    id: "mal-uso",
    title: "Mal uso de bienes",
    subtitle: "Uso indebido de bienes y recursos",
    color: "#ea580c", // orange-600
  },
  {
    id: "robo-adulteracion",
    title: "Robo o adulteración de información",
    subtitle: "Sustracción, alteración o manipulación de información",
    color: "#d97706", // amber-600
  },
  {
    id: "laft-aml",
    title: "LA/FT – AML",
    subtitle:
      "Lavado de activos, financiación del terrorismo y operaciones sospechosas",
    color: "#7c3aed", // violet-600
  },
  {
    id: "fraude",
    title: "Fraude",
    subtitle: "Fraude, robo, hurto y gastos irregulares",
    color: "#dc2626", // red-600
  },
  {
    id: "mejora",
    title: "Mejora de procesos",
    subtitle: "Oportunidades de mejora y fallas de control",
    color: "#16a34a", // green-600
  },
  {
    id: "acoso",
    title: "Acoso y discriminación",
    subtitle: "Acoso, discriminación y malos tratos",
    color: "#b91c1c", // red-700
  },
  {
    id: "abuso-poder",
    title: "Abuso de poder",
    subtitle: "Conflictos de autoridad y conductas inapropiadas",
    color: "#f97316", // orange-500
  },
  {
    id: "reporte-libre",
    title: "Reporte Libre",
    subtitle: "Escriba detalladamente el hecho",
    color: "#6b7280", // gray-500
  },
];

// Opciones de "¿En qué consistió el hecho?" específicas por tipología,
// mostradas en Step3Questions. "reporte-libre" no usa esta lista (va directo
// al textarea libre). Cada lista termina en "Otro" para permitir casos no
// contemplados, siguiendo la propuesta ajustada del cliente (2 sep 2026).
export const FACT_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  corrupcion: [
    "Soborno",
    "Conflicto de intereses",
    "Favorecimiento indebido",
    "Pagos, regalos o beneficios indebidos",
    "Acuerdos irregulares",
    "Tráfico de influencias",
    "Otro",
  ],
  "mal-uso": [
    "Uso no autorizado de bienes",
    "Apropiación de activos",
    "Uso indebido de recursos tecnológicos",
    "Uso indebido de información o recursos corporativos",
    "Daño o pérdida intencional",
    "Uso para beneficio personal",
    "Otro",
  ],
  "robo-adulteracion": [
    "Robo o sustracción de información",
    "Alteración de documentos",
    "Falsificación de información",
    "Manipulación de registros",
    "Eliminación u ocultamiento de información",
    "Divulgación no autorizada",
    "Otro",
  ],
  "laft-aml": [
    "Operación inusual o sospechosa",
    "Posible lavado de activos",
    "Posible financiación del terrorismo",
    "Ocultamiento del beneficiario final",
    "Uso de terceros o intermediarios",
    "Información falsa de una contraparte",
    "Incumplimiento de debida diligencia",
    "Otro",
  ],
  fraude: [
    "Apropiación indebida de recursos",
    "Robo o hurto",
    "Gastos ficticios o irregulares",
    "Facturación irregular",
    "Falsificación de documentos",
    "Manipulación de registros o transacciones",
    "Fraude con proveedores/clientes",
    "Otro",
  ],
  mejora: [
    "Falla de un proceso",
    "Debilidad de controles",
    "Incumplimiento de procedimientos",
    "Ineficiencia operativa",
    "Riesgo no gestionado",
    "Oportunidad de mejora",
    "Otro",
  ],
  acoso: [
    "Acoso laboral",
    "Acoso sexual",
    "Discriminación",
    "Intimidación o amenazas",
    "Maltrato verbal o psicológico",
    "Conductas ofensivas",
    "Represalias",
    "Otro",
  ],
  "abuso-poder": [
    "Abuso de autoridad",
    "Trato arbitrario",
    "Favorecimiento indebido",
    "Presión o coerción",
    "Intimidación",
    "Uso del cargo para beneficio personal",
    "Represalias",
    "Otro",
  ],
  default: [
    "Incumplimiento de políticas",
    "Conducta inapropiada",
    "Situación ética no clasificada",
    "Incumplimiento normativo",
    "Otro",
  ],
};

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
