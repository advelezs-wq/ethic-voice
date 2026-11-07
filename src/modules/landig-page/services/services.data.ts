/**
 * Portafolio de servicios EthicVoice (12 servicios, en el orden del
 * portafolio oficial). Textos: "Portafolio_Servicios_EthicVoice" (nov. 2026).
 * Cada servicio tiene una tarjeta en /services y su detalle en /services/[slug].
 */

export type Service = {
  slug: string;
  /** Número en el portafolio (1–12). */
  number: number;
  title: string;
  /** Descripción: qué hacemos. */
  summary: string;
  /** Alcance, una línea por elemento. */
  scope: string[];
  /** Nota que acompaña el alcance (opcional). */
  scopeNote?: string;
  /** Modalidad de contratación. */
  contracting: string;
  /** Servicio destacado en el índice. */
  featured?: boolean;
  /** Etiquetas cortas para la tarjeta. */
  tags?: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "canal-de-denuncias-y-plataforma",
    number: 1,
    title: "Canal de denuncias y plataforma de gestión",
    summary:
      "Centralizamos la recepción y gestión de reportes para que las organizaciones puedan escuchar a sus grupos de interés, dar seguimiento a los casos y documentar sus actuaciones.",
    scope: [
      "Canal personalizado",
      "Recepción de reportes anónimos o identificados",
      "Comunicación con el denunciante",
      "Expedientes, roles, seguimiento e indicadores",
    ],
    scopeNote:
      "Los canales de recepción y las funciones de asistencia con IA se definen según el plan contratado.",
    contracting: "Suscripción a la plataforma.",
    tags: ["Plataforma"],
  },
  {
    slug: "gestion-tercerizada-de-canales-de-denuncia",
    number: 2,
    title: "Gestión tercerizada de canales de denuncia",
    summary:
      "Administramos los canales de denuncia de la organización con un equipo especializado, sobre la plataforma EthicVoice o sobre las herramientas existentes del cliente.",
    scope: [
      "Recepción y revisión inicial",
      "Clasificación por tipología y criticidad",
      "Identificación de posibles conflictos de interés",
      "Solicitud de información adicional",
      "Escalamiento",
      "Seguimiento de plazos y actuaciones",
      "Documentación del cierre autorizado e informes periódicos",
    ],
    contracting:
      "Servicio recurrente según volumen, canales, horarios y tiempos de atención. Puede contratarse sin adquirir la plataforma EthicVoice.",
    featured: true,
    tags: ["Sobre EthicVoice", "Sobre tus canales actuales"],
  },
  {
    slug: "diseno-e-implementacion-de-sistemas-de-denuncias",
    number: 3,
    title: "Diseño e implementación de sistemas de denuncias",
    summary:
      "Diseñamos y ponemos en marcha un sistema de denuncias adaptado a la estructura, los riesgos y los grupos de interés de cada organización.",
    scope: [
      "Diagnóstico inicial",
      "Política del canal",
      "Protocolo de recepción y gestión",
      "Tipologías y criterios de criticidad",
      "Responsables, permisos y rutas de escalamiento",
      "Configuración, pruebas y formación inicial",
    ],
    contracting: "Proyecto de implementación o actualización.",
  },
  {
    slug: "investigaciones-internas-corporativas",
    number: 4,
    title: "Investigaciones internas corporativas",
    summary:
      "Investigamos presuntos hechos de fraude, corrupción, acoso, conflictos de interés y otras conductas indebidas, con un alcance y una metodología definidos para cada caso.",
    scope: [
      "Valoración del encargo y de la independencia",
      "Plan de investigación",
      "Revisión documental",
      "Entrevistas",
      "Análisis de evidencias",
      "Informe de hallazgos, limitaciones y recomendaciones",
    ],
    contracting: "Por caso o bolsa de horas, con especialistas según la materia.",
  },
  {
    slug: "auditoria-forense-y-analisis-de-evidencias",
    number: 5,
    title: "Auditoría forense y análisis de evidencias",
    summary:
      "Examinamos documentos, operaciones y transacciones para esclarecer posibles irregularidades e identificar sus mecanismos e impactos.",
    scope: [
      "Revisión documental, contable y transaccional",
      "Análisis de inconsistencias",
      "Estimación del impacto cuando la evidencia lo permita",
      "Documentación de hallazgos y recomendaciones de control",
    ],
    scopeNote:
      "El análisis de evidencia digital se incorpora con especialistas cuando se requiera.",
    contracting: "Proyecto especializado según fuentes, volumen y complejidad.",
  },
  {
    slug: "entrevistas-especializadas-de-investigacion",
    number: 6,
    title: "Entrevistas especializadas de investigación",
    summary:
      "Realizamos entrevistas no confrontativas para obtener y contrastar información relevante de denunciantes, testigos y personas involucradas.",
    scope: [
      "Preparación de objetivos y guías",
      "Conducción de entrevistas",
      "Registro conforme a las condiciones acordadas",
      "Identificación de aspectos por corroborar y análisis de la información obtenida",
    ],
    contracting: "Servicio independiente o integrado en una investigación.",
  },
  {
    slug: "asesoria-y-acompanamiento-a-comites-de-etica",
    number: 7,
    title: "Asesoría y acompañamiento a comités de ética",
    summary:
      "Acompañamos a los comités de ética en la definición de sus reglas de funcionamiento y en el análisis y seguimiento de los asuntos de su competencia.",
    scope: [
      "Estructuración del comité y su reglamento",
      "Criterios de actuación",
      "Manejo de conflictos de interés",
      "Preparación de sesiones",
      "Acompañamiento metodológico",
      "Seguimiento de compromisos y recomendaciones",
    ],
    contracting: "Proyecto de estructuración o acompañamiento periódico.",
  },
  {
    slug: "proteccion-al-denunciante-y-prevencion-de-represalias",
    number: 8,
    title: "Protección al denunciante y prevención de represalias",
    summary:
      "Apoyamos el diseño y seguimiento de mecanismos para preservar la confidencialidad y atender posibles represalias relacionadas con reportes de buena fe.",
    scope: [
      "Política de protección y no represalias",
      "Rutas de atención",
      "Criterios para evaluar riesgos",
      "Propuestas de medidas de protección",
      "Seguimiento de alertas y documentación de las acciones adoptadas por la organización",
    ],
    contracting: "Proyecto o acompañamiento asociado a la gestión de casos.",
  },
  {
    slug: "programas-de-etica-e-integridad-corporativa",
    number: 9,
    title: "Programas de ética e integridad corporativa",
    summary:
      "Diseñamos y fortalecemos programas que orientan la conducta organizacional y promueven decisiones coherentes con los valores y compromisos de la empresa.",
    scope: [
      "Diagnóstico de cultura ética",
      "Códigos de conducta",
      "Políticas de integridad, conflictos de interés, regalos y hospitalidades",
      "Mecanismos de orientación y consulta",
      "Plan de implementación y seguimiento",
    ],
    contracting: "Proyecto de diseño o fortalecimiento y acompañamiento periódico.",
  },
  {
    slug: "formacion-en-etica-denuncias-e-investigaciones",
    number: 10,
    title: "Formación en ética, denuncias e investigaciones",
    summary:
      "Desarrollamos capacidades prácticas para prevenir conductas indebidas, utilizar el canal y gestionar reportes e investigaciones de acuerdo con cada responsabilidad.",
    scope: [
      "Formación diferenciada para colaboradores, terceros, gestores, investigadores, comités y directivos",
      "Talleres y casos prácticos",
      "Materiales de apoyo",
      "Evaluaciones y registros de participación",
    ],
    contracting: "Por sesión, curso o programa anual.",
  },
  {
    slug: "comunicacion-y-campanas-de-cultura-etica",
    number: 11,
    title: "Comunicación y campañas de cultura ética",
    summary:
      "Diseñamos campañas para que empleados y terceros conozcan el canal, comprendan su alcance y sepan cómo reportar y dar seguimiento a sus comunicaciones.",
    scope: [
      "Plan de lanzamiento y divulgación continua",
      "Piezas gráficas y textos",
      "Videos y preguntas frecuentes",
      "Contenidos segmentados por público",
      "Mensajes sobre confidencialidad y no represalias",
      "Indicadores de alcance",
    ],
    contracting: "Campaña de lanzamiento o acompañamiento recurrente.",
  },
  {
    slug: "evaluacion-y-mejora-de-sistemas-de-denuncias",
    number: 12,
    title: "Evaluación y mejora de sistemas de denuncias",
    summary:
      "Evaluamos el funcionamiento del sistema para identificar brechas y fortalecer la calidad de la recepción, atención y seguimiento de reportes.",
    scope: [
      "Revisión de accesibilidad, confidencialidad, permisos, trazabilidad y tiempos",
      "Análisis de expedientes e indicadores",
      "Evaluación de procedimientos",
      "Diagnóstico de madurez y plan de mejora priorizado",
    ],
    contracting: "Evaluación puntual o revisión periódica.",
  },
];

export const SERVICE_CONDITIONS =
  "Cada propuesta define entregables, responsables, cobertura y tiempos de atención. Las investigaciones especializadas se contratan con alcance propio. Las decisiones disciplinarias e institucionales corresponden al cliente. Los servicios que requieran especialidades adicionales se estructuran con profesionales o aliados idóneos.";

export const CONTACT_EMAIL = "info@ethicvoice.co";

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

/** mailto prellenado para solicitar información de un servicio. */
export function serviceInfoMailto(service?: Service): string {
  const subject = service
    ? `Solicitud de información: ${service.title}`
    : "Solicitud de información sobre servicios EthicVoice";
  const body = service
    ? `Hola, equipo EthicVoice:\n\nQuisiera recibir información sobre el servicio "${service.title}".\n\nOrganización:\nNombre:\nTeléfono:\n\nGracias.`
    : "Hola, equipo EthicVoice:\n\nQuisiera recibir información sobre sus servicios.\n\nOrganización:\nNombre:\nTeléfono:\n\nGracias.";
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
