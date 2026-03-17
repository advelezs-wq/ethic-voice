import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import prisma from "@/modules/prisma/lib/prisma";
import { submissionQueue } from "@/modules/app/lib/queue/queue-manager";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const orgId = await resolveOrgId();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const submissionId = parseInt((await params).id);
    if (Number.isNaN(submissionId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const jobId = `submission-${orgId}-${submissionId}`;

    const job = await submissionQueue.getJob(jobId);
    if (!job) {
      return NextResponse.json({
        status: "unknown",
        position: null,
        eta: null,
      });
    }

    const state = await job.getState();

    // Compute waiting position (1-based). If active, position = 0
    let position = 0;
    if (state !== "active" && state !== "completed" && state !== "failed") {
      const waitingJobs = await submissionQueue.getJobs(
        ["waiting", "delayed"],
        0,
        1000
      );
      const idx = waitingJobs.findIndex((j) => j && j.id === jobId);
      position = idx >= 0 ? idx + 1 : 0;
    }

    // Estimate ETA based on recent average processing duration and concurrency
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // last 7 days
    const recent = await prisma.aiProcessingJob.findMany({
      where: { orgId, status: "completed", completedAt: { gte: since } },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: { createdAt: true, completedAt: true },
    });
    const durations = recent
      .map((r) =>
        r.completedAt && r.createdAt
          ? r.completedAt.getTime() - r.createdAt.getTime()
          : null
      )
      .filter((n): n is number => typeof n === "number" && n > 0);
    const avgMs = Math.max(
      15000,
      Math.round(
        durations.reduce((a, b) => a + b, 0) / (durations.length || 1) || 15000
      )
    );
    const concurrency = 3; // matches worker config

    let etaMs = avgMs;
    if (state === "active") {
      etaMs = Math.round(avgMs * 0.5);
    } else if (position > 0) {
      etaMs = Math.round(((position - 1) / concurrency + 1) * avgMs);
    }

    const eta = new Date(Date.now() + etaMs).toISOString();

    return NextResponse.json({
      status: state,
      position,
      eta,
      jobId,
    });
  } catch (error) {
    console.error("Error fetching submission queue info:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
