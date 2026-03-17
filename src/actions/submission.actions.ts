/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import prisma from "@/modules/prisma/lib/prisma";
import { SubmissionSource, SubmissionMetadata } from "@/types/submission.types";
// import { headers } from "next/headers";
import { z } from "zod";
import { addSubmissionToQueue } from "@/modules/app/lib/queue/queue-manager";
import { createTrackingCode } from "@/actions/tracking.actions";

import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";

const ethicLineSubmissionSchema = z.object({
  organizationId: z.string(),
  formData: z
    .object({
      isAnonymous: z.boolean(),
      reporter: z.object({
        firstName: z.string(),
        lastName: z.string(),
        gender: z.string(),
        email: z.string(),
        idDocument: z.string().optional(),
        phone: z.string().optional(),
      }),
      reported: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        department: z.string().min(1),
        position: z.string().min(1),
      }),
      irregularityType: z.string().min(1),
      questionnaire: z.record(z.string(), z.any()),
      uploadedFiles: z
        .array(
          z.object({
            filename: z.string(),
            fileUrl: z.string(),
            fileSize: z.number(),
            mimeType: z.string(),
            cloudinaryPublicId: z.string().optional(),
          })
        )
        .optional(),
      agreedToTerms: z.literal(true),
    })
    .superRefine((data, ctx) => {
      if (!data.isAnonymous) {
        if (!data.reporter.firstName || data.reporter.firstName.length < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Nombre es requerido",
            path: ["reporter", "firstName"],
          });
        }
        if (!data.reporter.lastName || data.reporter.lastName.length < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Apellido es requerido",
            path: ["reporter", "lastName"],
          });
        }
        if (!data.reporter.gender || data.reporter.gender.length < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Género es requerido",
            path: ["reporter", "gender"],
          });
        }
        if (
          !data.reporter.email ||
          !z.string().email().safeParse(data.reporter.email).success
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Email válido es requerido",
            path: ["reporter", "email"],
          });
        }
      }
    }),
});

function convertToReadableText(data: any, source: SubmissionSource): string {
  const parts: string[] = [];

  if (source === SubmissionSource.ETHIC_LINE) {
    // Header
    parts.push("=== REPORTE DE LÍNEA ÉTICA ===\n");

    // Irregularity type
    if (data.irregularityType) {
      parts.push(`TIPO DE IRREGULARIDAD: ${data.irregularityType}\n`);
    }

    // Reporter info (if not anonymous)
    if (!data.isAnonymous && data.reporter) {
      parts.push("INFORMACIÓN DEL DENUNCIANTE:");
      parts.push(
        `- Nombre: ${data.reporter.firstName} ${data.reporter.lastName}`
      );
      parts.push(`- Género: ${data.reporter.gender}`);
      parts.push(`- Email: ${data.reporter.email}`);
      if (data.reporter.phone) parts.push(`- Teléfono: ${data.reporter.phone}`);
      if (data.reporter.idDocument)
        parts.push(`- Documento: ${data.reporter.idDocument}`);
      parts.push("");
    } else {
      parts.push("DENUNCIA ANÓNIMA\n");
    }

    // Reported person
    if (data.reported) {
      parts.push("PERSONA REPORTADA:");
      parts.push(
        `- Nombre: ${data.reported.firstName} ${data.reported.lastName}`
      );
      parts.push(`- Departamento: ${data.reported.department}`);
      parts.push(`- Cargo: ${data.reported.position}`);
      parts.push("");
    }

    // Questionnaire responses
    if (data.questionnaire) {
      parts.push("DETALLES DEL REPORTE:");

      // Process questionnaire intelligently
      const questionnaireText = processQuestionnaire(data.questionnaire);
      parts.push(questionnaireText);
      parts.push("");
    }

    // Timestamp
    parts.push(`Fecha de envío: ${new Date().toLocaleString("es-CO")}`);
  } else if (source === SubmissionSource.CUSTOM_FORM) {
    // For custom forms, try to parse JSON or use as-is
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      parts.push("=== FORMULARIO PERSONALIZADO ===\n");
      parts.push(JSON.stringify(parsed, null, 2));
    } catch {
      parts.push(data.toString());
    }
  }

  return parts.join("\n");
}

function processQuestionnaire(questionnaire: Record<string, any>): string {
  const parts: string[] = [];
  const processedKeys = new Set<string>();

  // Group related fields
  const groups = {
    whatHappened: { title: "¿Qué sucedió?", items: [] as string[] },
    howItHappened: { title: "¿Cómo sucedió?", items: [] as string[] },
    when: { title: "¿Cuándo sucedió?", value: "" },
    where: { title: "¿Dónde sucedió?", value: "" },
    otherInvolved: { title: "Otras personas involucradas", value: "" },
    additionalDetails: { title: "Detalles adicionales", value: "" },
    freeReport: { title: "Reporte libre", value: "" },
  };

  // Process each questionnaire field
  Object.entries(questionnaire).forEach(([key, value]) => {
    if (processedKeys.has(key)) return;

    // Boolean checkboxes for whatHappened
    if (key.startsWith("whatHappened_") && value === true) {
      const item = key.replace("whatHappened_", "").replace(/_/g, " ");
      groups.whatHappened.items.push(`• ${item}`);
      processedKeys.add(key);
    }
    // Boolean checkboxes for howItHappened
    else if (key.startsWith("howItHappened_") && value === true) {
      const item = key.replace("howItHappened_", "").replace(/_/g, " ");
      groups.howItHappened.items.push(`• ${item}`);
      processedKeys.add(key);
    }
    // Text fields
    else if (typeof value === "string" && value.trim()) {
      switch (key) {
        case "when":
          groups.when.value = value;
          break;
        case "where":
          groups.where.value = value;
          break;
        case "otherInvolved":
          groups.otherInvolved.value = value;
          break;
        case "additionalDetails":
          groups.additionalDetails.value = value;
          break;
        case "freeReport":
          groups.freeReport.value = value;
          break;
        case "whatHappened":
          if (value.trim()) {
            groups.whatHappened.items.push(`Descripción: ${value}`);
          }
          break;
        case "howItHappened":
          if (value.trim()) {
            groups.howItHappened.items.push(`Descripción: ${value}`);
          }
          break;
      }
      processedKeys.add(key);
    }
  });

  // Build output
  if (groups.whatHappened.items.length > 0) {
    parts.push(`\n${groups.whatHappened.title}`);
    parts.push(groups.whatHappened.items.join("\n"));
  }

  if (groups.howItHappened.items.length > 0) {
    parts.push(`\n${groups.howItHappened.title}`);
    parts.push(groups.howItHappened.items.join("\n"));
  }

  if (groups.when.value) {
    parts.push(`\n${groups.when.title}\n${groups.when.value}`);
  }

  if (groups.where.value) {
    parts.push(`\n${groups.where.title}\n${groups.where.value}`);
  }

  if (groups.otherInvolved.value) {
    parts.push(
      `\n${groups.otherInvolved.title}\n${groups.otherInvolved.value}`
    );
  }

  if (groups.additionalDetails.value) {
    parts.push(
      `\n${groups.additionalDetails.title}\n${groups.additionalDetails.value}`
    );
  }

  if (groups.freeReport.value) {
    parts.push(`\n${groups.freeReport.title}\n${groups.freeReport.value}`);
  }

  return parts.join("\n");
}

export interface PublicReportData {
  id: string;
  status: string;
  submissionDate: string;
  organizationName: string;
  type: string | null;
  lastUpdate: string;
  description: string;
  activities: PublicActivity[];
}

interface PublicActivity {
  id: number;
  action: string;
  createdAt: string;
  details?: any;
}

interface SubmitReportResult {
  success: boolean;
  submissionId?: number;
  trackingCode?: string;
  error?: string;
}

async function createSubmission({
  orgId,
  formId,
  content,
  source,
  metadata,
  isAnonymous = true,
  reporterName,
  reporterEmail,
  reporterPhone,
  type,
}: {
  orgId: string;
  formId?: number;
  content: string;
  source: SubmissionSource;
  metadata?: Partial<SubmissionMetadata>;
  isAnonymous?: boolean;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
  type?: string | null;
}) {
  // Build sanitized metadata (no technical details like IP, user-agent, or raw headers)
  const fullMetadata: SubmissionMetadata = {
    source,
    formId,
    // Keep only functional, non-technical fields that describe the report content/context
    ...metadata,
  };

  // Create submission in transaction
  const submission = await prisma.$transaction(async (tx) => {
    // Create submission
    const submission = await tx.formSubmission.create({
      data: {
        orgId,
        formId,
        content,
        source,
        metadata: fullMetadata as any,
        isAnonymous,
        reporterName,
        reporterEmail,
        reporterPhone,
        type,
        status: "PENDING",
        priority: "NORMAL",
        aiSeverity: "UNKNOWN", // Will be updated by AI
      },
    });

    // Create initial activity
    await tx.reportActivity.create({
      data: {
        submissionId: submission.id,
        action: "report_submitted",
        userId: "system",
        userName: "Sistema",
        details: {
          description: "Denuncia recibida exitosamente",
          source,
        },
      },
    });

    // Update organization counters
    const updateData: any = {
      totalSubmissions: { increment: 1 },
    };

    if (source === SubmissionSource.CUSTOM_FORM) {
      updateData.customFormSubmissions = { increment: 1 };
    } else if (source === SubmissionSource.ETHIC_LINE) {
      updateData.ethicLineSubmissions = { increment: 1 };
    }

    await tx.organization.update({
      where: { id: orgId },
      data: updateData,
    });

    if (formId) {
      await tx.form.update({
        where: { id: formId },
        data: {
          submissionsCount: { increment: 1 },
        },
      });
    }

    return submission;
  });

  // Add to AI processing queue (non-blocking)
  try {
    // Parse content to get readable text
    let readableContent = content;
    try {
      const parsed = JSON.parse(content);
      readableContent = convertToReadableText(parsed, source);
    } catch {
      // Content is already plain text
    }

    await addSubmissionToQueue({
      orgId,
      content: readableContent,
      source,
      metadata: {
        submissionId: submission.id,
        originalContent: content,
        ...metadata,
      },
      reporterInfo: {
        name: reporterName,
        email: reporterEmail,
        phone: reporterPhone,
        isAnonymous,
      },
    });
  } catch {
    // Don't fail the submission if AI queue fails
  }

  return submission;
}

export async function submitCustomForm(formUrl: string, content: string) {
  try {
    // Get form details
    const form = await prisma.form.findUnique({
      where: {
        shareURL: formUrl,
        isPublished: true,
      },
      select: {
        id: true,
        orgId: true,
      },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    // Update form visits
    await prisma.form.update({
      where: { id: form.id },
      data: { visits: { increment: 1 } },
    });

    // Create submission
    const submission = await createSubmission({
      orgId: form.orgId,
      formId: form.id,
      content,
      source: SubmissionSource.CUSTOM_FORM,
      metadata: {
        formUrl,
      },
    });

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error("Error submitting custom form:", error);
    throw new Error("Failed to submit form");
  }
}

export async function submitEthicLineReport(
  data: z.infer<typeof ethicLineSubmissionSchema>
): Promise<SubmitReportResult> {
  try {
    const validatedData = ethicLineSubmissionSchema.parse(data);

    // Create submission first to get the numeric ID and build canonical code like REP-000001

    const reporterInfo = {
      name: validatedData.formData.isAnonymous
        ? null
        : `${validatedData.formData.reporter.firstName} ${validatedData.formData.reporter.lastName}`.trim(),
      email: validatedData.formData.isAnonymous
        ? null
        : validatedData.formData.reporter.email,
      phone: validatedData.formData.isAnonymous
        ? null
        : validatedData.formData.reporter.phone || null,
      isAnonymous: validatedData.formData.isAnonymous,
    };

    // Get organization to validate
    const organization = await prisma.organization.findUnique({
      where: { id: validatedData.organizationId },
    });

    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    const content = JSON.stringify(validatedData.formData);
    // Build a rich, human-readable narrative for AI instead of raw JSON
    const readableContent = convertToReadableText(
      validatedData.formData,
      SubmissionSource.ETHIC_LINE
    );

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        orgId: validatedData.organizationId,
        content,
        source: SubmissionSource.ETHIC_LINE,
        status: "PENDING",
        isAnonymous: reporterInfo.isAnonymous,
        reporterName: reporterInfo.isAnonymous ? null : reporterInfo.name,
        reporterEmail: reporterInfo.isAnonymous ? null : reporterInfo.email,
        reporterPhone: reporterInfo.isAnonymous ? null : reporterInfo.phone,
        metadata: {
          source: SubmissionSource.ETHIC_LINE,
        },
      },
    });

    // Decide whether to enqueue AI job based on plan
    let aiEnqueued = false;
    try {
      const planInfo = await getOrganizationPlanInfo(
        validatedData.organizationId
      );
      const canUseAI = Boolean(planInfo?.features?.hasAiProcessing);
      if (canUseAI) {
        await addSubmissionToQueue({
          orgId: validatedData.organizationId,
          content: readableContent,
          source: SubmissionSource.ETHIC_LINE,
          metadata: {
            submissionId: submission.id,
            originalContent: content,
            formData: validatedData.formData,
            questionnaire: validatedData.formData.questionnaire,
            files: validatedData.formData.uploadedFiles,
          },
          reporterInfo,
          attachments: validatedData.formData.uploadedFiles || [],
        });
        aiEnqueued = true;
      } else {
        console.log(
          `⏭️ [ETHIC_LINE] Skipping AI queue for plan ${planInfo?.planType}`
        );
      }
    } catch (queueError) {
      console.error(
        `❌ [ETHIC_LINE] Failed to handle AI queue for submission ${submission.id}:`,
        queueError
      );
      // Do not fail the submission if queue fails or is skipped
    }

    // If AI not enqueued, persist attachments immediately so they are visible in report detail
    if (
      !aiEnqueued &&
      Array.isArray(validatedData.formData.uploadedFiles) &&
      validatedData.formData.uploadedFiles.length > 0
    ) {
      const uploaderName = reporterInfo.isAnonymous
        ? "Anónimo"
        : reporterInfo.name || "Reportante";

      for (const attachment of validatedData.formData.uploadedFiles) {
        try {
          await prisma.reportAttachment.create({
            data: {
              submissionId: submission.id,
              filename: attachment.filename,
              fileUrl: attachment.fileUrl,
              fileSize: attachment.fileSize,
              mimeType: attachment.mimeType,
              uploadedById: "system",
              uploadedByName: uploaderName,
            },
          });

          await prisma.reportActivity.create({
            data: {
              submissionId: submission.id,
              action: "ATTACHMENT_UPLOADED",
              userId: "system",
              userName: uploaderName,
              details: {
                filename: attachment.filename,
                fileSize: attachment.fileSize,
                mimeType: attachment.mimeType,
                cloudinaryPublicId: attachment.cloudinaryPublicId,
                source: "form_submission",
              },
            },
          });
        } catch (e) {
          console.error(
            "Error saving attachment for submission",
            submission.id,
            e
          );
          await prisma.reportActivity.create({
            data: {
              submissionId: submission.id,
              action: "ATTACHMENT_ERROR",
              userId: "system",
              userName: "System",
              details: {
                filename: attachment.filename,
                error: e instanceof Error ? e.message : "Unknown error",
                originalUrl: attachment.fileUrl,
              },
            },
          });
        }
      }
    }

    const trackingCode = await createTrackingCode(submission.id);

    return {
      success: true,
      submissionId: submission.id,
      trackingCode,
    };
  } catch (error) {
    console.error("Error submitting EthicVoice report:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid form data",
      };
    }
    return {
      success: false,
      error: "Failed to submit report",
    };
  }
}

// Removed unused getIrregularityTypeLabel function

export async function getSubmissionAnalytics(orgId: string) {
  try {
    const [organization, recentSubmissions, submissionsByType] =
      await Promise.all([
        // Get organization with counters
        prisma.organization.findUnique({
          where: { id: orgId },
          select: {
            totalSubmissions: true,
            customFormSubmissions: true,
            ethicLineSubmissions: true,
          },
        }),

        // Get recent submissions
        prisma.formSubmission.findMany({
          where: { orgId },
          orderBy: { submittedAt: "desc" },
          take: 10,
          select: {
            id: true,
            source: true,
            submittedAt: true,
            aiSeverity: true,
          },
        }),

        // Get submissions grouped by irregularity type (for EthicVoice)
        prisma.formSubmission.groupBy({
          by: ["source"],
          where: {
            orgId,
            source: SubmissionSource.ETHIC_LINE,
          },
          _count: true,
        }),
      ]);

    // Calculate percentages
    const total = organization?.totalSubmissions || 0;
    const customFormPercentage =
      total > 0
        ? ((organization?.customFormSubmissions || 0) / total) * 100
        : 0;
    const ethicLinePercentage =
      total > 0 ? ((organization?.ethicLineSubmissions || 0) / total) * 100 : 0;

    return {
      totals: {
        all: total,
        customForms: organization?.customFormSubmissions || 0,
        ethicLine: organization?.ethicLineSubmissions || 0,
      },
      percentages: {
        customForms: customFormPercentage,
        ethicLine: ethicLinePercentage,
      },
      recentSubmissions,
      byType: submissionsByType,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw new Error("Failed to fetch analytics");
  }
}
