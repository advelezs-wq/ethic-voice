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

    // Get recent jobs
    const recentJobs = await prisma.aiProcessingJob.findMany({
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
    });

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
