"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { addSubmissionToQueue } from "@/modules/app/lib/queue/queue-manager";
import { SubmissionSource } from "@/types/submission.types";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";

interface CreateManualReportData {
  // Información del reportante
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  isAnonymous: boolean;

  // Canal de recepción
  channelType: "phone" | "whatsapp" | "email" | "in_person";

  // Información del reporte
  title: string;
  description: string;
  irregularityType: string;
  priority: "LOW" | "MEDIUM" | "HIGH";

  // Información adicional
  location?: string;
  involvedPersons?: string;
  evidenceDescription?: string;

  // Notas del administrador
  adminNotes?: string;
}

/**
 * Generate a unique tracking code for the report
 */
function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = randomBytes(4).toString("hex").toUpperCase();
  return `MR-${timestamp}-${randomPart}`;
}

/**
 * Create a manual report from dashboard (phone, WhatsApp, etc.)
 */
export async function createManualReport(
  organizationId: string,
  data: CreateManualReportData
) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("No autorizado");
  }

  // Verify user is admin of the organization
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId: organizationId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("No tienes permisos para crear reportes manuales");
  }

  try {
    const trackingCode = generateTrackingCode();

    // Build form data object to match ETHIC_LINE structure exactly
    const formData = {
      // Reporter information
      isAnonymous: data.isAnonymous,
      reporter: {
        firstName: data.isAnonymous ? "" : data.reporterName || "",
        lastName: "",
        gender: "",
        email: data.isAnonymous ? "" : data.reporterEmail || "",
        idDocument: "",
        phone: data.isAnonymous ? "" : data.reporterPhone || "",
      },

      // Reported person information (empty for manual reports unless specified)
      reported: {
        firstName: "",
        lastName: "",
        department: "",
        position: "",
      },

      // Irregularity type mapping
      irregularityType: data.irregularityType,

      // Questionnaire structure matching ETHIC_LINE
      questionnaire: {
        where: data.location || "No especificado",
        when: "Reportado manualmente",
        whatHappened: data.description,
        howItHappened: `Reportado vía ${data.channelType}`,
        hasOtherInvolved: data.involvedPersons ? "yes" : "no",
        otherInvolved: data.involvedPersons || "",
        additionalDetails: data.evidenceDescription || "",
      },

      // Empty uploaded files array (manual reports don't have files initially)
      uploadedFiles: [],

      // Agreement to terms (assumed true for manual reports)
      agreedToTerms: true,

      // Additional manual report specific data
      manualReportData: {
        channelType: data.channelType,
        priority: data.priority,
        adminNotes: data.adminNotes || "",
        createdManually: true,
      },
    };

    // Create the report submission
    const submission = await prisma.$transaction(async (tx) => {
      // Create form submission using the correct schema fields
      const newSubmission = await tx.formSubmission.create({
        data: {
          orgId: organizationId,
          content: JSON.stringify(formData), // Store ETHIC_LINE compatible format
          submittedAt: new Date(),
          status: "PENDING",
          isAnonymous: data.isAnonymous,
          source: "API", // Mark as manual creation by admin (using API source)
          reporterEmail: data.isAnonymous ? null : data.reporterEmail,
          reporterName: data.isAnonymous ? null : data.reporterName,
          reporterPhone: data.isAnonymous ? null : data.reporterPhone,
          priority:
            data.priority === "HIGH"
              ? "HIGH"
              : data.priority === "LOW"
                ? "LOW"
                : "NORMAL",
          type: data.irregularityType,
          location: data.location,
          internalNotes: data.adminNotes,
          metadata: {
            trackingCode,
            channelType: data.channelType,
            createdManually: true,
            createdBy: userId,
          },
        },
      });

      // Create initial activity log
      await tx.reportActivity.create({
        data: {
          submissionId: newSubmission.id,
          action: "CREATED_MANUALLY",
          details: {
            channelType: data.channelType,
            createdBy: user.emailAddresses[0]?.emailAddress || "Admin",
            isAnonymous: data.isAnonymous,
            priority: data.priority,
            irregularityType: data.irregularityType,
            hasAdminNotes: !!data.adminNotes,
          },
          userId,
          userName:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.emailAddresses[0]?.emailAddress ||
            "Admin",
        },
      });

      // If admin notes exist, create a separate activity for them
      if (data.adminNotes) {
        await tx.reportActivity.create({
          data: {
            submissionId: newSubmission.id,
            action: "ADMIN_NOTES_ADDED",
            details: {
              notes: data.adminNotes,
              addedBy: user.emailAddresses[0]?.emailAddress || "Admin",
              isInternal: true,
            },
            userId,
            userName:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.emailAddresses[0]?.emailAddress ||
              "Admin",
          },
        });
      }

      return newSubmission;
    });

    // Add to AI processing queue (similar to ETHIC_LINE reports)
    try {
      // Convert to readable text format for AI processing
      const readableContent = `=== REPORTE MANUAL ===

TIPO DE IRREGULARIDAD: ${data.irregularityType}

${data.isAnonymous ? "DENUNCIA ANÓNIMA" : "DENUNCIA IDENTIFICADA"}

${!data.isAnonymous && data.reporterName ? `REPORTANTE: ${data.reporterName}` : ""}
${!data.isAnonymous && data.reporterEmail ? `EMAIL: ${data.reporterEmail}` : ""}
${!data.isAnonymous && data.reporterPhone ? `TELÉFONO: ${data.reporterPhone}` : ""}

TÍTULO: ${data.title}

DESCRIPCIÓN: ${data.description}

${data.location ? `UBICACIÓN: ${data.location}` : ""}
${data.involvedPersons ? `PERSONAS INVOLUCRADAS: ${data.involvedPersons}` : ""}
${data.evidenceDescription ? `EVIDENCIAS: ${data.evidenceDescription}` : ""}

CANAL DE RECEPCIÓN: ${data.channelType}
PRIORIDAD: ${data.priority}

${data.adminNotes ? `NOTAS DEL ADMINISTRADOR: ${data.adminNotes}` : ""}

Fecha de envío: ${new Date().toLocaleString()}`;

      const planInfo = await getOrganizationPlanInfo(organizationId);
      const canUseAi = Boolean(planInfo?.features?.hasAiProcessing && planInfo?.hasActivePlan);
      if (canUseAi) {
        await addSubmissionToQueue({
          orgId: organizationId,
          content: readableContent,
          source: SubmissionSource.API,
          metadata: {
            submissionId: submission.id,
            originalContent: JSON.stringify(formData),
            channelType: data.channelType,
            createdManually: true,
            createdBy: userId,
            manualReportData: formData.manualReportData,
          },
          reporterInfo: {
            name: data.isAnonymous ? null : data.reporterName,
            email: data.isAnonymous ? null : data.reporterEmail,
            phone: data.isAnonymous ? null : data.reporterPhone,
            isAnonymous: data.isAnonymous,
          },
          attachments: [], // Manual reports don't have initial attachments
        });
        console.log(
          `✅ [MANUAL] Submission ${submission.id} queued for AI processing`
        );
      } else {
        console.log(
          `⏭️ [MANUAL] Skipping AI queue for plan ${planInfo?.planType || "STARTER"}`
        );
      }
    } catch (queueError) {
      console.error(
        `❌ [MANUAL] Failed to queue submission ${submission.id}:`,
        queueError
      );
      // Don't fail the submission if queue fails - just log it
    }

    // Revalidate relevant paths
    revalidatePath("/app/reports");
    revalidatePath("/app");

    return {
      success: true,
      submissionId: submission.id,
      trackingCode: trackingCode,
    };
  } catch (error) {
    console.error("Error creating manual report:", error);
    throw new Error("Error al crear el reporte manual");
  }
}

/**
 * Get channel type options for manual reports
 */
export async function getManualReportChannelTypes() {
  return [
    { key: "phone", label: "Teléfono", icon: "📞" },
    { key: "whatsapp", label: "WhatsApp", icon: "💬" },
    { key: "email", label: "Email", icon: "📧" },
    { key: "in_person", label: "Presencial", icon: "👥" },
  ];
}

/**
 * Get available irregularity types for manual reports
 */
export async function getIrregularityTypes() {
  return [
    { key: "harassment", label: "Acoso o Bullying" },
    { key: "discrimination", label: "Discriminación" },
    { key: "corruption", label: "Corrupción o Soborno" },
    { key: "fraud", label: "Fraude" },
    { key: "safety", label: "Violación de Seguridad" },
    { key: "ethics", label: "Violación Ética" },
    { key: "legal", label: "Violación Legal" },
    { key: "financial", label: "Irregularidad Financiera" },
    { key: "environmental", label: "Violación Ambiental" },
    { key: "other", label: "Otro" },
  ];
}
