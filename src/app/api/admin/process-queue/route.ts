import { NextRequest, NextResponse } from "next/server";
import { testRedisConnections } from "@/modules/app/lib/queue/redis-config";

// A single AI analysis call routinely takes 40-100s+ (see
// compliance-ai-processor.ts). The previous 5s wait below closed the worker
// long before any real job could finish, so this fallback never actually
// processed anything — it just promoted jobs to "active" and abandoned them.
export const maxDuration = 60;
import {
  getQueueStats,
  createSubmissionWorker,
  createEmailWorker,
  submissionQueue,
} from "@/modules/app/lib/queue/queue-manager";
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

    // Wait long enough for at least one real AI analysis to complete, rather
    // than closing the worker (and abandoning any in-flight job) after a
    // handful of seconds.
    await new Promise((resolve) => setTimeout(resolve, 50000));

    // Org expiry notices + hard deletion live in /api/admin/maintenance,
    // which daily-runner already calls earlier in its sequence — this used
    // to duplicate that logic (without the provider-cancellation step), so
    // any org past the 90-day mark was deleted here first and maintenance's
    // safer version never got a chance to cancel its MercadoPago preapproval.

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
