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

    // Primero la base de datos: ahí queda el resultado del análisis aunque la
    // cola (Redis) no esté disponible. Antes esta ruta dependía solo de Redis
    // y respondía 500 cada vez que el panel la consultaba si Redis fallaba.
    const [submission, lastJob] = await Promise.all([
      prisma.formSubmission.findFirst({
        where: { id: submissionId, orgId },
        select: { aiSummary: true, processedAt: true },
      }),
      prisma.aiProcessingJob.findFirst({
        where: { submissionId, orgId },
        orderBy: { createdAt: "desc" },
        select: { status: true },
      }),
    ]);
    if (!submission) {
      return NextResponse.json({ error: "Denuncia no encontrada" }, { status: 404 });
    }
    if (submission.aiSummary || lastJob?.status === "completed") {
      return NextResponse.json({ status: "completed", position: null, eta: null, jobId });
    }
    if (lastJob?.status === "failed") {
      return NextResponse.json({ status: "failed", position: null, eta: null, jobId });
    }

    let job: Awaited<ReturnType<typeof submissionQueue.getJob>> | null = null;
    try {
      job = await Promise.race([
        submissionQueue.getJob(jobId),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);
    } catch {
      job = null;
    }
    if (!job) {
      return NextResponse.json({
        status: "unknown",
        position: null,
        eta: null,
      });
    }

    const state = await Promise.race([
      job.getState(),
      new Promise<string>((resolve) => setTimeout(() => resolve("unknown"), 2000)),
    ]).catch(() => "unknown");

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
