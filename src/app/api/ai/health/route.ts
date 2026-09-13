import { getQueueStats, submissionQueue, emailQueue } from "@/modules/app/lib/queue/queue-manager";
import prisma from "@/modules/prisma/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import IORedis from "ioredis";
import { NextResponse } from "next/server";

// CRITICAL: this destructured Clerk's own `orgId` from auth() — this app
// doesn't use Clerk Organizations, so that's always undefined for every
// user. The `orgId ? {orgId} : {}` fallbacks below then silently queried
// with NO org filter at all, so any signed-in user (this is an internal
// diagnostics page at /app/debug/ai-system with no superadmin gate) got the
// 5 most recent AI processing jobs across every organization on the
// platform. Gated on superadmin, matching this endpoint's actual intent as
// an internal ops tool.
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const requesterEmail = (await currentUser())?.primaryEmailAddress?.emailAddress;
    if (!requesterEmail || !isSuperAdmin(requesterEmail)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const orgId: string | null = null;

    // 1. Check Redis connection
    let redisStatus = "disconnected";
    try {
      const redis = new IORedis(
        process.env.REDIS_URL || "redis://localhost:6379"
      );
      await redis.ping();
      redisStatus = "connected";
      await redis.quit();
    } catch (error) {
      redisStatus = `error: ${error}`;
    }

    // 2. Check queue stats
    let queueStats;
    try {
      queueStats = await getQueueStats();
    } catch (error) {
      queueStats = { error: error };
    }

    // 3. Check email configuration
    let emailConfig = null;
    if (orgId) {
      emailConfig = await prisma.emailConfiguration.findUnique({
        where: { orgId },
      });
    }

    // 4. Check recent processing jobs
    const recentJobs = await prisma.aiProcessingJob.findMany({
      where: orgId ? { orgId } : {},
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        source: true,
        createdAt: true,
        errorMessage: true,
      },
    });

    // 5. Check if workers are running — count Redis clients actually
    // connected as BullMQ workers on these queues (queueStats being a
    // truthy object here previously always reported "running").
    let connectedWorkerCount = 0;
    try {
      const [submissionWorkers, emailWorkers] = await Promise.all([
        submissionQueue.getWorkers(),
        emailQueue.getWorkers(),
      ]);
      connectedWorkerCount = submissionWorkers.length + emailWorkers.length;
    } catch {
      connectedWorkerCount = 0;
    }
    const workersRunning = connectedWorkerCount > 0;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      queues: queueStats,
      emailConfig: emailConfig
        ? {
            active: emailConfig.isActive,
            lastChecked: emailConfig.lastCheckedAt,
            emailsProcessed: emailConfig.emailsProcessed,
          }
        : "No configurado",
      recentJobs,
      workersRunning,
      connectedWorkerCount,
      env: {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasRedis: !!process.env.REDIS_URL,
        hasGoogleCreds: !!process.env.GOOGLE_CLIENT_ID,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Error en health check", details: error },
      { status: 500 }
    );
  }
}
