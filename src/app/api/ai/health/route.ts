import { getQueueStats } from "@/modules/app/lib/queue/queue-manager";
import prisma from "@/modules/prisma/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import IORedis from "ioredis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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

    // 5. Check if workers are running
    const workersRunning = queueStats;

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
