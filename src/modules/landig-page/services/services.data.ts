export type ServiceGroup = {
  slug: string;
  title: string;
  description: string;
  icon?: string; // lucide icon name key, e.g. "lucide--shield-check"
};

export type ServiceItem = {
  id: string;
  title: string;
  groupSlug: string;
  description: string;
  offerings: string[];
  benefits: string[];
  image?: string;
};

// 4 grupos para agrupar los 10 servicios
export const serviceGroups: ServiceGroup[] = [
  {
    slug: "investigacion-y-casos",
    title: "Investigación y Gestión de Casos",
    description:
      "Investigación de denuncias, entrevistas no confrontativas y auditoría forense.",
    icon: "lucide--search",
  },
  {
    slug: "canales-y-programas",
    title: "Canales y Programas de Cumplimiento",
    description:
      "Implementación de canales de denuncia y programas integrales de ética y cumplimiento.",
    icon: "lucide--megaphone",
  },
  {
    slug: "gobernanza-riesgos-datos",
    title: "Gobernanza, Riesgos y Datos",
    description:
      "Gestión de riesgos (SAGRILAFT/SARLAFT/SIPLAFT), gobierno corporativo y protección de datos.",
    icon: "lucide--shield",
  },
  {
    slug: "sostenibilidad-y-legal",
    title: "Sostenibilidad y Asesoría Legal",
    description:
      "Estrategias ESG y servicios jurídicos especializados para tu organización.",
    icon: "lucide--scale",
  },
  {
    slug: "desarrollo-software",
    title: "Desarrollo de Software",
    description:
      "Construcción e implementación de sistemas a medida sobre nuestra plataforma.",
    icon: "lucide--code",
  },
];

export const services: ServiceItem[] = [
  {
    id: "desarrollo-tecnologico-medida",
    title: "Desarrollo Tecnológico a Medida",
    groupSlug: "desarrollo-software",
    description:
      "Construimos y operamos soluciones sobre nuestra plataforma EthicVoice: desde chat con IA hasta analíticas ejecutivas, integradas y listas para producción.",
    image: "/services/service-1.webp",
    offerings: [
      "Chat y Asistente Andi IA",
      "Automatizaciones con IA",
      "Resúmenes automáticos por correo",
      "Sistema de tickets y seguimiento",
      "Canales omnicanal (Web, Email, WhatsApp)",
      "Notificaciones multicanal",
      "Analíticas y reportes ejecutivos",
      "Integraciones y API",
      "Suscripciones y pagos",
      "Workflows y asignaciones",
    ],
    benefits: [
      "Entrega rápida con alta calidad",
      "Seguridad y privacidad por diseño",
      "Escalabilidad y mantenimiento continuo",
      "Alineación a marca y necesidades del negocio",
    ],
  },
  {
    id: "entrevistas-gestion-casos",
    title: "Entrevistas y Gestión de Casos",
    groupSlug: "investigacion-y-casos",
    description:
      "Implementamos entrevistas no confrontativas para obtener información precisa sin generar resistencia.",
    image: "/services/services-2.webp",
    offerings: [
      "Capacitación en técnicas de entrevista ética",
      "Diseño de protocolos para entrevistas no confrontativas",
      "Asesoría en la gestión de casos desde la denuncia hasta la resolución",
    ],
    benefits: [
      "Información precisa y detallada",
      "Reducción de riesgos legales y reputacionales",
      "Mejora de la cultura basada en confianza y transparencia",
    ],
  },
  {
    id: "investigacion-casos-eticos-cumplimiento",
    title: "Investigación de Casos Éticos y Cumplimiento Normativo",
    groupSlug: "investigacion-y-casos",
    description:
      "Investigación integral de denuncias, análisis normativo y elaboración de informes.",
    image: "/services/services-3.webp",
    offerings: [
      "Investigación exhaustiva de denuncias éticas",
      "Análisis de cumplimiento con normativas vigentes",
      "Informes detallados con recomendaciones",
    ],
    benefits: [
      "Resolución efectiva de casos",
      "Protección de la integridad organizacional",
      "Fortalecimiento de la reputación corporativa",
    ],
  },
  {
    id: "implementacion-canales-denuncia-etica",
    title: "Implementación de Canales de Denuncia Ética",
    groupSlug: "canales-y-programas",
    description:
      "Diseño e implementación de canales confidenciales telefónicos, digitales o presenciales.",
    image: "/services/services-4.webp",
    offerings: [
      "Diseño personalizado de canales",
      "Implementación tecnológica segura",
      "Capacitación y sensibilización para equipos",
    ],
    benefits: [
      "Cultura organizacional ética",
      "Detección temprana de irregularidades",
      "Cumplimiento con normativas de protección a denunciantes",
    ],
  },
  {
    id: "programa-etica-cumplimiento",
    title: "Programa de Ética y Cumplimiento Corporativo",
    groupSlug: "canales-y-programas",
    description:
      "Programas integrales con políticas claras, formación y mecanismos de monitoreo.",
    image: "/services/services-5.webp",
    offerings: [
      "Diseño de políticas y códigos de conducta",
      "Programas de formación y sensibilización",
      "Monitoreo y evaluación continua",
    ],
    benefits: [
      "Entorno laboral ético y transparente",
      "Reducción de riesgos legales y financieros",
      "Mejora de la imagen y reputación",
    ],
  },
  {
    id: "proteccion-datos-habeas-data",
    title: "Asesoría en Protección de Datos y Habeas Data",
    groupSlug: "gobernanza-riesgos-datos",
    description:
      "Cumplimiento con Ley 1581 de 2012: privacidad, bases de datos y derechos de titulares.",
    image: "/services/services-6.webp",
    offerings: [
      "Cumplimiento de la Ley de Habeas Data",
      "Implementación de políticas de protección de datos",
      "Gestión de bases de datos y derechos de titulares",
    ],
    benefits: [
      "Protección de la privacidad",
      "Cumplimiento con normativas vigentes",
      "Prevención de sanciones",
    ],
  },
  {
    id: "gestion-riesgos-gobernanza",
    title: "Gestión de Riesgos y Gobernanza",
    groupSlug: "gobernanza-riesgos-datos",
    description:
      "Consultoría en gestión de riesgos operacionales y de cumplimiento, legal y ético.",
    image: "/services/service-7.webp",
    offerings: [
      "Sistema de Gestión de Riesgo Operacional",
      "SAGRILAFT, SARLAFT, SIPLAFT, AML",
      "Prevención del fraude y PTEE anticorrupción",
    ],
    benefits: [
      "Minimización de riesgos",
      "Eficiencia en gestión de riesgos",
      "Transparencia y ética empresarial",
    ],
  },
  {
    id: "auditoria-forense",
    title: "Auditoría Forense",
    groupSlug: "investigacion-y-casos",
    description:
      "Investigación de fraudes, corrupción e irregularidades con entrevistas y análisis de datos.",
    image: "/services/service-8.webp",
    offerings: [
      "Análisis de documentación y transacciones",
      "Investigación de casos sospechosos",
      "Informes con hallazgos y recomendaciones",
    ],
    benefits: [
      "Resolución efectiva de incidentes",
      "Transparencia organizacional",
      "Protección frente a daños financieros y reputacionales",
    ],
  },
  {
    id: "gobierno-corporativo",
    title: "Diseño e Implementación de Gobierno Corporativo",
    groupSlug: "gobernanza-riesgos-datos",
    description:
      "Soluciones completas para una toma de decisiones ética y responsable.",
    image: "/services/service-9.webp",
    offerings: [
      "Diseño y estructuración del gobierno corporativo",
      "Políticas y procedimientos internos de cumplimiento",
      "Capacitación para alta dirección y junta",
    ],
    benefits: [
      "Mejor toma de decisiones",
      "Confianza y transparencia",
      "Reducción de riesgos legales y de gobernanza",
    ],
  },
  {
    id: "sostenibilidad-desarrollo",
    title: "Sostenibilidad y Desarrollo Empresarial",
    groupSlug: "sostenibilidad-y-legal",
    description:
      "Estrategias de sostenibilidad con enfoque ambiental, social y de gobernanza.",
    image: "/services/service-10.webp",
    offerings: [
      "Evaluación de impacto ESG",
      "Planes de sostenibilidad a medida",
      "Monitoreo y reporte de avances",
    ],
    benefits: [
      "Mejora de reputación",
      "Cumplimiento con estándares internacionales",
      "Atracción de inversionistas y socios",
    ],
  },
  {
    id: "servicios-juridicos",
    title: "Servicios Jurídicos Especializados",
    groupSlug: "sostenibilidad-y-legal",
    description:
      "Asesoría legal robusta y eficiente en múltiples áreas del derecho.",
    image: "/services/service-11.webp",
    offerings: [
      "Derecho Comercial y Corporativo",
      "Asesoría para Juntas Directivas",
      "Derecho Internacional",
      "Propiedad Intelectual",
      "Arbitraje y Litigios",
      "Derecho de la Competencia",
    ],
    benefits: [
      "Protección de intereses comerciales",
      "Cumplimiento normativo",
      "Prevención y resolución eficiente de litigios",
    ],
  },
  // Desarrollo de Software - Sistemas de la plataforma que ofrecemos como servicios tecnológicos
  {
    id: "plataforma-chat-andi-ia",
    title: "Chat y Asistente Andi IA",
    groupSlug: "desarrollo-software",
    description:
      "Implementación del chat seguro con Andi IA para guiar denuncias, responder preguntas frecuentes y asistir a equipos.",
    offerings: [
      "Chat web incrustado y centro de ayuda",
      "Flujos conversacionales guiados por IA",
      "Handoff a equipo humano y registro de conversación",
    ],
    benefits: [
      "Mejor experiencia del denunciante",
      "Reducción de tiempos de respuesta",
      "Disponibilidad 24/7",
    ],
  },
  {
    id: "automatizaciones-ia-procesos",
    title: "Automatizaciones con IA",
    groupSlug: "desarrollo-software",
    description:
      "Automatización de clasificación, priorización y extracción de entidades en reportes para acelerar la gestión.",
    offerings: [
      "Clasificación automática por tema y severidad",
      "Extracción de entidades (personas, lugares, fechas)",
      "Resúmenes ejecutivos y clusterización",
    ],
    benefits: [
      "Tiempos de investigación más cortos",
      "Decisiones mejor informadas",
      "Estandarización del análisis",
    ],
  },
  {
    id: "resumenes-automaticos-email",
    title: "Resúmenes Automáticos por Correo",
    groupSlug: "desarrollo-software",
    description:
      "Envío de digest y resúmenes periódicos con hallazgos clave, métricas y novedades del canal de denuncias.",
    offerings: [
      "Plantillas de email alineadas a marca",
      "Programación diaria/semanal/mensual",
      "Señales de riesgo y KPIs destacadas",
    ],
    benefits: [
      "Información oportuna para la dirección",
      "Seguimiento continuo sin entrar a la plataforma",
      "Mejor comunicación interna",
    ],
  },
  {
    id: "sistema-tickets-seguimiento",
    title: "Sistema de Tickets y Seguimiento",
    groupSlug: "desarrollo-software",
    description:
      "Gestión de casos con estados, asignaciones, SLA, notas internas y línea de tiempo para auditoría completa.",
    offerings: [
      "Estados y tableros por prioridad",
      "Asignaciones y recordatorios",
      "Histórico y bitácora de acciones",
    ],
    benefits: [
      "Trazabilidad de punta a punta",
      "Responsabilidades claras",
      "Mejora del tiempo de resolución",
    ],
  },
  {
    id: "canales-omnicanal-denuncias",
    title: "Canales Omnicanal de Denuncias",
    groupSlug: "desarrollo-software",
    description:
      "Configuración de canales web, email y WhatsApp con encriptación E2E y códigos de seguimiento anónimos.",
    offerings: [
      "Formulario web seguro",
      "Email potenciado con IA",
      "WhatsApp con flujos guiados",
    ],
    benefits: [
      "Accesibilidad para todos",
      "Mayor tasa de reporte",
      "Privacidad y anonimato por diseño",
    ],
  },
  {
    id: "notificaciones-multicanal",
    title: "Notificaciones Multicanal",
    groupSlug: "desarrollo-software",
    description:
      "Sistema de notificaciones por email y app con preferencias por usuario y reglas de eventos.",
    offerings: [
      "Plantillas y segmentos",
      "Eventos de plataforma (nuevos reportes, cambios, vencimientos)",
      "Panel de configuración por usuario",
    ],
    benefits: [
      "Usuarios informados a tiempo",
      "Menos seguimiento manual",
      "Reducción de errores operativos",
    ],
  },
  {
    id: "analiticas-reportes-ejecutivos",
    title: "Analíticas y Reportes Ejecutivos",
    groupSlug: "desarrollo-software",
    description:
      "Dashboards, métricas y exportables para comité de ética y dirección, con KPIs y tendencias.",
    offerings: [
      "KPIs por riesgo, área y tiempo",
      "Exportación y resúmenes ejecutivos",
      "Clustering y tendencias por tema",
    ],
    benefits: [
      "Toma de decisiones basada en datos",
      "Visibilidad de desempeño del programa",
      "Detección temprana de patrones",
    ],
  },
  {
    id: "integraciones-api-webhooks",
    title: "Integraciones y API",
    groupSlug: "desarrollo-software",
    description:
      "Conectores y webhooks para SIEM, HRIS, correo y herramientas internas; SDKs y API REST.",
    offerings: [
      "Webhooks y eventos",
      "Conectores con correo/calendario",
      "Exportación a BI",
    ],
    benefits: [
      "Ecosistema integrado",
      "Menos trabajo manual",
      "Automatización extremo a extremo",
    ],
  },
  {
    id: "suscripciones-pagos",
    title: "Suscripciones y Pagos",
    groupSlug: "desarrollo-software",
    description:
      "Gestión de planes, suscripciones y cobros con gateways como Rebill o Mercado Pago.",
    offerings: [
      "Planes y upgrades",
      "Links de pago y suscripciones",
      "Webhooks de facturación",
    ],
    benefits: [
      "Monetización flexible",
      "Menos fricción de cobro",
      "Visibilidad de ingresos",
    ],
  },
  {
    id: "workflows-asignaciones",
    title: "Workflows y Asignaciones",
    groupSlug: "desarrollo-software",
    description:
      "Diseño de flujos de revisión, reglas de asignación por área y escalamiento con SLA.",
    offerings: [
      "Reglas por área y sensibilidad",
      "Escalamientos y recordatorios",
      "Plantillas de tareas y checklists",
    ],
    benefits: [
      "Coordinación entre equipos",
      "Cumplimiento de SLA",
      "Menos retrabajo",
    ],
  },
];


