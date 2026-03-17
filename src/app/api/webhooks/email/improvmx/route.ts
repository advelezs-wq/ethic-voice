/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/webhooks/email/improvmx/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SubmissionSource } from "@prisma/client";
import prisma from "@/modules/prisma/lib/prisma";
import crypto from "crypto";
import {
  securityManager,
  getClientIP,
} from "@/modules/app/lib/security/rate-limiter";
import {
  getOrganizationPlanInfo,
  updateOrganizationUsage,
} from "@/modules/core/utils/subscription.utils";
import { getPlanPermissions, PlanType } from "@/types/subscription.types";

// In-memory cache for processed emails to prevent duplicates
const processedEmails = new Map<
  string,
  { timestamp: number; processing: boolean; result?: any }
>();

// Clean up cache every 5 minutes
setInterval(
  () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [key, value] of processedEmails.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        processedEmails.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get("user-agent") || "";

    console.log(`[WEBHOOK] Webhook de ImprovMX recibido desde IP: ${clientIP}`);

    // Apply security checks
    const rateLimitResult = await securityManager.checkRateLimit({
      type: "email",
      identifier: clientIP,
      additionalChecks: {
        userAgent,
      },
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const data = await req.json();

    // Extract email data
    const from = data.from;
    const to = data.to?.[0];
    const subject = data.subject;
    const text = data.text;
    const timestamp = data.timestamp;
    const messageId = data["message-id"];
    const recipientEmail = to?.email || data.envelope?.recipient;
    const alias = recipientEmail?.split("@")[0] || "unknown";

    console.log(
      `[WEBHOOK] Email: ${from.name} → ${alias} | Asunto: ${subject}`
    );

    // IMPROVED DEDUPLICATION: Create multiple hash strategies
    const primaryHash = crypto
      .createHash("sha256")
      .update(`${messageId}-${from.email}-${subject}-${timestamp}`)
      .digest("hex");

    const contentHash = crypto
      .createHash("sha256")
      .update(`${from.email}-${subject}-${text?.substring(0, 200)}`)
      .digest("hex");

    // Check if we're already processing this email
    const existingProcess = processedEmails.get(primaryHash);
    if (existingProcess) {
      if (existingProcess.processing) {
        console.log(`⏳ [EMAIL] Already processing: ${messageId}`);
        return NextResponse.json({
          success: true,
          message: "Email already being processed",
          queued: false,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`✅ [EMAIL] Already processed: ${messageId}`);
        return NextResponse.json(existingProcess.result);
      }
    }

    // Mark as processing
    processedEmails.set(primaryHash, {
      timestamp: Date.now(),
      processing: true,
    });

    try {
      // Basic validation
      if (!from?.email || !subject || !text) {
        console.log("❌ [EMAIL] Missing required fields");
        return NextResponse.json({
          success: false,
          message: "Missing required email fields",
          timestamp: new Date().toISOString(),
        });
      }

      // Find EmailConfiguration by alias
      const emailConfig = await prisma.emailConfiguration.findFirst({
        where: {
          emailAlias: alias,
          isActive: true,
        },
        include: {
          organization: {
            include: {
              subscriptions: {
                where: {
                  status: {
                    in: ["ACTIVE", "TRIALING"],
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
              },
            },
          },
        },
      });

      if (!emailConfig) {
        console.log(`❌ [EMAIL] No configuration found for alias: ${alias}`);
        return NextResponse.json({
          success: false,
          message: "Email alias not found",
          timestamp: new Date().toISOString(),
        });
      }

      // **CRITICAL: Plan-based email permission check**
      const organization = emailConfig.organization;
      const planInfo = await getOrganizationPlanInfo(organization.id);

      if (!planInfo) {
        console.log(
          `❌ [EMAIL] Could not retrieve plan info for org: ${organization.id}`
        );
        return NextResponse.json({
          success: false,
          message: "Organization plan information not available",
          timestamp: new Date().toISOString(),
        });
      }

      // Check if organization has email channel permission
      const planPermissions = getPlanPermissions(
        planInfo.planType as unknown as PlanType
      );
      if (!planPermissions.canAccessEmailChannel || !planInfo.hasActivePlan) {
        console.log(
          `❌ [EMAIL] Organization ${organization.name} (${planInfo.planType}) does not have email channel access`
        );

        // Log the attempt but don't create a report
        await prisma.emailConfiguration.update({
          where: { id: emailConfig.id },
          data: {
            lastCheckedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: false,
          message: "Email channel not available for current plan",
          planRequired: "GROW",
          currentPlan: planInfo.planType,
          timestamp: new Date().toISOString(),
        });
      }

      // Update email reports count for this month
      await updateOrganizationUsage(organization.id, { emailReports: 1 });

      console.log(
        `✅ [EMAIL] Organization ${organization.name} has email channel access (${planInfo.planType})`
      );

      // Check for anonymity requirements (broadened)
      const anonymityKeywords = [
        "anónimo",
        "anonimo",
        "anónima",
        "anonima",
        "anonimato",
        "denuncia anónima",
        "denuncia anonima",
        "mantener en anonimato",
        "no revelar mi identidad",
        "no revelar mi nombre",
        "resguardar identidad",
        "proteger identidad",
        "anonymous",
        "confidencial",
        "privado",
      ];
      const lowerText = (text || "").toLowerCase();
      const lowerSubject = (subject || "").toLowerCase();
      const contentRequiresAnonymity = anonymityKeywords.some(
        (keyword) => lowerText.includes(keyword) || lowerSubject.includes(keyword)
      );

      // Check if subject contains report-related keywords
      const reportKeywords = emailConfig.subjectKeywords || [
        "reporte",
        "denuncia",
        "queja",
        "complaint",
        "report",
        "ethics",
        "etica",
      ];

      const isReportEmail = reportKeywords.some((keyword) =>
        subject.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!isReportEmail) {
        console.log(
          `ℹ️ [EMAIL] Email doesn't contain report keywords: ${subject}`
        );

        await prisma.emailConfiguration.update({
          where: { id: emailConfig.id },
          data: {
            lastCheckedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: "Email received but not identified as a report",
          processed: false,
          timestamp: new Date().toISOString(),
        });
      }

      // Prepare content for processing (redact PII if anonymity requested)
      const content = contentRequiresAnonymity
        ? `
**Subject:** ${subject}
**Date:** ${new Date(timestamp).toISOString()}

**Content:**
${text}
        `.trim()
        : `
**From:** ${from.name || from.email}
**Subject:** ${subject}
**Date:** ${new Date(timestamp).toISOString()}

**Content:**
${text}

${data.html ? `**HTML Content:** ${data.html.substring(0, 500)}...` : ""}
        `.trim();

      // **Plan-based AI processing check**
      const useAiProcessing =
        planPermissions.canUseAiProcessing && planInfo.hasActivePlan;

      if (useAiProcessing) {
        console.log(
          `🤖 [EMAIL] Using AI processing for organization ${organization.name}`
        );
        await updateOrganizationUsage(organization.id, { aiProcessing: 1 });
      } else {
        console.log(
          `📝 [EMAIL] Skipping AI processing (not available in ${planInfo.planType} plan)`
        );
      }

      // Process with submission service asynchronously via queue
      const { addSubmissionToQueue } = await import(
        "@/modules/app/lib/queue/queue-manager"
      );

              // Add to queue for asynchronous processing only if plan includes AI
        try {
          if (useAiProcessing) {
            await addSubmissionToQueue({
              orgId: emailConfig.orgId,
              content,
              source: SubmissionSource.EMAIL,
              metadata: {
                emailId: messageId,
                contentHash,
                from: from.email,
                subject,
                alias,
                improvmxData: {
                  envelope: data.envelope,
                  verdict: data.verdict,
                },
                deduplicationHash: primaryHash,
                useAiProcessing, // Pass AI processing flag to queue
                planType: planInfo.planType,
                hasActivePlan: planInfo.hasActivePlan,
              },
              reporterInfo: {
                email: contentRequiresAnonymity ? null : from.email,
                name: contentRequiresAnonymity ? null : from.name,
                isAnonymous: contentRequiresAnonymity,
              },
            });
          }

        console.log(
          `✅ [EMAIL] Queued email for processing: ${messageId} (AI: ${useAiProcessing ? "YES" : "NO"})`
        );

        // Update email configuration counter
        await prisma.emailConfiguration.update({
          where: { id: emailConfig.id },
          data: {
            emailsProcessed: { increment: 1 },
            lastCheckedAt: new Date(),
          },
        });

        const result = {
          success: true,
          message: "Email queued for processing",
          emailId: messageId,
          queued: true,
          aiProcessing: useAiProcessing,
          planType: planInfo.planType,
          timestamp: new Date().toISOString(),
        };

        // Update processing cache
        processedEmails.set(primaryHash, {
          timestamp: Date.now(),
          processing: false,
          result,
        });

        return NextResponse.json(result);
      } catch (queueError) {
        console.error("❌ [EMAIL] Error adding to queue:", queueError);

        // Update processing cache with error
        processedEmails.set(primaryHash, {
          timestamp: Date.now(),
          processing: false,
          result: {
            success: false,
            message: "Error queueing email for processing",
            error:
              queueError instanceof Error
                ? queueError.message
                : "Unknown error",
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: "Error processing email",
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    } finally {
      // Always clean up processing state if still marked as processing
      const currentProcess = processedEmails.get(primaryHash);
      if (currentProcess?.processing) {
        processedEmails.set(primaryHash, {
          ...currentProcess,
          processing: false,
        });
      }
    }
  } catch (error) {
    console.error("❌ [WEBHOOK] Error processing ImprovMX webhook:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      service: "ImprovMX Email Webhook",
      status: "active",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
