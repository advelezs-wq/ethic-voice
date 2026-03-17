/* eslint-disable @typescript-eslint/no-explicit-any */
// app/modules/app/services/submission-processor.service.ts
import prisma from "@/modules/prisma/lib/prisma";
import { SubmissionSource } from "@/types/submission.types";
import { Severity, Priority } from "@prisma/client";
import { createTrackingCode } from "@/actions/tracking.actions";
import { ComplianceAIProcessor } from "../lib/ai/compliance-ai-processor";
import { notificationsService } from "./notifications.service";
import { v2 as cloudinary } from "cloudinary";

export class SubmissionProcessorService {
  private aiProcessor: ComplianceAIProcessor;

  constructor() {
    this.aiProcessor = new ComplianceAIProcessor();

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async processSubmission(params: {
    orgId: string;
    content: string;
    source: SubmissionSource;
    metadata?: any;
    reporterInfo?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      isAnonymous: boolean;
    };
    attachments?: Array<{
      filename: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      cloudinaryPublicId?: string;
    }>;
  }) {
    const { orgId, content, source, metadata, reporterInfo, attachments } =
      params;

    // Detect anonymity request
    const requestsAnonymity =
      ComplianceAIProcessor.detectAnonymityRequest(content);
    const isAnonymous = reporterInfo?.isAnonymous || requestsAnonymity;

    // Hard privacy guard: if anonymous, drop reporter PII from memory and enforce in downstream
    const safeReporter = isAnonymous
      ? { name: null, email: null, phone: null, isAnonymous: true }
      : reporterInfo;

    // STEP 1: Fast transaction for deduplication and job creation
    const { job, duplicate, existingSubmission } = await prisma.$transaction(
      async (tx) => {
        // Check if this is an existing submission that needs AI analysis
        if (metadata?.submissionId) {
          const existingSubmission = await tx.formSubmission.findUnique({
            where: { id: metadata.submissionId },
          });

          if (existingSubmission) {
            // Check if it already has AI analysis
            if (existingSubmission.aiSummary) {
              console.log(
                `[QUEUE] Submission ${metadata.submissionId} already has AI analysis, skipping`
              );
              return {
                duplicate: {
                  success: true,
                  submissionId: existingSubmission.id,
                  trackingCode: await createTrackingCode(existingSubmission.id),
                  analysis: existingSubmission.metadata,
                  duplicate: true,
                },
                job: null,
                existingSubmission: null,
              };
            }

            // Return existing submission for AI update
            console.log(
              `[QUEUE] Found existing submission ${metadata.submissionId} without AI analysis, will update it`
            );
            const job = await tx.aiProcessingJob.create({
              data: {
                orgId,
                source,
                rawContent: content,
                status: "processing",
                submissionId: existingSubmission.id, // Link to existing submission
              },
            });

            return { job, duplicate: null, existingSubmission };
          }
        }

        // Double-check for email duplicates (for email-based submissions)
        if (metadata?.emailId) {
          const existingSubmission = await tx.formSubmission.findFirst({
            where: {
              metadata: {
                path: ["emailId"],
                equals: metadata.emailId,
              },
            },
          });

          if (existingSubmission) {
            return {
              duplicate: {
                success: true,
                submissionId: existingSubmission.id,
                trackingCode: await createTrackingCode(existingSubmission.id),
                analysis: existingSubmission.metadata,
                duplicate: true,
              },
              job: null,
              existingSubmission: null,
            };
          }
        }

        // Create processing job for new submission
        const job = await tx.aiProcessingJob.create({
          data: {
            orgId,
            source,
            rawContent: content,
            status: "processing",
          },
        });

        return { job, duplicate: null, existingSubmission: null };
      }
    );

    // Return early if duplicate
    if (duplicate) {
      return duplicate;
    }

    // STEP 2: AI Processing outside transaction (slow operation)
    let analysis;
    try {
      analysis = await this.aiProcessor.analyzeReport(content, source, orgId);
      // Normalize analysis to avoid undefined property access
      analysis = this.sanitizeAnalysis(analysis);
    } catch (aiError) {
      console.error(
        `[ERROR] Error en análisis AI para job ${job.id}:`,
        aiError
      );

      // Update job with failure outside transaction
      await prisma.aiProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage:
            (aiError as { message: string })?.message || "AI analysis failed",
          attempts: { increment: 1 },
        },
      });

      // For webhook responses, we want to return success but queue for retry
      throw new Error(
        `AI processing failed: ${(aiError as { message: string })?.message}`
      );
    }

    // STEP 3: Fast transaction for submission creation or update
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // Create report content
          const reportContent = this.createReportContent(
            analysis,
            content,
            isAnonymous,
            safeReporter
          );

          let submission;

          if (existingSubmission) {
            // Update existing submission with AI analysis
            console.log(
              `[QUEUE] Updating existing submission ${existingSubmission.id} with AI analysis`
            );
            submission = await tx.formSubmission.update({
              where: { id: existingSubmission.id },
              data: {
                // Update with AI fields
                aiSeverity: analysis.severity as Severity,
                aiSummary: analysis.summary,
                priority: analysis.priority as Priority,
                type: analysis.irregularityType,
                processedAt: new Date(),

                // Merge existing metadata with AI analysis
                metadata: {
                  ...((existingSubmission.metadata as object) || {}),
                  // AI analysis metadata
                  processedBy: "ai-compliance",
                  aiVersion: "2.0",
                  analysisConfidence: analysis.confidence,
                  confidenceExplanation: (analysis as any).confidenceExplanation || null,
                  qualityFlags: (analysis as any).qualityFlags || null,
                  requiresUrgentAction: analysis.requiresUrgentAction,
                  processingJobId: job.id,
                  aiProcessedAt: new Date().toISOString(),
                },

                // Update content with AI analysis if it doesn't already have it
                content: JSON.stringify({
                  ...(this.safeJsonParse(
                    existingSubmission.content as string
                  ) as any),
                  aiAnalysis: reportContent.aiAnalysis,
                }),
              },
            });
          } else {
            // Create new submission
            console.log(`[QUEUE] Creating new submission with AI analysis`);
            submission = await tx.formSubmission.create({
              data: {
                orgId,
                content: JSON.stringify(reportContent),
                source,

                // AI fields
                aiSeverity: analysis.severity as Severity,
                aiSummary: analysis.summary,
                priority: analysis.priority as Priority,
                type: analysis.irregularityType,
                status: "PENDING",
                processedAt: new Date(),

                // Reporter info (protected if anonymous)
                isAnonymous,
                reporterName: isAnonymous ? null : safeReporter?.name,
                reporterEmail: isAnonymous ? null : safeReporter?.email,
                reporterPhone: isAnonymous ? null : safeReporter?.phone,

                // Enhanced metadata with deduplication info
                metadata: {
                  source: source,
                  processedBy: "ai-compliance",
                  aiVersion: "2.0",
                  analysisConfidence: analysis.confidence,
                  confidenceExplanation: (analysis as any).confidenceExplanation || null,
                  qualityFlags: (analysis as any).qualityFlags || null,
                  requiresUrgentAction: analysis.requiresUrgentAction,
                  processingJobId: job.id,
                  ...(metadata?.emailId && { emailId: metadata.emailId }),
                  ...(metadata?.contentHash && {
                    contentHash: metadata.contentHash,
                  }),
                  ...(metadata?.deduplicationHash && {
                    deduplicationHash: metadata.deduplicationHash,
                  }),
                  ...(metadata?.alias && { emailAlias: metadata.alias }),
                  processedAt: new Date().toISOString(),
                },
              },
            });
          }

          // Create appropriate activity record
          if (existingSubmission) {
            // Activity for AI analysis update
            await tx.reportActivity.create({
              data: {
                submissionId: submission.id,
                action: "ai_analysis_completed",
                userId: "ai-system",
                userName: "EthicBot AI",
                details: {
                  source,
                  severity: analysis.severity,
                  irregularityType: analysis.irregularityType,
                  confidence: analysis.confidence,
                  isAnonymous,
                  processingJobId: job.id,
                  updated: true,
                },
              },
            });
          } else {
            // Activity for new report creation
            await tx.reportActivity.create({
              data: {
                submissionId: submission.id,
                action: "report_created",
                userId: "ai-system",
                userName: "EthicBot AI",
                details: {
                  source,
                  severity: analysis.severity,
                  irregularityType: analysis.irregularityType,
                  confidence: analysis.confidence,
                  isAnonymous,
                  processingJobId: job.id,
                },
              },
            });
          }

          // Handle urgent actions and set derived fields
          if (analysis.requiresUrgentAction) {
            await tx.reportActivity.create({
              data: {
                submissionId: submission.id,
                action: "urgent_action_required",
                userId: "ai-system",
                userName: "EthicBot AI",
                details: {
                  reason: "Caso crítico detectado por AI",
                  immediateActions:
                    analysis.recommendedActions?.immediate || [],
                  severity: analysis.severity,
                },
              },
            });
          }

          // Ensure priority/status reflect severity/urgent
          const desiredPriority = (analysis.priority as Priority) || (analysis.severity === "HIGH" ? "HIGH" : "NORMAL");
          const desiredStatus = analysis.requiresUrgentAction || analysis.severity === "HIGH" ? "IN_PROGRESS" : "PENDING";
          await tx.formSubmission.update({
            where: { id: submission.id },
            data: {
              priority: desiredPriority,
              status: desiredStatus,
            },
          });

          // Handle assignments
          await this.handleAssignments(tx, submission.id, orgId, analysis);

          // If low confidence or sparse, create an automatic "Información requerida" update
          const isSparse = Boolean((analysis as any)?.qualityFlags?.sparseInput);
          if ((analysis.confidence || 0) <= 55 || isSparse) {
            try {
              await tx.reportUpdate.create({
                data: {
                  submissionId: submission.id,
                  title: "Información requerida",
                  description:
                    "El reporte carece de contexto suficiente. Solicitar al reportante detalles mínimos (qué/cuándo/dónde/cómo), actores y evidencia disponible.",
                  priority: "medium",
                  createdById: "ai-system",
                  createdByName: "EthicBot AI",
                },
              });
              await tx.reportActivity.create({
                data: {
                  submissionId: submission.id,
                  action: "UPDATE_ADDED",
                  userId: "ai-system",
                  userName: "EthicBot AI",
                  details: {
                    title: "Información requerida",
                    reason: "Baja confianza o entrada escasa",
                  },
                },
              });
            } catch {
              // ignore
            }
          }

          // Complete job
          await tx.aiProcessingJob.update({
            where: { id: job.id },
            data: {
              status: "completed",
              submissionId: submission.id,
              processedContent: analysis as any,
              completedAt: new Date(),
            },
          });

          // Update organization counters
          await this.updateOrganizationCounters(tx, orgId, source);

          // Track usage
          await this.trackUsage(tx, orgId, content.length);

          // Process attachments if any
          if (attachments && attachments.length > 0) {
            await this.processAttachments(
              tx,
              submission.id,
              attachments,
              isAnonymous ? "anonymous" : safeReporter?.name || "unknown"
            );
          }

          return {
            success: true,
            submissionId: submission.id,
            trackingCode: await createTrackingCode(submission.id),
            analysis,
          };
        },
        {
          timeout: 10000, // 10 second timeout for this transaction
        }
      );

      // Send notifications after successful processing
      try {
        // Send confirmation email to reporter if email provided
        if (safeReporter?.email && !isAnonymous) {
          await notificationsService.sendConfirmationEmail(
            safeReporter.email,
            result.trackingCode,
            orgId
          );
        }

        // Notify admins about new report
        await notificationsService.notifyReportCreated(
          result.submissionId,
          orgId
        );

        // If urgent, send urgent notifications
        if (analysis.requiresUrgentAction || analysis.severity === "HIGH") {
          await notificationsService.notifyUrgentReport(
            result.submissionId,
            orgId
          );
        }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Don't fail the whole process if notifications fail
      }

      return result;
    } catch (dbError) {
      console.error(
        `❌ Error en creación de submission para job ${job.id}:`,
        dbError
      );

      // Update job with failure
      await prisma.aiProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage:
            (dbError as { message: string })?.message ||
            "Database creation failed",
          attempts: { increment: 1 },
          // Store the analysis for potential retry
          processedContent: analysis as any,
        },
      });

      throw dbError;
    }
  }

  /**
   * Creates the content in ReportContent compatible format
   */
  private createReportContent(
    analysis: any,
    originalContent: string,
    isAnonymous: boolean,
    reporterInfo?: any
  ) {
    const a = analysis || {};
    const aNested = a.analysis || {};

    // Tailor summary for email subject if present to reduce generic outputs
    const subjectMatch = /Subject:\s*(.+)/i.exec(originalContent || "");
    const subjectLine = subjectMatch ? subjectMatch[1].trim().slice(0, 140) : "";

    return {
      isAnonymous,
      reporter: isAnonymous
        ? null
        : {
            firstName: reporterInfo?.name?.split(" ")[0] || "",
            lastName: reporterInfo?.name?.split(" ").slice(1).join(" ") || "",
            gender: "",
            email: reporterInfo?.email || "",
            idDocument: "",
            phone: reporterInfo?.phone || "",
          },
      reported: a?.reported || {
        firstName: "",
        lastName: "",
        department: a?.suggestedDepartment || "Por determinar",
        position: "",
      },
      irregularityType: a?.irregularityType || "otro",
      questionnaire: {
        whatHappened: aNested?.description || a?.summary || "",
        howItHappened: Array.isArray(aNested?.keyFindings)
          ? aNested.keyFindings.join(", ")
          : "",
        where: aNested?.location || "",
        when: aNested?.timeframe || "",
        additionalDetails: aNested?.evidenceAnalysis || "",
        riskAssessment: aNested?.riskAssessment || "",
        legalImplications: Array.isArray(aNested?.legalImplications)
          ? aNested.legalImplications.join("; ")
          : "",
      },
      submittedAt: new Date().toISOString(),

      // Enhanced AI Analysis for better display
      aiAnalysis: {
        severity: a?.severity || "MEDIUM",
        priority: a?.priority || "NORMAL",
        summary: subjectLine && (!a?.summary || a?.summary.length < 10) ? subjectLine : (a?.summary || ""),
        confidence: typeof a?.confidence === "number" ? a.confidence : 0,
        recommendedActions: a?.recommendedActions || {},
        requiresUrgentAction: Boolean(a?.requiresUrgentAction),
        keyFindings: Array.isArray(aNested?.keyFindings)
          ? aNested.keyFindings
          : [],
        involvedParties: Array.isArray(aNested?.involvedParties)
          ? aNested.involvedParties
          : [],
        riskFactors: Array.isArray(aNested?.riskFactors)
          ? aNested.riskFactors
          : [],
        immediateActions: Array.isArray(a?.recommendedActions?.immediate)
          ? a.recommendedActions.immediate
          : [],
        originalContent: (originalContent || "").substring(0, 1000),

        // Enhanced fields for better table display
        displayTitle: this.generateDisplayTitle(a, originalContent),
        categoryLabel: this.getCategoryLabel(a?.irregularityType || "otro"),
        departmentAffected: a?.suggestedDepartment || "Sin especificar",
        urgencyLevel: a?.requiresUrgentAction
          ? "CRÍTICO"
          : a?.severity || "MEDIUM",
        mainConcern:
          (Array.isArray(aNested?.keyFindings) && aNested.keyFindings[0]) ||
          (typeof a?.summary === "string" ? a.summary.substring(0, 100) : "") ||
          "",
      },
    };
  }

  /**
   * Safely parses a JSON string, returning an object or an empty object on failure
   */
  private safeJsonParse(input: string | null | undefined): any {
    try {
      if (!input) return {};
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * Ensures the AI analysis object has the required fields with safe defaults
   */
  private sanitizeAnalysis(input: any) {
    const a = input || {};

    // Ensure core fields
    const analysisBlock = a.analysis && typeof a.analysis === "object" ? a.analysis : {};
    const stripMd = (s: string) => (s || "").replace(/^\*+\s*/g, "").replace(/\s+\*+$/g, "").trim();
    const description: string = stripMd(
      typeof analysisBlock.description === "string" ? analysisBlock.description : ""
    );

    // Summary fallback: use analysis description if model didn't provide a summary
    let summary: string = stripMd(
      typeof a.summary === "string" && a.summary.trim().length > 0
        ? a.summary
        : (description || "")
    );
    if (summary.length < 30 && description) {
      summary = description.substring(0, 160);
    }

    // Normalize recommended actions and auto-generate defaults when empty
    const rec = a.recommendedActions || {};
    const ensureArray = (val: any) => (Array.isArray(val) ? val : []);
    let immediate = ensureArray(rec.immediate);
    let shortTerm = ensureArray(rec.shortTerm);
    let investigation = ensureArray(rec.investigation);
    let preventive = ensureArray(rec.preventive);

    const severity: string = a.severity || "MEDIUM";
    const type: string = a.irregularityType || "otro";

    const push = (arr: string[], items: string[]) => {
      for (const it of items) if (!arr.includes(it)) arr.push(it);
    };

    // Only inject defaults when the input is sparse or the model returned nothing
    const sparse = Boolean(a?.qualityFlags?.sparseInput);
    if (sparse) {
      if (immediate.length === 0) {
        const base = [
          "Preservar encabezados y metadatos (si aplica)",
          "Aperturar canal seguro para ampliar detalles",
        ];
        if (severity === "HIGH") base.push("Notificar a comité de ética y dirección");
        if (type === "robo-info") base.push("Cambio de credenciales y habilitar MFA");
        push(immediate, base);
      }
      if (shortTerm.length === 0) {
        push(shortTerm, [
          "Solicitar cronología mínima (qué/cuándo/dónde/cómo)",
          "Identificar posibles testigos y evidencias",
        ]);
      }
      if (investigation.length === 0) {
        push(investigation, [
          "Registrar caso 'en evaluación' a la espera de ampliación",
          "Definir punto de contacto y plazo para complementar información",
        ]);
      }
      if (preventive.length === 0) {
        push(preventive, [
          "Refuerzo de controles y segregación de funciones",
          "Capacitación focalizada",
        ]);
      }
    }

    // Deduplicate and trim actions
    const dedup = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim())));
    immediate = dedup(immediate);
    shortTerm = dedup(shortTerm);
    investigation = dedup(investigation);
    preventive = dedup(preventive);

    return {
      irregularityType: type,
      severity,
      priority: a.priority || "NORMAL",
      summary,
      suggestedDepartment: a.suggestedDepartment || "General",
      analysis: analysisBlock,
      recommendedActions: {
        immediate,
        shortTerm,
        investigation,
        preventive,
      },
      confidence:
        typeof a.confidence === "number" && a.confidence > 0
          ? a.confidence
          : (severity === "HIGH" ? 90 : severity === "LOW" ? 60 : 75),
      requiresUrgentAction: Boolean(a.requiresUrgentAction),
      isAnonymousReport: Boolean(a.isAnonymousReport),
      communicationTemplates: a.communicationTemplates || {},
      redactionGuidelines: a.redactionGuidelines || "",
      dataProtectionNotes: a.dataProtectionNotes || "",
      escalationLevel: a.escalationLevel || "NONE",
      riskScore: typeof a.riskScore === "number" ? a.riskScore : 0,
      timeline: Array.isArray(a.timeline) ? a.timeline : [],
      relatedSubmissionHints: Array.isArray(a.relatedSubmissionHints)
        ? a.relatedSubmissionHints
        : [],
    };
  }

  /**
   * Generates a meaningful title for display in tables
   */
  private generateDisplayTitle(analysis: any, originalContent: string): string {
    // Try to extract a meaningful title based on the type of report
    if (analysis.irregularityType) {
      const typeLabels: Record<string, string> = {
        corrupcion: "Denuncia de Corrupción",
        acoso: "Reporte de Acoso",
        "robo-info": "Fuga de Información",
        discriminacion: "Caso de Discriminación",
        violencia: "Incidente de Violencia",
        fraude: "Fraude Detectado",
        otro: "Reporte General",
        otros: "Reporte General",
        indefinido: "Caso sin Clasificar",
        "N/A": "Reporte sin Categorizar",
      };

      const baseTitle = typeLabels[analysis.irregularityType] || "Reporte";

      // Add context if available
      if (
        analysis.suggestedDepartment &&
        analysis.suggestedDepartment !== "General"
      ) {
        return `${baseTitle} - ${analysis.suggestedDepartment}`;
      }

      if (analysis.analysis?.involvedParties?.[0]?.name) {
        return `${baseTitle} - ${analysis.analysis.involvedParties[0].name}`;
      }

      return baseTitle;
    }

    // Fallback: try to extract from original content
    const lines = originalContent.split("\n").filter((line) => line.trim());
    if (lines.length > 0) {
      const firstMeaningfulLine = lines.find(
        (line) =>
          line.length > 10 &&
          !line.toLowerCase().includes("asunto:") &&
          !line.toLowerCase().includes("de:") &&
          !line.toLowerCase().includes("fecha:")
      );

      if (firstMeaningfulLine) {
        return (
          firstMeaningfulLine.substring(0, 60) +
          (firstMeaningfulLine.length > 60 ? "..." : "")
        );
      }
    }

    return "Reporte recibido";
  }

  /**
   * Gets user-friendly category labels
   */
  private getCategoryLabel(irregularityType: string): string {
    const labels: Record<string, string> = {
      corrupcion: "Corrupción",
      acoso: "Acoso Laboral",
      "robo-info": "Fuga de Información",
      discriminacion: "Discriminación",
      violencia: "Violencia",
      fraude: "Fraude",
      "conflicto-interes": "Conflicto de Interés",
      "mal-uso-recursos": "Mal Uso de Recursos",
      "incumplimiento-politicas": "Incumplimiento de Políticas",
      otro: "Otros",
      otros: "Otros",
      indefinido: "Sin Clasificar",
      "N/A": "Sin Categorizar",
    };

    return labels[irregularityType] || irregularityType || "Sin categorizar";
  }

  /**
   * Handle assignments within transaction
   */
  private async handleAssignments(
    tx: any,
    submissionId: number,
    orgId: string,
    analysis: any
  ) {
    // Auto-assign cases to ORG admins (excluding super admins) with load balancing by fewest open assignments
    const shouldAssign = true; // assign all cases automatically
    if (shouldAssign) {
      const admins = await tx.organizationMembership.findMany({
        where: {
          orgId,
          role: "ADMIN",
          user: { email: { notIn: (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "").split(",").filter(Boolean) } },
        },
        include: {
          user: true,
        },
      });

      // If no admins, skip assignments gracefully
      if (admins.length > 0) {
        // Compute current open assignment counts per admin
        const openAssignments = await tx.reportAssignment.groupBy({
          by: ["userId"],
          _count: { userId: true },
          where: { report: { orgId, status: { in: ["PENDING", "IN_PROGRESS"] } } },
        });
        const openCountMap = new Map<string, number>();
        for (const row of openAssignments) openCountMap.set(row.userId as string, (row as any)._count.userId as number);

        // Sort admins by lowest open assignments first for basic load balancing
        const sortedAdmins = admins.sort((a: any, b: any) => {
          const ca = openCountMap.get(a.userId) || 0;
          const cb = openCountMap.get(b.userId) || 0;
          return ca - cb;
        });

        // Assign to up to 2 admins by default; if urgent/high, assign to all admins
        const highOrUrgent = analysis.severity === "HIGH" || analysis.requiresUrgentAction === true;
        const targetAdmins = highOrUrgent ? sortedAdmins : sortedAdmins.slice(0, Math.min(2, sortedAdmins.length));

        for (const admin of targetAdmins) {
          await tx.reportAssignment.create({
            data: {
              reportId: submissionId,
              userId: admin.userId,
              userName: `${admin.user.firstName || ""} ${admin.user.lastName || ""}`.trim() || admin.user.email,
              createdBy: "ai-compliance-system",
            },
          });
        }

        // Update status based on severity/urgency
        await tx.formSubmission.update({
          where: { id: submissionId },
          data: {
            status: highOrUrgent ? "IN_PROGRESS" : "PENDING",
            priority: analysis.priority || (highOrUrgent ? "HIGH" : "NORMAL"),
          },
        });

        // Log the assignment
        await tx.reportActivity.create({
          data: {
            submissionId,
            action: highOrUrgent ? "auto_assigned_critical" : "auto_assigned",
            userId: "ai-system",
            userName: "EthicBot AI",
            details: {
              reason: highOrUrgent ? (analysis.requiresUrgentAction ? "Acción urgente requerida" : `Severidad ${analysis.severity}`) : "Asignación automática estándar",
              assignedCount: targetAdmins.length,
              assignedTo: targetAdmins.map((a: any) => a.user.email),
              statusChanged: highOrUrgent,
            },
          },
        });
      }
    }

    // Assign to suggested department
    if (analysis.suggestedDepartment) {
      const department = await tx.department.findFirst({
        where: {
          orgId,
          OR: [
            {
              name: {
                contains: analysis.suggestedDepartment,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: analysis.suggestedDepartment,
                mode: "insensitive",
              },
            },
          ],
        },
      });

      if (department) {
        await tx.formSubmission.update({
          where: { id: submissionId },
          data: { departmentId: department.id },
        });

        await tx.reportActivity.create({
          data: {
            submissionId,
            action: "department_assigned",
            userId: "ai-system",
            userName: "EthicBot AI",
            details: {
              departmentId: department.id,
              departmentName: department.name,
              reason: "Asignación automática por AI",
            },
          },
        });
      }
    }
  }

  private async updateOrganizationCounters(
    tx: any,
    orgId: string,
    source: SubmissionSource
  ) {
    const updateData: any = {
      totalSubmissions: { increment: 1 },
    };

    // Map to the correct field names based on your Prisma schema
    if (source === SubmissionSource.EMAIL) {
      // For EMAIL source, we can increment customFormSubmissions or create a new field
      // Since there's no emailSubmissions field, let's use customFormSubmissions for now
      updateData.customFormSubmissions = { increment: 1 };
    } else if (source === SubmissionSource.ETHIC_LINE) {
      updateData.ethicLineSubmissions = { increment: 1 };
    } else if (source === SubmissionSource.CUSTOM_FORM) {
      updateData.customFormSubmissions = { increment: 1 };
    }
    // For other sources (WHATSAPP, API), we only increment totalSubmissions

    await tx.organization.update({
      where: { id: orgId },
      data: updateData,
    });
  }

  private async trackUsage(tx: any, orgId: string, contentLength: number) {
    const estimatedTokens = Math.ceil(contentLength / 4);
    const estimatedCost = (estimatedTokens / 1000) * 0.02;

    await tx.usageTracking.create({
      data: {
        orgId,
        model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-5",
        feature: "compliance_analysis",
        tokens: estimatedTokens,
        estimatedCost,
        metadata: {
          contentLength,
          source: "email_webhook",
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Process attachments for a submission
   * Move files from temp to permanent storage and create DB records
   */
  private async processAttachments(
    tx: any,
    submissionId: number,
    attachments: Array<{
      filename: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      cloudinaryPublicId?: string;
    }>,
    uploaderName: string
  ) {
    const processedAttachments = [];

    for (const attachment of attachments) {
      try {
        const finalFileUrl = attachment.fileUrl;
        const finalPublicId = attachment.cloudinaryPublicId;

        // For now, keep files in temp location to avoid Cloudinary rename issues
        // Files will be cleaned up by a separate background job later

        // Create attachment record in database
        const dbAttachment = await tx.reportAttachment.create({
          data: {
            submissionId,
            filename: attachment.filename,
            fileUrl: finalFileUrl,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
            uploadedById: "system", // Can be updated with actual user ID if available
            uploadedByName: uploaderName,
          },
        });

        // Create activity record for attachment
        await tx.reportActivity.create({
          data: {
            submissionId,
            action: "ATTACHMENT_UPLOADED",
            userId: "system",
            userName: uploaderName,
            details: {
              filename: attachment.filename,
              fileSize: attachment.fileSize,
              mimeType: attachment.mimeType,
              cloudinaryPublicId: finalPublicId,
              source: "form_submission",
            },
          },
        });

        processedAttachments.push(dbAttachment);
      } catch (error) {
        console.error(
          `❌ Error processing attachment ${attachment.filename}:`,
          error
        );

        // Create error activity record
        await tx.reportActivity.create({
          data: {
            submissionId,
            action: "ATTACHMENT_ERROR",
            userId: "system",
            userName: "System",
            details: {
              filename: attachment.filename,
              error: error instanceof Error ? error.message : "Unknown error",
              originalUrl: attachment.fileUrl,
            },
          },
        });
      }
    }

    return processedAttachments;
  }
}

export const submissionProcessor = new SubmissionProcessorService();
