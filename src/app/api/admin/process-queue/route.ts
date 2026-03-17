import { NextRequest, NextResponse } from "next/server";
import { testRedisConnections } from "@/modules/app/lib/queue/redis-config";
import {
  getQueueStats,
  createSubmissionWorker,
  createEmailWorker,
  submissionQueue,
} from "@/modules/app/lib/queue/queue-manager";
import prisma from "@/modules/prisma/lib/prisma";
import { NotificationsService } from "@/modules/app/services/notifications.service";
import { NotificationType } from "@prisma/client";
import { submissionProcessor } from "@/modules/app/services/submission-processor.service";
// Removed env gating; always process queues

// Function to verify admin API key
function verifyAdminApiKey(request: NextRequest): boolean {
  const apiKey =
    request.headers.get("x-admin-api-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  const expectedApiKey = process.env.ADMIN_API_KEY;

  if (!expectedApiKey) {
    console.error("❌ ADMIN_API_KEY not configured in environment variables");
    return false;
  }

  return apiKey === expectedApiKey;
}

// Manual queue processing endpoint for deployment environments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
  console.log("🔄 [API] Manual queue processing triggered");

  // Allow from Vercel Cron without API key; require key otherwise
  const isCron = request.headers.get("x-vercel-cron");
  if (!isCron && !verifyAdminApiKey(request)) {
    console.error("❌ [API] Unauthorized access attempt to admin endpoint");
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing API key" },
      { status: 401 }
    );
  }

  // Always proceed to process queues

  try {
    // Verify Redis connections first
    const connectionTest = await testRedisConnections();
    if (!connectionTest.upstash || !connectionTest.queue) {
      console.error("❌ Redis connections failed");
      return NextResponse.json(
        {
          success: false,
          error: "Redis connection failed",
          details: connectionTest,
        },
        { status: 500 }
      );
    }

    // Get initial queue stats
    const initialStats = await getQueueStats();
    console.log("📊 Initial queue stats:", initialStats);

    if (
      initialStats.submission.waiting === 0 &&
      initialStats.email.waiting === 0
    ) {
      return NextResponse.json({
        success: true,
        message: "No jobs in queue to process",
        stats: initialStats,
        processed: 0,
      });
    }

    // Create temporary workers to process jobs (best-effort)
    const submissionWorker = createSubmissionWorker();
    const emailWorker = createEmailWorker();

    // Promote waiting jobs and let workers process them to avoid double-processing races
    let syncProcessed = 0;
    try {
      const waitingJobs = await submissionQueue.getWaiting(0, 50);
      for (const job of waitingJobs) {
        try {
          // Promote job to active so the worker picks it up
          await job.promote();
        } catch {
          // ignore if already active/locked
        }
      }
    } catch (scanErr) {
      console.warn("⚠️ Job promotion skipped:", scanErr);
    }

    // Wait briefly to allow background workers to pick up any remaining jobs
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Maintenance task: data deletion scheduler (soft cron)
    try {
      const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const soonMs = 7 * 24 * 60 * 60 * 1000; // 7 days reminder

      const orgs = await prisma.organization.findMany({
        where: {
          isActive: true,
          planExpiresAt: { not: null },
        },
        select: {
          id: true,
          planExpiresAt: true,
          memberships: { select: { userId: true } },
        },
      });

      const notifier = new NotificationsService();
      for (const org of orgs) {
        const expiresAt = org.planExpiresAt as unknown as Date | null;
        if (!expiresAt) continue;
        const expiredSince = now - new Date(expiresAt).getTime();

        // Send reminder near 3 months mark
        if (
          expiredSince > 0 &&
          expiredSince < threeMonthsMs &&
          threeMonthsMs - expiredSince <= soonMs
        ) {
          for (const m of org.memberships) {
            await notifier.createNotification({
              userId: m.userId,
              orgId: org.id,
              type: NotificationType.SYSTEM_ALERT,
              title: "Aviso de eliminación de datos",
              message:
                "Tu organización está inactiva. Eliminaremos los datos de forma permanente si no reactivas tu suscripción.",
              actionUrl: "/pricing",
              metadata: { kind: "data_deletion_warning" },
            });
          }
        }

        // Hard delete after 3 months: cancel provider preapproval before deleting
        if (expiredSince >= threeMonthsMs) {
          try {
            const subs = await prisma.subscription.findMany({
              where: { orgId: org.id },
            });
            for (const s of subs) {
              if (s.providerSubscriptionId) {
                // Set preapproval to cancelled on provider
                await fetch(
                  "https://api.mercadopago.com/preapproval/" +
                    s.providerSubscriptionId,
                  {
                    method: "PUT",
                    headers: {
                      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN || ""}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: "cancelled" }),
                  }
                );
              }
            }
          } catch {}
          // Delete organization cascade via Prisma relations where configured
          await prisma.organization.delete({ where: { id: org.id } });
        }
      }
    } catch (maintenanceError) {
      console.warn("⚠️ Maintenance job failed:", maintenanceError);
    }

    // Get final stats
    const finalStats = await getQueueStats();
    const processed = {
      submissions:
        Math.max(
          0,
          initialStats.submission.waiting - finalStats.submission.waiting
        ) + syncProcessed,
      emails: Math.max(
        0,
        initialStats.email.waiting - finalStats.email.waiting
      ),
    };

    // Clean up workers
    await submissionWorker.close();
    await emailWorker.close();

    console.log(
      `✅ [API] Queue processing completed. Processed: ${processed.submissions} submissions, ${processed.emails} emails (sync: ${syncProcessed})`
    );

    return NextResponse.json({
      success: true,
      message: "Queue processing completed",
      initialStats,
      finalStats,
      processed: processed.submissions + processed.emails,
      details: processed,
    });
  } catch (error) {
    console.error("❌ [API] Queue processing failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Queue processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get queue status
export async function GET(request: NextRequest) {
  // Verify API key authentication for health check too
  const isCron = request.headers.get("x-vercel-cron");
  if (!isCron && !verifyAdminApiKey(request)) {
    console.error("❌ [API] Unauthorized access attempt to admin health check");
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing API key" },
      { status: 401 }
    );
  }

  try {
    const stats = await getQueueStats();
    const connectionTest = await testRedisConnections();

    return NextResponse.json({
      success: true,
      healthy: connectionTest.upstash && connectionTest.queue,
      connections: connectionTest,
      stats,
    });
  } catch (error) {
    console.error("❌ [API] Queue status check failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Queue status check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
