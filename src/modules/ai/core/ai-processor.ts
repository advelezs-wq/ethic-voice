/* eslint-disable @typescript-eslint/no-explicit-any */
// app/lib/ai/core/ai-processor.ts
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { SubmissionSource, AIAnalysisResult } from "@/types/submission.types";
import prisma from "@/modules/prisma/lib/prisma";

// Schema for AI Analysis
const AIAnalysisSchema = z.object({
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]),
  summary: z.string().max(200),
  type: z.string(),
  suggestedDepartment: z.string().optional(),
  keyFindings: z.array(z.string()),
  immediateActions: z.array(z.string()),
  riskFactors: z.array(z.string()),
  involvedParties: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      department: z.string().optional(),
    })
  ),
  evidenceMentioned: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

export class AIProcessor {
  private model: ChatOpenAI;
  private classificationModel: ChatOpenAI;
  private parser: StructuredOutputParser<any>;

  constructor() {
    // Use fast model for initial classification
    this.classificationModel = new ChatOpenAI({
      modelName: process.env.OPENAI_CLASSIFIER_MODEL || "gpt-4o-mini",
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
      modelKwargs: { max_completion_tokens: 100 },
    });

    // Use GPT-5 (or env override) for detailed analysis
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_ANALYSIS_MODEL || "gpt-5",
      temperature: 1,
      apiKey: process.env.OPENAI_API_KEY,
      modelKwargs: { max_completion_tokens: 1200 },
    });

    this.parser = StructuredOutputParser.fromZodSchema(AIAnalysisSchema as any);
  }

  async processSubmission(
    content: string,
    source: SubmissionSource,
    orgId: string,
    metadata?: any
  ): Promise<AIAnalysisResult> {
    // Step 1: Quick classification
    const quickClass = await this.quickClassification(content);

    // Step 2: Get organization context
    const orgContext = await this.getOrganizationContext(orgId);

    // Step 3: Full analysis based on severity
    if (quickClass.severity === "LOW" && quickClass.confidence > 80) {
      // For low severity with high confidence, use simplified processing
      return this.simplifiedAnalysis(content, source, quickClass);
    }

    // Step 4: Full analysis for medium/high severity
    return this.fullAnalysis(content, source, orgContext, metadata);
  }

  private async quickClassification(content: string) {
    const prompt = `Analyze this report quickly:
1. Severity (HIGH/MEDIUM/LOW)
2. Confidence in classification (0-100)
3. Key issue in 10 words or less

Report: ${content.substring(0, 500)}

Respond in JSON: {"severity": "...", "confidence": ..., "issue": "..."}`;

    try {
      const response = await this.classificationModel.invoke(prompt);
      return JSON.parse(response.content as string);
    } catch {
      return { severity: "MEDIUM", confidence: 50, issue: "Requires analysis" };
    }
  }

  private async getOrganizationContext(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        departments: true,
        aiTemplates: {
          where: { isActive: true },
        },
      },
    });

    return {
      name: org?.name || "Unknown",
      departments: org?.departments.map((d) => d.name) || [],
      customTemplates: org?.aiTemplates || [],
    };
  }

  private async fullAnalysis(
    content: string,
    source: SubmissionSource,
    orgContext: any,
    metadata?: any
  ): Promise<AIAnalysisResult> {
    const formatInstructions = this.parser.getFormatInstructions();

    // Check for custom templates
    const customTemplate = orgContext.customTemplates.find(
      (t: any) => t.templateType === "analysis" && t.isDefault
    );

    const basePrompt =
      customTemplate?.promptTemplate || this.getDefaultPrompt();

    const prompt = PromptTemplate.fromTemplate(basePrompt);

    const input = await prompt.format({
      content,
      source,
      orgName: orgContext.name,
      departments: orgContext.departments.join(", "),
      metadata: JSON.stringify(metadata || {}),
      format_instructions: formatInstructions,
    });

    const response = await this.model.invoke(input);

    try {
      const parsed = await this.parser.parse(response.content as string);
      return parsed as any;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return this.getFallbackAnalysis();
    }
  }

  private async simplifiedAnalysis(
    content: string,
    source: SubmissionSource,
    quickClass: any
  ): Promise<AIAnalysisResult> {
    return {
      severity: quickClass.severity,
      priority: "NORMAL",
      summary: quickClass.issue || "Reporte de baja prioridad",
      type: "general",
      keyFindings: [quickClass.issue],
      immediateActions: ["Revisar en proceso normal"],
      riskFactors: [],
      involvedParties: [],
      evidenceMentioned: [],
      confidence: quickClass.confidence,
    };
  }

  private getDefaultPrompt(): string {
    return `Eres un analista de cumplimiento y ética corporativa para {orgName}.

Analiza el siguiente reporte con mínima suposición y protección de anonimato del denunciante cuando aplique.
Fuente: {source}
Organización: {orgName}
Departamentos disponibles: {departments}

REPORTE:
{content}

INSTRUCCIONES:
1. Evalúa la SEVERIDAD (impacto legal, reputacional, operacional)
2. Determina PRIORIDAD (según urgencia)
3. Identifica el TIPO de incidente (fraude, acoso, seguridad, etc.)
4. Sugiere el DEPARTAMENTO más apropiado de los disponibles
5. Extrae HALLAZGOS CLAVE con hechos específicos
6. Lista ACCIONES INMEDIATAS concretas y realizables
7. Identifica FACTORES DE RIESGO
8. Extrae PARTES INVOLUCRADAS (sin exponer al denunciante si solicita anonimato)
9. Lista EVIDENCIA mencionada
10. Asigna CONFIANZA (0-100)

{format_instructions}

Evita suposiciones; usa "no determinado" si falta información. No incluyas datos que identifiquen al denunciante si hay solicitud de anonimato.`;
  }

  private getFallbackAnalysis(): AIAnalysisResult {
    return {
      severity: "MEDIUM",
      priority: "NORMAL",
      summary: "Reporte requiere revisión manual",
      type: "sin clasificar",
      keyFindings: ["Procesamiento automático no disponible"],
      immediateActions: ["Asignar a revisor humano"],
      riskFactors: ["No determinados automáticamente"],
      involvedParties: [],
      evidenceMentioned: [],
      confidence: 0,
    };
  }

  async trackUsage(
    orgId: string,
    model: string,
    tokens: number,
    feature: string,
    submissionId?: number
  ) {
    const costPerToken = {
      "gpt-4o-mini": 0.0005 / 1000,
      "gpt-5": 0.02 / 1000,
    } as Record<string, number>;

    const estimatedCost =
      tokens *
      (costPerToken[model as keyof typeof costPerToken] || 0.01 / 1000);

    await prisma.usageTracking.create({
      data: {
        orgId,
        model,
        feature,
        tokens,
        estimatedCost,
        submissionId,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
}
