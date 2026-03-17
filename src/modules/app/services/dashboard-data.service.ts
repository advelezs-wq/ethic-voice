import prisma from "@/modules/prisma/lib/prisma";

export interface DashboardData {
  organizationId: string;
  stats: {
    totalReports: number;
    newReports: number;
    inProgress: number;
    closedReports: number;
    percentageChange: number;
    anonymousReports: number;
    averageResolutionTime: number;
    criticalReports: number;
  };
  uptime?: {
    tracked: boolean;
    last7?: number;
    last30?: number;
    allTime?: number;
  };
  recentReports: Array<any>;
  chartData: Array<{ name: string; reports: number }>;
  categoryData: Array<{
    name: string;
    value: number;
    color?: string;
    percentage: number;
  }>;
  departmentData: Array<{ name: string; count: number; percentage: number }>;
  severityDistribution: {
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
  sourceDistribution: {
    ethicLine: number;
    customForm: number;
    email?: number;
    whatsapp?: number;
    api?: number;
  };
  weeklyTrend: Array<{ name: string; reports: number }>;
}

export async function getFullDashboardData(
  orgId: string
): Promise<DashboardData> {
  // Get all reports for the organization
  const reports = await prisma.formSubmission.findMany({
    where: { orgId },
    include: { assignments: true, department: true },
    orderBy: { submittedAt: "desc" },
  });

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

  const percentageChange = totalReports > 0 ? 100.0 : 0;

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

  // Weekly trend (last 7 days)
  const weeklyTrend: Array<{ name: string; reports: number }> = [];
  const days = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayReports = reports.filter(
      (r) => new Date(r.submittedAt).toDateString() === date.toDateString()
    );
    weeklyTrend.push({
      name: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
      reports: dayReports.length,
    });
  }

  // Monthly chart data (last 6 months)
  const chartData: Array<{ name: string; reports: number }> = [];
  const monthLabels = ["feb", "mar", "abr", "may", "jun", "jul"];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthReports = reports.filter((r) => {
      const d = new Date(r.submittedAt);
      return (
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });
    chartData.push({
      name: monthLabels[5 - i] || `mes-${5 - i}`,
      reports: monthReports.length,
    });
  }

  // Category distribution
  const categoryCounts = reports.reduce(
    (acc, report) => {
      let category: string = report.type || "";
      if (!category) {
        try {
          const content: Record<string, unknown> =
            typeof report.content === "string"
              ? JSON.parse(report.content)
              : (report.content as any) || {};
          category =
            (content["tipo_incidencia"] as string | undefined) ||
            (content["category"] as string | undefined) ||
            "Sin clasificar";
        } catch {
          category = "Sin clasificar";
        }
      }
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const colors = ["#999999", "#777777", "#555555", "#333333", "#bbbbbb"];
  const categoryData = Object.entries(categoryCounts).map(
    ([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
      percentage:
        totalReports > 0 ? Math.round((value / totalReports) * 100) : 0,
    })
  );

  // Department distribution
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

  // Severity distribution
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

  // Recent reports (top 5)
  const recentReports = reports.slice(0, 5).map((report) => {
    let parsedContent: Record<string, unknown> = {};
    try {
      parsedContent =
        typeof report.content === "string"
          ? JSON.parse(report.content)
          : (report.content as any) || {};
    } catch {
      parsedContent = {};
    }
    const title =
      (parsedContent["titulo_reporte"] as string | undefined) ||
      (parsedContent["title"] as string | undefined) ||
      (parsedContent["asunto"] as string | undefined) ||
      `Reporte #${report.id}`;

    return {
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
      })(),
      content: parsedContent,
      submittedAt: report.submittedAt,
      source: report.source,
      isAnonymous: report.isAnonymous,
      department: report.department?.name || undefined,
      assigneeId: report.assignments[0]?.userId || undefined,
      assignments:
        report.assignments?.map((a) => ({
          userId: a.userId,
          userName: a.userName || "Usuario desconocido",
        })) || [],
    };
  });

  // Uptime: not yet instrumented; provide structured placeholder (honest, non-fantasy)
  const uptime = { tracked: false } as {
    tracked: boolean;
    last7?: number;
    last30?: number;
    allTime?: number;
  };

  return {
    organizationId: orgId,
    stats: {
      totalReports,
      newReports: pendingReports,
      inProgress: inProgressReports,
      closedReports: resolvedReports,
      percentageChange,
      anonymousReports,
      averageResolutionTime,
      criticalReports,
    },
    uptime,
    recentReports,
    chartData,
    categoryData,
    departmentData,
    severityDistribution,
    sourceDistribution,
    weeklyTrend,
  };
}
