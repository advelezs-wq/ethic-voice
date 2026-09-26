/**
 * Contenido de la landing V5. Todas las cifras y afirmaciones vienen de la
 * versión anterior del sitio (aprobadas por el cliente) — no inventar nuevas.
 */

export const MANIFESTO =
  "Cuando no existe un canal seguro, las personas callan. Las señales se acumulan en correos sueltos y hojas de cálculo, hasta que un día ya no son señales: son una crisis.";

export const FACTS = [
  {
    value: "5%",
    label: "de los ingresos anuales se pierde por fraude en las organizaciones.",
  },
  {
    value: "43%",
    label: "de los fraudes se detecta gracias a una denuncia interna.",
  },
  {
    value: "24/7",
    label: "canal disponible, en el idioma de tu equipo y desde cualquier dispositivo.",
  },
] as const;

export const BEFORE = [
  "Denuncias dispersas entre bandejas de entrada",
  "Anonimato que nadie cree",
  "Seguimiento que depende de una persona",
  "Plazos que vencen sin alerta",
  "Cero indicadores para el comité",
] as const;

export const AFTER = [
  "Un solo canal, multicanal por dentro",
  "Anonimato garantizado de extremo a extremo",
  "Trazabilidad de cada acción, lista para auditoría",
  "Alertas y SLA configurables",
  "Reportes ejecutivos en un clic",
] as const;

export const STEPS = [
  {
    key: "recibe",
    title: "Recibe",
    body: "Formulario web, correo, WhatsApp o teléfono. La persona decide si se identifica; adjunta evidencia sin exponerse.",
    points: ["Formularios a tu medida", "Anónimo o identificado", "Adjuntos protegidos"],
  },
  {
    key: "clasifica",
    title: "Clasifica",
    body: "La IA lee cada denuncia al llegar: categoría, severidad y nivel de riesgo, con una acción sugerida.",
    points: ["Categoría y área", "Severidad y prioridad", "Acción recomendada"],
  },
  {
    key: "investiga",
    title: "Investiga",
    body: "Asigna responsables y conversa con el denunciante sin conocer su identidad. Cada paso queda registrado.",
    points: ["Chat confidencial", "Asignación por rol", "Bitácora auditable"],
  },
  {
    key: "reporta",
    title: "Reporta",
    body: "Tiempos de cierre, tipologías y cumplimiento de SLA, listos para el comité, auditoría y reguladores.",
    points: ["Tableros en tiempo real", "Alertas de vencimiento", "Exportación a PDF"],
  },
] as const;

export const SECURITY_SPECS = [
  { k: "Cifrado", v: "AES-256 en reposo · TLS en tránsito" },
  { k: "Identidad", v: "Anonimato de extremo a extremo" },
  { k: "Accesos", v: "Permisos por rol: investigador, comité, administración" },
  { k: "Registro", v: "Auditoría de cada acción, con fecha y responsable" },
  { k: "Comunicación", v: "Chat bidireccional sin revelar identidades" },
  { k: "Marco", v: "Buenas prácticas ISO 37002 · Directiva UE 2019/1937" },
  { k: "Disponibilidad", v: "99.9%" },
] as const;

export const INDUSTRIES = [
  "Manufactura",
  "Retail",
  "Tecnología",
  "Salud",
  "Servicios financieros",
  "Energía",
  "Agroindustria",
  "Logística",
  "Educación",
  "Construcción",
  "Hotelería",
  "Sector público",
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Un programa de compliance efectivo no depende únicamente de las políticas. Requiere procesos claros, investigaciones imparciales y decisiones oportunas que fortalezcan la confianza en la organización.",
    author: "Francy Lorena Beltrán Rodríguez",
    role: "Director of Corporate Risk, Ethics & Compliance",
    initials: "FB",
  },
  {
    quote:
      "La cultura ética se construye cuando cada colaborador entiende que su voz es escuchada, respetada y protegida. Esa confianza es el verdadero motor del cumplimiento.",
    author: "Catalina Zamudio Leiva",
    role: "Director of Organizational Culture & Sustainability",
    initials: "CZ",
  },
  {
    quote:
      "La tecnología debe simplificar el trabajo del Oficial de Cumplimiento, automatizando tareas repetitivas y permitiendo que el equipo concentre sus esfuerzos en el análisis y la toma de decisiones.",
    author: "Yecid Ávila",
    role: "Technology Director",
    initials: "YA",
  },
] as const;

export const FAQS = [
  {
    q: "¿Quién está obligado a implementar un canal de denuncias?",
    a: "Depende de la legislación aplicable por país, tamaño y sector. EthicVoice facilita la implementación operativa, pero cada organización debe validar su obligación legal con su equipo jurídico.",
  },
  {
    q: "¿Se puede reportar de forma anónima?",
    a: "Sí. El canal puede configurarse para permitir anonimato y también reportes confidenciales, según tu política interna.",
  },
  {
    q: "¿Cuánto tarda la implementación?",
    a: "La configuración inicial suele completarse en días, y el despliegue completo depende de aprobaciones internas, políticas y capacitación del equipo.",
  },
  {
    q: "¿Puedo conversar con la persona denunciante sin revelar su identidad?",
    a: "Sí. El flujo contempla comunicación bidireccional dentro del caso para pedir contexto adicional y dar seguimiento.",
  },
  {
    q: "¿Incluye analítica para comité o compliance?",
    a: "Sí. Puedes revisar estado de casos, tiempos de atención, tipologías y tendencias para tomar decisiones con evidencia.",
  },
  {
    q: "¿Hay permanencia mínima o contratos forzosos?",
    a: "No. Los planes funcionan por suscripción y puedes cambiar de plan o cancelar la renovación desde tu panel de facturación en cualquier momento.",
  },
  {
    q: "¿Qué diferencia a EthicVoice de gestionar denuncias por correo interno?",
    a: "El correo no garantiza anonimato, trazabilidad ni tiempos de respuesta. EthicVoice centraliza cada caso con historial auditable, comunicación confidencial con el denunciante, alertas de vencimiento y reportes ejecutivos para el comité.",
  },
] as const;

export const PREMIUM_JOURNEY = [
  { step: "01", title: "Diagnóstico", desc: "Programa, riesgos y necesidades de tu organización." },
  { step: "02", title: "Diseño a medida", desc: "Landing, canales, flujos e identidad propios." },
  { step: "03", title: "Implementación", desc: "Configuración, migración de datos y capacitación." },
  { step: "04", title: "Mejora continua", desc: "Comunicación interna, cultura y acompañamiento." },
] as const;
