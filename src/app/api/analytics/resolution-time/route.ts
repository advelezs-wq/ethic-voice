import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getUserPermissions } from "@/modules/core/utils/permissions";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID requerido" },
        { status: 400 }
      );
    }

    // First, verify the organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    // Check user permissions
    const permissions = await getUserPermissions(userId, orgId);
    if (!permissions.canViewAllReports) {
      return NextResponse.json(
        { error: "No tienes permisos para ver analíticas" },
        { status: 403 }
      );
    }

    // Get resolved reports with processing time data
    const resolvedReports = await prisma.formSubmission.findMany({
      where: {
        orgId: orgId,
        status: { in: ["RESOLVED", "CLOSED"] },
        processedAt: { not: null },
      },
      select: {
        submittedAt: true,
        processedAt: true,
      },
    });

    if (resolvedReports.length === 0) {
      // Return default data structure if no resolved reports
      return NextResponse.json({
        averageTime: 0,
        fastestResolution: 0,
        slowestResolution: 0,
        totalResolved: 0,
        timeDistribution: [
          { range: "0-7 días", count: 0, percentage: 0 },
          { range: "8-14 días", count: 0, percentage: 0 },
          { range: "15-30 días", count: 0, percentage: 0 },
          { range: "30+ días", count: 0, percentage: 0 },
        ],
        monthlyTrend: [],
      });
    }

    // Calculate resolution times in days
    const resolutionTimes = resolvedReports.map((report) => {
      const submitDate = new Date(report.submittedAt);
      const resolveDate = new Date(report.processedAt!);
      return Math.floor(
        (resolveDate.getTime() - submitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    });

    // Calculate metrics
    const averageTime = Math.round(
      resolutionTimes.reduce((sum, time) => sum + time, 0) /
        resolutionTimes.length
    );
    const fastestResolution = Math.min(...resolutionTimes);
    const slowestResolution = Math.max(...resolutionTimes);

    // Calculate distribution
    const distribution = {
      "0-7": resolutionTimes.filter((time) => time <= 7).length,
      "8-14": resolutionTimes.filter((time) => time > 7 && time <= 14).length,
      "15-30": resolutionTimes.filter((time) => time > 14 && time <= 30).length,
      "30+": resolutionTimes.filter((time) => time > 30).length,
    };

    const totalResolved = resolutionTimes.length;
    const timeDistribution = [
      {
        range: "0-7 días",
        count: distribution["0-7"],
        percentage: Math.round((distribution["0-7"] / totalResolved) * 100),
      },
      {
        range: "8-14 días",
        count: distribution["8-14"],
        percentage: Math.round((distribution["8-14"] / totalResolved) * 100),
      },
      {
        range: "15-30 días",
        count: distribution["15-30"],
        percentage: Math.round((distribution["15-30"] / totalResolved) * 100),
      },
      {
        range: "30+ días",
        count: distribution["30+"],
        percentage: Math.round((distribution["30+"] / totalResolved) * 100),
      },
    ];

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthReports = resolvedReports.filter((report) => {
        const processedDate = new Date(report.processedAt!);
        return processedDate >= monthStart && processedDate <= monthEnd;
      });

      if (monthReports.length > 0) {
        const monthTimes = monthReports.map((report) => {
          const submitDate = new Date(report.submittedAt);
          const resolveDate = new Date(report.processedAt!);
          return Math.floor(
            (resolveDate.getTime() - submitDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
        });

        const avgTime = Math.round(
          monthTimes.reduce((sum, time) => sum + time, 0) / monthTimes.length
        );

        monthlyTrend.push({
          month: monthStart.toLocaleDateString("es-ES", { month: "short" }),
          avgTime,
          count: monthReports.length,
        });
      } else {
        monthlyTrend.push({
          month: monthStart.toLocaleDateString("es-ES", { month: "short" }),
          avgTime: 0,
          count: 0,
        });
      }
    }

    const resolutionData = {
      averageTime,
      fastestResolution,
      slowestResolution,
      totalResolved,
      timeDistribution,
      monthlyTrend,
    };

    return NextResponse.json(resolutionData);
  } catch (error) {
    console.error("Error fetching resolution time data:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
