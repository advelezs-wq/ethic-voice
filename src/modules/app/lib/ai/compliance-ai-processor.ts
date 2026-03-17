/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { SubmissionSource } from "@/types/submission.types";
import prisma from "@/modules/prisma/lib/prisma";

// Schema para análisis de compliance
const ComplianceAnalysisSchema = z.object({
  // Categorización principal
  irregularityType: z.enum([
    "acoso",
    "corrupcion",
    "fraude",
    "mal_uso_bienes",
    "robo-info",
    "conflicto-interes",
    "discriminacion",
    "seguridad",
    "otro",
  ]),

  severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]),

  // Resumen ejecutivo
  summary: z
    .string()
    .max(200)
    .describe("Resumen ejecutivo del caso en máximo 200 caracteres"),

  // Análisis detallado
  analysis: z.object({
    description: z
      .string()
      .describe("Descripción detallada de los hechos reportados"),
    keyFindings: z.array(z.string()).describe("Hallazgos clave del análisis"),
    riskAssessment: z
      .string()
      .describe("Evaluación de riesgos para la organización"),
    legalImplications: z
      .array(z.string())
      .describe("Posibles implicaciones legales según normativa colombiana"),
    evidenceAnalysis: z
      .string()
      .describe("Análisis de la evidencia presentada o mencionada"),
  }),

  // Personas involucradas (protegiendo anonimato)
  reported: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      department: z.string().optional(),
      position: z.string().optional(),
    })
    .describe("Persona reportada - solo si se menciona explícitamente"),

  // Acciones recomendadas
  recommendedActions: z.object({
    immediate: z
      .array(z.string())
      .describe("Acciones inmediatas (primeras 48 horas)"),
    shortTerm: z
      .array(z.string())
      .describe("Acciones a corto plazo (primera semana)"),
    investigation: z
      .array(z.string())
      .describe("Pasos de investigación sugeridos"),
    preventive: z
      .array(z.string())
      .describe("Medidas preventivas recomendadas"),
  }),

  // Departamento sugerido
  suggestedDepartment: z
    .string()
    .describe("Departamento más apropiado para manejar el caso"),

  // Metadatos del análisis
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Nivel de confianza del análisis"),
  requiresUrgentAction: z.boolean().describe("Si requiere acción urgente"),
  isAnonymousReport: z
    .boolean()
    .describe("Si el reporte debe tratarse como anónimo"),

  // Campos avanzados opcionales para robustecer el trabajo del oficial
  communicationTemplates: z
    .object({
      reporterAcknowledgement: z.string().optional(),
      internalNotification: z.string().optional(),
    })
    .optional(),
  redactionGuidelines: z.string().optional(),
  dataProtectionNotes: z.string().optional(),
  escalationLevel: z
    .enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),
  riskScore: z.number().min(0).max(100).optional(),
  timeline: z.array(z.string()).optional(),
  relatedSubmissionHints: z.array(z.string()).optional(),

  // Quality and explainability extensions
  confidenceExplanation: z.string().optional(),
  qualityFlags: z
    .object({
      sparseInput: z.boolean().optional(),
      subjectOnly: z.boolean().optional(),
      repeatedPhrases: z.boolean().optional(),
    })
    .optional(),
});

export type ComplianceAnalysis = z.infer<typeof ComplianceAnalysisSchema>;

export class ComplianceAIProcessor {
  private model: ChatOpenAI;
  private parser: StructuredOutputParser<any>;

  constructor() {
    // Some providers/models only support the default temperature. Omit it unless forced via env.
    const tempFromEnv = process.env.OPENAI_TEMPERATURE;
    const temperature = tempFromEnv !== undefined ? Number(tempFromEnv) : undefined;
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_COMPLIANCE_MODEL || "gpt-5",
      ...(temperature !== undefined ? { temperature } : {}),
      apiKey: process.env.OPENAI_API_KEY,
      modelKwargs: {
        // Allow larger outputs to avoid empty/generic responses
        max_completion_tokens: 8000,
        response_format: { type: "json_object" },
      },
    });

    this.parser = StructuredOutputParser.fromZodSchema(
      ComplianceAnalysisSchema as any
    );
  }

  async analyzeReport(
    content: string,
    source: SubmissionSource,
    orgId?: string
  ): Promise<ComplianceAnalysis> {
    const formatInstructions = this.parser.getFormatInstructions();

    // Build lightweight RAG context if orgId provided
    let ragContext = "";
    if (orgId) {
      try {
        const [org, recentJobs] = await Promise.all([
          prisma.organization.findUnique({
            where: { id: orgId },
            include: {
              aiTemplates: { where: { isActive: true }, take: 3 },
              departments: true,
            },
          }),
          prisma.aiProcessingJob.findMany({
            where: { orgId: orgId, status: "completed" },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { processedContent: true, createdAt: true },
          }),
        ]);

        const deptList =
          org?.departments?.map((d: any) => d.name).join(", ") || "";
        const templatesText = (org?.aiTemplates || [])
          .map(
            (t: any) =>
              `• Template: ${t.templateType || "custom"} -> ${t.promptTemplate?.slice(0, 400) || ""}`
          )
          .join("\n");

        const priorCases = (recentJobs || [])
          .map((j: any, idx: number) => {
            try {
              const pc = j.processedContent as any;
              const s =
                pc?.summary ||
                pc?.analysis?.description ||
                JSON.stringify(pc).slice(0, 300);
              return `Caso ${idx + 1}: ${s}`;
            } catch {
              return `Caso ${idx + 1}: (sin resumen)`;
            }
          })
          .join("\n");

        ragContext = `
[CONTEXTO_ORG]
Organización: ${org?.name || orgId}
Departamentos: ${deptList}
Plantillas activas:
${templatesText}
Casos recientes (resumen):
${priorCases}
[FIN_CONTEXTO]
        `.trim();
      } catch (e) {
        ragContext = "";
      }
    }

    const prompt = PromptTemplate.fromTemplate(`
Eres un oficial de cumplimiento y ética empresarial (Colombia y estándares internacionales) con conocimiento de:
- Ley 1778 de 2016 (Ley Antisoborno)
- Circular Externa 100-000011 de 2021 de la Supersociedades (SAGRILAFT)
- Código Sustantivo del Trabajo colombiano
- Ley 1581 de 2012 (Protección de datos personales)
- Directiva (UE) 2019/1937 sobre protección de informantes (whistleblowing)
- ISO 37001:2025 (Sistemas de gestión antisoborno)

PRINCIPIOS FUNDAMENTALES:
1. CONFIDENCIALIDAD: proteger siempre la identidad del denunciante
2. OBJETIVIDAD: analizar hechos sin prejuicios
3. LEGALIDAD: considerar el marco normativo aplicable
4. PROPORCIONALIDAD: recomendaciones proporcionales a la gravedad
5. MÍNIMA SUPOSICIÓN: no inventar hechos; si falta información, indicar "no determinado"

CONTEXTO RAG (si aplica):
{rag_context}

FEW-SHOT (tono y formato):
---
[Ejemplo de entrada]
Fuente: EMAIL
Contenido:
"""
Vi a un jefe solicitando pagos indebidos para adjudicar contratos.
"""
[Ejemplo de salida JSON]
{{
  "irregularityType": "corrupcion",
  "severity": "HIGH",
  "priority": "URGENT",
  "summary": "Presunta solicitud de soborno para adjudicar contratos",
  "analysis": {{
    "description": "Se reporta que un jefe habría solicitado pagos indebidos...",
    "keyFindings": ["Solicitud de pago indebido", "Riesgo penal"],
    "riskAssessment": "Alto impacto legal y reputacional",
    "legalImplications": ["Posible cohecho (CP)", "Régimen SAGRILAFT"],
    "evidenceAnalysis": "No hay pruebas adjuntas; se sugiere recolectar correos y chats"
  }},
  "reported": {{"firstName": "No especificado"}},
  "recommendedActions": {{
    "immediate": ["Preservar evidencia", "Separar funciones involucradas"],
    "shortTerm": ["Entrevistas", "Revisión de contratos"],
    "investigation": ["Trazabilidad de aprobaciones"],
    "preventive": ["Reforzar políticas", "Capacitación antisoborno"]
  }},
  "suggestedDepartment": "Compliance",
  "confidence": 85,
  "requiresUrgentAction": true,
  "isAnonymousReport": true,
  "communicationTemplates": {{
    "reporterAcknowledgement": "Gracias por su denuncia...",
    "internalNotification": "Se inicia investigación por posible soborno..."
  }},
  "redactionGuidelines": "Eliminar datos personales del denunciante",
  "dataProtectionNotes": "Aplicar Ley 1581/2012",
  "escalationLevel": "HIGH",
  "riskScore": 88,
  "timeline": ["2025-08-20: Reporte recibido"],
  "relatedSubmissionHints": ["contratación", "pagos"]
}}
---

ENTREGABLES (STRUCTURED):
- analysis.description: reconstruye cronología (timeline) de hechos
- timeline: lista breve de hitos temporales (opcional)
- analysis.legalImplications: cita artículos/leyes relevantes
- analysis.evidenceAnalysis: evidencia disponible y evidencia faltante concreta
- recommendedActions.immediate/shortTerm: plan de contención y diligencias
- recommendedActions.investigation: pasos específicos, responsables sugeridos y criterios de cierre
- recommendedActions.preventive: controles ISO 37001/SGR (políticas, segregación, capacitaciones)
- suggestedDepartment: unidad responsable inicial
- escalationLevel + requiresUrgentAction: según riesgo a personas, continuidad o legal
- riskScore (0-100): riesgo compuesto
- dataProtectionNotes + redactionGuidelines: instrucciones para anonimización/PD
- communicationTemplates (reporterAcknowledgement, internalNotification): borradores breves
- relatedSubmissionHints: posibles temas/áreas similares para revisión manual

REPORTE A ANALIZAR:
IMPORTANTE: si el texto indica anonimato, nunca infieras ni reproduzcas datos del denunciante.
Fuente: {source}
Contenido:
{content}

{format_instructions}

INSTRUCCIONES ADICIONALES:
- Respeta absolutamente el anonimato cuando aplique
- Sé específico y evita información sensible innecesaria
- Solo entrega un único objeto JSON final que cumpla el formato; no incluyas el ejemplo anterior en la salida
- Evita suposiciones; usa "no determinado" si la evidencia no es suficiente
{sparse_hint}

SALIDA ADICIONAL:
- Añade 'confidenceExplanation' breve (1-2 frases) justificando la confianza.
- Añade 'qualityFlags' con sparseInput/subjectOnly/repeatedPhrases según aplique.
`);

    const input = await prompt.format({
      content,
      source,
      rag_context: ragContext || "(no disponible)",
      format_instructions: formatInstructions,
      sparse_hint: this.isSparseContent(content)
        ? "- El contenido es escaso o sin cuerpo: documenta explícitamente la insuficiencia de información, marca hallazgos como 'no determinado' y prioriza acciones para obtener evidencias y aclaraciones."
        : "",
    });

    // Prefer structured outputs to avoid parsing errors / empty content
    const structured = this.model.withStructuredOutput(
      ComplianceAnalysisSchema as any,
      { name: "compliance_analysis" }
    );

    try {
      const raw = (await structured.invoke(input)) as any;
      const result: any = raw && typeof raw === "object" ? raw : {};

      // If the model didn't provide a confidence score, derive a calibrated heuristic one
      if (
        typeof result.confidence !== "number" ||
        Number.isNaN(result.confidence) ||
        result.confidence <= 0
      ) {
        result.confidence = this.deriveConfidenceScore(result, content);
      } else {
        // Clamp to [1, 99] to avoid degenerate 0/100 values
        result.confidence = Math.max(1, Math.min(99, Math.round(result.confidence)));
      }

      this.enforceQualityGuards(result, content, source);
      // If model did not include qualityFlags/confidenceExplanation, synthesize them
      result.qualityFlags = result.qualityFlags || this.buildQualityFlags(result, content);
      if (!result.confidenceExplanation) {
        result.confidenceExplanation = this.buildConfidenceExplanation(result, content);
      }
      return result as ComplianceAnalysis;
    } catch (error: any) {
      // If provider rejects temperature, rebuild model without temperature and retry once
      const msg: string = String(error?.message || "");
      if (msg.includes("Unsupported value") && msg.includes("temperature")) {
        const retryModel = new ChatOpenAI({
          modelName: process.env.OPENAI_COMPLIANCE_MODEL || "gpt-5",
          apiKey: process.env.OPENAI_API_KEY,
          modelKwargs: {
            max_completion_tokens: 2000,
            response_format: { type: "json_object" },
          },
        });
        const retryStructured = retryModel.withStructuredOutput(
          ComplianceAnalysisSchema as any,
          { name: "compliance_analysis" }
        );
        try {
          const rawRetry = (await retryStructured.invoke(input)) as any;
          const retried: any = rawRetry && typeof rawRetry === "object" ? rawRetry : {};
          if (
            typeof retried.confidence !== "number" ||
            Number.isNaN(retried.confidence) ||
            retried.confidence <= 0
          ) {
            retried.confidence = this.deriveConfidenceScore(retried, content);
          } else {
            retried.confidence = Math.max(1, Math.min(99, Math.round(retried.confidence)));
          }
          this.enforceQualityGuards(retried, content, source);
          retried.qualityFlags = retried.qualityFlags || this.buildQualityFlags(retried, content);
          if (!retried.confidenceExplanation) {
            retried.confidenceExplanation = this.buildConfidenceExplanation(retried, content);
          }
          return retried as ComplianceAnalysis;
        } catch (e) {
          // continue to plain invoke fallback below
        }
      }

      console.error("Error parsing AI response:", error);
      // Fallback: plain invoke + parser (using current model which may include temperature; acceptable for text parse)
      const response = await this.model.invoke(input);
      try {
        const rawParsed = (await this.parser.parse(String(response.content))) as any;
        const parsed: any = rawParsed && typeof rawParsed === "object" ? rawParsed : {};
        if (
          typeof parsed.confidence !== "number" ||
          Number.isNaN(parsed.confidence) ||
          parsed.confidence <= 0
        ) {
          parsed.confidence = this.deriveConfidenceScore(parsed, content);
        } else {
          parsed.confidence = Math.max(1, Math.min(99, Math.round(parsed.confidence)));
        }
        this.enforceQualityGuards(parsed, content, source);
        parsed.qualityFlags = parsed.qualityFlags || this.buildQualityFlags(parsed, content);
        if (!parsed.confidenceExplanation) {
          parsed.confidenceExplanation = this.buildConfidenceExplanation(parsed, content);
        }
        return parsed as ComplianceAnalysis;
      } catch {
        // Last-resort fallback: return a minimal but valid analysis so jobs don't fail
        return this.buildFallbackAnalysis(content);
      }
    }
  }

  /**
   * Derive a calibrated confidence score [1..99] based on analysis richness and input quality.
   * This heuristic is deterministic and helps when the model omits confidence.
   */
  private deriveConfidenceScore(analysis: any, rawContent: string): number {
    const a = analysis || {};
    const desc: string = a?.analysis?.description || a?.summary || "";
    const keyFindings: any[] = Array.isArray(a?.analysis?.keyFindings)
      ? a.analysis.keyFindings
      : Array.isArray(a?.keyFindings)
      ? a.keyFindings
      : [];
    const legal: any[] = Array.isArray(a?.analysis?.legalImplications)
      ? a.analysis.legalImplications
      : [];
    const evidenceText: string = a?.analysis?.evidenceAnalysis || "";
    const rec = a?.recommendedActions || {};
    const countsNonEmpty = [
      Array.isArray(rec.immediate) && rec.immediate.length > 0,
      Array.isArray(rec.shortTerm) && rec.shortTerm.length > 0,
      Array.isArray(rec.investigation) && rec.investigation.length > 0,
      Array.isArray(rec.preventive) && rec.preventive.length > 0,
    ].filter(Boolean).length;

    // Base score influenced by severity
    let score = 50;
    const sev = String(a?.severity || "MEDIUM").toUpperCase();
    if (sev === "HIGH") score += 10;
    else if (sev === "LOW") score -= 5;

    // Description richness (0..15)
    const descLen = (desc || "").trim().length;
    score += Math.max(0, Math.min(15, Math.floor(descLen / 40))); // +1 per 40 chars up to +15

    // Key findings (0..10)
    score += Math.max(0, Math.min(10, keyFindings.length * 2));

    // Legal + evidence depth (0..10)
    const legalPts = Math.min(5, legal.length * 1.5);
    const evidencePts = Math.min(5, Math.floor((evidenceText.trim().length || 0) / 80));
    score += legalPts + evidencePts;

    // Actionability (0..8)
    score += Math.min(8, countsNonEmpty * 2);

    // Penalize extremely short inputs
    const inputLen = (rawContent || "").trim().length;
    if (inputLen < 200) score -= 8;
    else if (inputLen < 400) score -= 4;

    // Clamp
    score = Math.max(1, Math.min(99, Math.round(score)));
    return score;
  }

  private buildFallbackAnalysis(content: string): ComplianceAnalysis {
    const summary = (content || "").trim().slice(0, 200);
    const description = (content || "").trim().slice(0, 600);
    const confidence = this.deriveConfidenceScore({}, content);
    return {
      irregularityType: "otro",
      severity: "MEDIUM",
      priority: "NORMAL",
      summary,
      suggestedDepartment: "General",
      reported: {},
      analysis: {
        description,
        keyFindings: [],
        riskAssessment: "",
        legalImplications: [],
        evidenceAnalysis: "",
      },
      recommendedActions: {
        immediate: [],
        shortTerm: [],
        investigation: [],
        preventive: [],
      },
      confidence,
      requiresUrgentAction: false,
      isAnonymousReport: true,
      communicationTemplates: {},
      redactionGuidelines: "",
      dataProtectionNotes: "",
      escalationLevel: "NONE",
      riskScore: 0,
      timeline: [],
      relatedSubmissionHints: [],
      confidenceExplanation: "Generado por fallback debido a salida no estructurada",
      qualityFlags: {
        sparseInput: this.isSparseContent(content),
        subjectOnly: /subject:\s*.+/i.test(content) && (content.trim().length < 260),
        repeatedPhrases: /(\b\w+\b)(?:.*\1){3,}/i.test((content || "").toLowerCase()),
      },
    } as ComplianceAnalysis;
  }

  private buildQualityFlags(result: any, content: string) {
    const sparse = this.isSparseContent(content);
    const subjectOnly = /subject:\s*.+/i.test(content) && (content.trim().length < 260);
    const repeatedPhrases = /(\b\w+\b)(?:.*\1){3,}/i.test((content || "").toLowerCase());
    return { sparseInput: sparse, subjectOnly, repeatedPhrases };
  }

  private buildConfidenceExplanation(result: any, content: string) {
    const parts: string[] = [];
    const sparse = this.isSparseContent(content);
    if (sparse) parts.push("entrada escasa");
    const kf = Array.isArray(result?.analysis?.keyFindings) ? result.analysis.keyFindings.length : 0;
    if (kf >= 3) parts.push("múltiples hallazgos");
    const legal = Array.isArray(result?.analysis?.legalImplications) ? result.analysis.legalImplications.length : 0;
    if (legal >= 2) parts.push("implicaciones legales identificadas");
    if (!parts.length) return "calibrado por riqueza del análisis";
    return `base por severidad; señales: ${parts.join(", ")}`;
  }

  // Heurística: contenido escaso/sin contexto
  private isSparseContent(raw: string): boolean {
    const text = (raw || "").replace(/\s+/g, " ").trim();
    if (text.length < 220) return true;
    const hasKeywords = /(acoso|corrup|fraud|robo|violencia|discrimin|soborno|conflicto|denuncia|irregularidad)/i.test(text);
    return !hasKeywords;
  }

  // Post-procesamiento para evitar salidas genéricas y reflejar escasez de info
  private enforceQualityGuards(result: any, content: string, _source: SubmissionSource) {
    if (!result || typeof result !== "object") return;
    const sparse = this.isSparseContent(content);

    const ensureArr = (a: any) => (Array.isArray(a) ? a : []);
    result.summary = typeof result.summary === "string" ? result.summary.trim() : "";
    result.analysis = result.analysis && typeof result.analysis === "object" ? result.analysis : {};
    result.analysis.description = typeof result.analysis.description === "string" ? result.analysis.description.trim() : "";
    result.analysis.keyFindings = ensureArr(result.analysis.keyFindings);
    result.analysis.legalImplications = ensureArr(result.analysis.legalImplications);
    result.recommendedActions = result.recommendedActions && typeof result.recommendedActions === "object" ? result.recommendedActions : {};
    result.recommendedActions.immediate = ensureArr(result.recommendedActions.immediate);
    result.recommendedActions.shortTerm = ensureArr(result.recommendedActions.shortTerm);
    result.recommendedActions.investigation = ensureArr(result.recommendedActions.investigation);
    result.recommendedActions.preventive = ensureArr(result.recommendedActions.preventive);

    if (sparse) {
      const notice = "Reporte sin cuerpo o con insuficiente contexto";
      if (!result.summary) result.summary = notice;
      if (!result.analysis.description || result.analysis.description.length < 120) {
        result.analysis.description = `${notice}. Se requiere información adicional del reportante (qué/cuándo/dónde/cómo, actores, evidencias).`;
      }
      if (result.analysis.keyFindings.length === 0) {
        result.analysis.keyFindings = ["Falta de detalles verificables", "Contenido escaso/no determinante"];
      }
      if (result.recommendedActions.immediate.length === 0) {
        result.recommendedActions.immediate = [
          "Preservar encabezados y metadatos del correo (si aplica)",
          "Abrir canal seguro para ampliar la denuncia (formulario o respuesta)",
        ];
      }
      if (result.recommendedActions.shortTerm.length === 0) {
        result.recommendedActions.shortTerm = [
          "Solicitar cronología mínima de hechos (qué/cuándo/dónde/cómo)",
          "Identificar posibles testigos y evidencias disponibles",
        ];
      }
      if (result.recommendedActions.investigation.length === 0) {
        result.recommendedActions.investigation = [
          "Registrar caso como 'en evaluación' a la espera de ampliación",
          "Definir punto de contacto y plazo para complementar información",
        ];
      }
      result.confidence = Math.min(result.confidence ?? 55, 55);
    }

    // Domain-specific tailoring based on content (e.g., "acoso")
    const lc = (content || "").toLowerCase();
    if (lc.includes("acoso")) {
      // Reclassify if model used "otro" generically with harassment cues
      if (!result.irregularityType || result.irregularityType === "otro") {
        result.irregularityType = "acoso";
      }
      // Ensure actions include harassment-specific steps
      if (!result.recommendedActions.shortTerm.includes("Activar protocolo de acoso laboral y canal de atención")) {
        result.recommendedActions.shortTerm.unshift("Activar protocolo de acoso laboral y canal de atención");
      }
      if (!result.recommendedActions.investigation.includes("Entrevista formal al presunto agresor y testigos con debida diligencia")) {
        result.recommendedActions.investigation.unshift("Entrevista formal al presunto agresor y testigos con debida diligencia");
      }
      if (!result.analysis.legalImplications.includes("Ley 1010 de 2006 (Acoso laboral)")) {
        result.analysis.legalImplications.unshift("Ley 1010 de 2006 (Acoso laboral)");
      }
      // Suggested department if not set
      if (!result.suggestedDepartment || result.suggestedDepartment === "General") {
        result.suggestedDepartment = "Talento Humano";
      }
    }
  }

  /**
   * Detecta si el reporte solicita anonimato
   */
  static detectAnonymityRequest(content: string): boolean {
    const anonymityKeywords = [
      "anónimo",
      "anonimo",
      "anonimato",
      "no revelen mi nombre",
      "no quiero que sepan",
      "temo represalias",
      "miedo a perder mi trabajo",
      "sin revelar mi identidad",
      "confidencial",
      "no mencionen quien soy",
    ];

    const lowerContent = content.toLowerCase();
    return anonymityKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  /**
   * Extrae información de personas mencionadas protegiendo anonimato
   */
  static extractReportedPerson(content: string, protectAnonymity: boolean) {
    if (protectAnonymity) {
      // Si es anónimo, no extraer información que pueda identificar al denunciante
      return {
        firstName: "No especificado",
        lastName: "No especificado",
        department: "Por determinar",
        position: "Por determinar",
      };
    }

    // Aquí podrías implementar extracción más sofisticada
    // Por ahora retornamos valores por defecto
    return {
      firstName: "",
      lastName: "",
      department: "",
      position: "",
    };
  }
}
