import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getUserPermissions } from "@/modules/core/utils/permissions";
import { getSlaTotalDays } from "@/modules/app/utils/dashboard.utils";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

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
    const permissions = await getUserPermissions(
      userId,
      orgId,
      user?.primaryEmailAddress?.emailAddress
    );
    if (!permissions.canViewAllReports) {
      return NextResponse.json(
        { error: "No tienes permisos para ver analíticas" },
        { status: 403 }
      );
    }

    // Get all reports for the organization
    const reports = await prisma.formSubmission.findMany({
      where: { orgId: orgId },
      include: {
        assignments: true,
        department: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Get organization members (excluding admin)
    const organizationMembers = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            orgId: orgId,
            role: {
              not: "ADMIN",
            },
          },
        },
      },
      include: {
        memberships: {
          where: {
            orgId: orgId,
          },
        },
      },
    });

    // Calculate analytics data
    const totalReports = reports.length;

    // Status distribution
    const statusCounts = reports.reduce(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const statusDistribution = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
        percentage:
          totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
      })
    );

    // Department reports
    const departmentCounts = reports.reduce(
      (acc, report) => {
        const deptName = report.department?.name || "Sin Departamento";
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const departmentReports = Object.entries(departmentCounts).map(
      ([department, count]) => ({
        department,
        count,
      })
    );

    // Report types (severity)
    const typeCounts = reports.reduce(
      (acc, report) => {
        const severity = report.aiSeverity || "UNKNOWN";
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const reportTypes = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage:
        totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
    }));

    // Enhanced team performance calculation
    const assignedReports = reports.filter((r) => r.assignments.length > 0);
    const resolvedReports = reports.filter((r) => r.status === "RESOLVED");
    const anonymousReports = reports.filter((r) => r.isAnonymous);
    const highPriorityReports = reports.filter(
      (r) => r.priority === "HIGH" || r.priority === "URGENT"
    );

    // Calculate member performance (excluding super admin)
    const memberPerformance: Array<{
      investigator: string;
      email: string;
      role: string;
      assignedCount: number;
      resolvedCount: number;
      avgTime: number;
      productivityScore: number;
    }> = [];

    for (const member of organizationMembers) {
      const memberAssignments = assignedReports.filter((report) =>
        report.assignments.some((assignment) => assignment.userId === member.id)
      );

      const memberResolved = resolvedReports.filter((report) =>
        report.assignments.some((assignment) => assignment.userId === member.id)
      );

      // Calculate average resolution time for this member
      const resolvedWithTime = memberResolved.filter(
        (report) => report.processedAt && report.submittedAt
      );

      const avgTime =
        resolvedWithTime.length > 0
          ? resolvedWithTime.reduce((acc, report) => {
              const days = Math.floor(
                (new Date(report.processedAt!).getTime() -
                  new Date(report.submittedAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return acc + days;
            }, 0) / resolvedWithTime.length
          : 0;

      // Calculate productivity score
      const productivityScore =
        memberAssignments.length > 0
          ? Math.round((memberResolved.length / memberAssignments.length) * 100)
          : 0;

      if (memberAssignments.length > 0 || memberResolved.length > 0) {
        memberPerformance.push({
          investigator:
            member.firstName && member.lastName
              ? `${member.firstName} ${member.lastName}`
              : member.email || "Usuario Desconocido",
          email: member.email || "",
          role: member.memberships[0]?.role || "MEMBER",
          assignedCount: memberAssignments.length,
          resolvedCount: memberResolved.length,
          avgTime: Math.round(avgTime),
          productivityScore,
        });
      }
    }

    // Sort by productivity score (descending)
    memberPerformance.sort((a, b) => b.productivityScore - a.productivityScore);

    const teamPerformance = {
      activeInvestigators: memberPerformance.length,
      averageResolutionTime:
        memberPerformance.length > 0
          ? Math.round(
              memberPerformance.reduce(
                (acc, member) => acc + member.avgTime,
                0
              ) / memberPerformance.length
            )
          : 0,
      productivityScore:
        memberPerformance.length > 0
          ? Math.round(
              memberPerformance.reduce(
                (acc, member) => acc + member.productivityScore,
                0
              ) / memberPerformance.length
            )
          : 0,
      assignments: memberPerformance.slice(0, 10), // Top 10 performers
    };

    // Monthly trend (last 12 months)
    const now = new Date();
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthReports = reports.filter((r) => {
        const reportDate = new Date(r.submittedAt);
        return (
          reportDate.getFullYear() === date.getFullYear() &&
          reportDate.getMonth() === date.getMonth()
        );
      });

      monthlyTrend.push({
        date: date.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
        }),
        count: monthReports.length,
      });
    }

    // Calculate trend change
    const currentMonth = monthlyTrend[monthlyTrend.length - 1]?.count || 0;
    const previousMonth = monthlyTrend[monthlyTrend.length - 2]?.count || 0;
    const change =
      previousMonth > 0
        ? ((currentMonth - previousMonth) / previousMonth) * 100
        : currentMonth > 0
          ? 100
          : 0;

    // Source distribution
    const sourceCounts = reports.reduce(
      (acc, report) => {
        acc[report.source] = (acc[report.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const sourceDistribution = {
      ethicLine: sourceCounts.ETHIC_LINE || 0,
      customForm: sourceCounts.CUSTOM_FORM || 0,
      email: sourceCounts.EMAIL || 0,
      whatsapp: sourceCounts.WHATSAPP || 0,
      api: sourceCounts.API || 0,
    };

    // Priority distribution
    const priorityCounts = reports.reduce(
      (acc, report) => {
        acc[report.priority] = (acc[report.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const priorityDistribution = {
      urgent: priorityCounts.URGENT || 0,
      high: priorityCounts.HIGH || 0,
      medium: priorityCounts.MEDIUM || 0,
      low: priorityCounts.LOW || 0,
    };

    // Recent reports (last 10 reports with essential info)
    const recentReports = reports
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
      .slice(0, 10)
      .map((report) => {
        // Parse content for title and details
        let parsedContent: Record<string, unknown> = {};
        try {
          parsedContent =
            typeof report.content === "string"
              ? JSON.parse(report.content)
              : report.content || {};
        } catch (_e) {
          parsedContent = {};
        }

        // Get title from various possible fields
        const title =
          (parsedContent["titulo_reporte"] as string | undefined) ||
          (parsedContent["title"] as string | undefined) ||
          `Reporte #${report.id}`;

        // Map report assignments
        const assignments =
          report.assignments?.map((assignment) => {
            const member = organizationMembers.find(
              (m) => m.id === assignment.userId
            );
            return {
              userId: assignment.userId,
              userName:
                assignment.userName ||
                (member
                  ? `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                    member.email
                  : "Usuario desconocido"),
            };
          }) || [];

        // Calculate deadline based on SLA by type (fallback to priority rules)
        const deadlineDate = new Date(report.submittedAt);
        const totalDays = getSlaTotalDays(
          String(report.priority),
          report.type || undefined
        );
        deadlineDate.setDate(deadlineDate.getDate() + totalDays);

        // Percentage consumed for semaphore
        const daysSince = Math.floor(
          (new Date().getTime() - new Date(report.submittedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const percentConsumed = Math.max(
          0,
          Math.round((daysSince / totalDays) * 100)
        );
        const needsAlert = percentConsumed > 85;

        return {
          // Required fields for Report interface
          idTable: report.id,
          id: report.id.toString(),
          subject: title,
          category: report.type || "Sin clasificar",
          severity: report.priority || "NORMAL",
          deadline: deadlineDate.toISOString(),
          slaDays: totalDays,
          slaPercentConsumed: percentConsumed,
          slaNeedsAlert: needsAlert,
          status: (() => {
            switch (report.status) {
              case "PENDING":
                return "new";
              case "IN_PROGRESS":
                return "progress";

              case "RESOLVED":
                return "closed";
              case "CLOSED":
                return "closed";
              case "ARCHIVED":
                return "archived";
              default:
                return "new";
            }
          })() as "new" | "progress" | "closed" | "archived",
          content: parsedContent,
          submittedAt: report.submittedAt,
          source: report.source,
          isAnonymous: report.isAnonymous,
          department: report.department?.name || undefined,
          assigneeId: assignments[0]?.userId || undefined,
          assignments: assignments,
        };
      });

    const analyticsData = {
      totalReports: {
        current: totalReports,
        trend: monthlyTrend,
        change: Math.round(change * 10) / 10, // Round to 1 decimal
      },
      statusDistribution,
      departmentReports,
      teamPerformance,
      reportTypes,
      memberPerformance: memberPerformance, // Include full member performance data
      organizationMetrics: {
        totalMembers: organizationMembers.length,
        activeMembersWithReports: memberPerformance.length,
        averageReportsPerMember:
          memberPerformance.length > 0
            ? Math.round(totalReports / memberPerformance.length)
            : 0,
        topPerformer: memberPerformance[0] || null,
      },
      // Recent reports for dashboard
      recentReports,
      // Additional metrics for better analytics
      anonymousReports: anonymousReports.length,
      highPriorityReports: highPriorityReports.length,
      sourceDistribution,
      priorityDistribution,
      assignedReports: assignedReports.length,
      resolvedReports: resolvedReports.length,
      // SLA alerts counts (orange/red)
      slaOrangeCount: recentReports.filter(
        (r: any) => r.slaPercentConsumed >= 86 && r.slaPercentConsumed <= 100
      ).length,
      slaRedCount: recentReports.filter((r: any) => r.slaPercentConsumed > 100)
        .length,
    } as any;

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
