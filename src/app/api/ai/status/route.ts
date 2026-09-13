import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { getQueueStats } from "@/modules/app/lib/queue/queue-manager";
import prisma from "@/modules/prisma/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    const orgId = await resolveOrgId();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get queue statistics
    const queueStats = await getQueueStats();

    // Get recent jobs. Each retry attempt creates its own AiProcessingJob
    // row (see submission-processor.service.ts), so a burst of retries for
    // other submissions can push an older-but-still-active job out of a
    // plain "10 most recent" window. Callers use recentJobs to build a
    // submissionId -> status map that decides whether to show a queue
    // spinner or the "Analizar con IA" button, so a still-processing
    // submission silently falling out of that window would show the wrong
    // one. Fetch active jobs separately (there are only ever a handful) and
    // merge them in alongside the most-recent-for-display window.
    const [recentJobsWindow, activeJobs] = await Promise.all([
      prisma.aiProcessingJob.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          submission: {
            select: {
              id: true,
              type: true,
              aiSeverity: true,
            },
          },
        },
      }),
      prisma.aiProcessingJob.findMany({
        where: { orgId, status: { in: ["pending", "processing"] } },
        orderBy: { createdAt: "desc" },
        include: {
          submission: {
            select: {
              id: true,
              type: true,
              aiSeverity: true,
            },
          },
        },
      }),
    ]);
    const recentJobs = [
      ...activeJobs,
      ...recentJobsWindow.filter(
        (job) => !activeJobs.some((active) => active.id === job.id)
      ),
    ];

    // Get processing stats
    const stats = await prisma.aiProcessingJob.groupBy({
      by: ["status"],
      where: { orgId },
      _count: true,
    });

    return NextResponse.json({
      queues: queueStats,
      recentJobs,
      stats: stats.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error obteniendo estado" },
      { status: 500 }
    );
  }
}
