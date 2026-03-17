import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG] Starting dashboard data test...");

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID es requerido" },
        { status: 400 }
      );
    }

    console.log("🔍 [DEBUG] Using orgId:", orgId);

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

    console.log("🔍 [DEBUG] Found reports:", reports.length);

    // Calculate basic stats
    const totalReports = reports.length;
    const pendingReports = reports.filter((r) => r.status === "PENDING").length;
    const inProgressReports = reports.filter(
      (r) => r.status === "IN_PROGRESS"
    ).length;
    const resolvedReports = reports.filter(
      (r) => r.status === "RESOLVED" || r.status === "CLOSED"
    ).length;
    const anonymousReports = reports.filter((r) => r.isAnonymous).length;
    const criticalReports = reports.filter(
      (r) =>
        r.priority === "HIGH" ||
        r.priority === "URGENT" ||
        r.aiSeverity === "HIGH"
    ).length;

    // Calculate percentage change (mock for now)
    const percentageChange = totalReports > 0 ? 100.0 : 0;

    // Calculate average resolution time
    const resolvedReportsWithTime = reports.filter(
      (r) => (r.status === "RESOLVED" || r.status === "CLOSED") && r.processedAt
    );
    const averageResolutionTime =
      resolvedReportsWithTime.length > 0
        ? Math.round(
            resolvedReportsWithTime.reduce((acc, report) => {
              const days = Math.floor(
                (new Date(report.processedAt!).getTime() -
                  new Date(report.submittedAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return acc + days;
            }, 0) / resolvedReportsWithTime.length
          )
        : 0;

    // Build stats object
    const stats = {
      totalReports,
      newReports: pendingReports,
      inProgress: inProgressReports,
      closedReports: resolvedReports,
      percentageChange,
      anonymousReports,
      averageResolutionTime,
      criticalReports,
    };

    // Generate weekly trend data (last 7 days)
    const weeklyTrend = [];
    const days = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayReports = reports.filter((r) => {
        const reportDate = new Date(r.submittedAt);
        return reportDate.toDateString() === date.toDateString();
      });
      weeklyTrend.push({
        name: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        reports: dayReports.length,
      });
    }

    // Generate monthly chart data (last 6 months)
    const chartData = [];
    const months = ["feb", "mar", "abr", "may", "jun", "jul"];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthReports = reports.filter((r) => {
        const reportDate = new Date(r.submittedAt);
        return (
          reportDate.getMonth() === date.getMonth() &&
          reportDate.getFullYear() === date.getFullYear()
        );
      });
      chartData.push({
        name: months[5 - i] || `mes-${5 - i}`,
        reports: monthReports.length,
      });
    }

    // Generate category distribution
    const categoryCounts = reports.reduce(
      (acc, report) => {
        // Use the type field or try to extract from content
        let category: string = report.type || "";

        if (!category) {
          try {
            const content: Record<string, unknown> =
              typeof report.content === "string"
                ? JSON.parse(report.content)
                : (report.content as Record<string, unknown>) || {};
            category =
              (content["tipo_incidencia"] as string | undefined) ||
              (content["category"] as string | undefined) ||
              "Sin clasificar";
          } catch (_e) {
            category = "Sin clasificar";
          }
        }

        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const colors = ["#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#3b82f6"];
    const categoryData = Object.entries(categoryCounts).map(
      ([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
        percentage:
          totalReports > 0 ? Math.round((value / totalReports) * 100) : 0,
      })
    );

    // Generate department distribution
    const departmentCounts = reports.reduce(
      (acc, report) => {
        const deptName = report.department?.name || "Sin Departamento";
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const departmentData = Object.entries(departmentCounts).map(
      ([name, count]) => ({
        name,
        count,
        percentage:
          totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
      })
    );

    // Generate severity distribution
    const severityCounts = reports.reduce(
      (acc, report) => {
        const severity = report.aiSeverity || "UNKNOWN";
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const severityDistribution = {
      high: severityCounts.HIGH || 0,
      medium: severityCounts.MEDIUM || 0,
      low: severityCounts.LOW || 0,
      unknown: severityCounts.UNKNOWN || 0,
    };

    // Generate source distribution
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

    // Recent reports for dashboard (only the 5 most recent)
    const recentReports = reports.slice(0, 5).map((report) => {
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
        (parsedContent["asunto"] as string | undefined) ||
        `Reporte #${report.id}`;

      return {
        // Required fields for Report interface
        idTable: report.id,
        id: report.id.toString(),
        subject: title,
        category: report.type || "Sin clasificar",
        severity: report.priority || "NORMAL",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
        assigneeId: report.assignments[0]?.userId || undefined,
        assignments:
          report.assignments?.map((assignment) => ({
            userId: assignment.userId,
            userName: assignment.userName || "Usuario desconocido",
          })) || [],
      };
    });

    // Build complete dashboard data structure
    const dashboardData = {
      organizationId: orgId,
      stats,
      recentReports,
      chartData,
      categoryData,
      departmentData,
      severityDistribution,
      sourceDistribution,
      weeklyTrend,

      // Debug info
      debug: {
        totalReports,
        pendingReports,
        inProgressReports,
        resolvedReports,
        anonymousReports,
        criticalReports,
        weeklyTrendLength: weeklyTrend.length,
        chartDataLength: chartData.length,
        categoryDataLength: categoryData.length,
        departmentDataLength: departmentData.length,
        timestamp: new Date().toISOString(),
      },
    };

    console.log("🔍 [DEBUG] Returning dashboard data:", {
      totalReports: dashboardData.stats.totalReports,
      recentReportsCount: dashboardData.recentReports.length,
      weeklyTrendCount: dashboardData.weeklyTrend.length,
      chartDataCount: dashboardData.chartData.length,
      categoryDataCount: dashboardData.categoryData.length,
      departmentDataCount: dashboardData.departmentData.length,
    });

    return NextResponse.json(dashboardData);
  } catch (error: unknown) {
    console.error("❌ [DEBUG] Error fetching dashboard data:", error);
    const err = error instanceof Error ? error : undefined;
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: err?.message ?? String(error),
        stack: err?.stack ?? null,
      },
      { status: 500 }
    );
  }
}
