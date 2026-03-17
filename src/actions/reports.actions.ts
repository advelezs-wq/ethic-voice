/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import prisma from "@/modules/prisma/lib/prisma";
import { notificationsService } from "@/modules/app/services/notifications.service";
import { v2 as cloudinary } from "cloudinary";
import { subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  Report,
  ChartDataPoint,
  CategoryData,
  DepartmentData,
} from "@/types/dashboard.types";
import { IRREGULARITY_TYPES } from "@/modules/submit/constants/ethicline.constants";
import {
  ReportFilters,
  ReportItem,
  ReportsWithPagination,
  FilterCounts,
} from "@/types/reports";
import { redirect } from "next/navigation";
import { Prisma, ReportStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  FormSubmission,
  ReportActivity,
  ReportAttachment,
  ReportComment,
} from "@/types/reports";
import { SubmissionSource } from "@/types/submission.types";
import { userHasPermission } from "@/modules/core/utils/permissions";

// ============================
// ORIGINAL DASHBOARD METHODS
// ============================

export async function getRecentReports(
  orgId: string,
  limit = 5,
  userId?: string // For member filtering
): Promise<Report[]> {
  const { userId: authUserId } = await auth();

  if (!authUserId) {
    redirect("/sign-in");
  }

  try {
    const whereClause: any = {
      orgId,
      // Exclude archived reports from main dashboard
      status: {
        not: "ARCHIVED",
      },
    };

    // If userId is provided (member role), filter by assigned reports
    if (userId) {
      whereClause.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const submissions = await prisma.formSubmission.findMany({
      where: whereClause,
      orderBy: { submittedAt: "desc" },
      take: limit,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          select: {
            userId: true,
            userName: true,
          },
        },
      },
    });

    return submissions.map((submission) => {
      const content = JSON.parse(submission.content);
      const status = () => {
        if (submission.processedAt) {
          return "closed";
        }

        if (submission.status === ReportStatus.ARCHIVED) {
          return "archived";
        }

        if (submission.status === ReportStatus.IN_PROGRESS) {
          return "progress";
        } else {
          return "new";
        }
      };

      // Calculate deadline based on severity
      const daysUntilDeadline =
        submission.priority === "HIGH"
          ? 3
          : submission.priority === "NORMAL"
            ? 5
            : 8;
      const daysSinceSubmission = Math.floor(
        (new Date().getTime() - new Date(submission.submittedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const remainingDays = Math.max(
        0,
        daysUntilDeadline - daysSinceSubmission
      );

      return {
        idTable: submission.id,
        id: `REP-${String(submission.id).padStart(6, "0")}`,
        subject: extractSubject(content, submission.source),
        category: extractCategory(content, submission.source),
        severity: submission.priority,
        deadline: `${remainingDays} días`,
        status: status(),
        content,
        submittedAt: submission.submittedAt,
        source: submission.source,
        isAnonymous: submission.isAnonymous,
        department: submission.department?.name || undefined, // Use database relation
        assigneeId: submission.assignments?.[0]?.userId || undefined,
        assignments: submission.assignments,
      };
    });
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
}

export async function getChartData(
  orgId: string,
  userId?: string // For member filtering
): Promise<ChartDataPoint[]> {
  try {
    const whereClause: Prisma.FormSubmissionWhereInput = { orgId };

    if (userId) {
      whereClause.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const monthlyData: ChartDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await prisma.formSubmission.count({
        where: {
          ...whereClause,
          submittedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthlyData.push({
        name: format(date, "MMM", { locale: es }),
        reports: count,
      });
    }

    return monthlyData;
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return [];
  }
}

export async function getCategoryData(
  orgId: string,
  userId?: string // For member filtering
): Promise<CategoryData[]> {
  try {
    const whereClause: Prisma.FormSubmissionWhereInput = { orgId };

    if (userId) {
      whereClause.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const submissions = await prisma.formSubmission.findMany({
      where: whereClause,
      select: {
        content: true,
        source: true,
      },
    });

    const categoryCount: Record<string, number> = {};
    const total = submissions.length;

    submissions.forEach((submission) => {
      const content = JSON.parse(submission.content);
      const categoryId =
        submission.source === "ETHIC_LINE"
          ? content.irregularityType
          : "reporte-libre";

      if (categoryId) {
        categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
      }
    });

    return Object.entries(categoryCount)
      .map(([categoryId, count]) => {
        const categoryInfo = IRREGULARITY_TYPES.find(
          (type) => type.id === categoryId
        );
        return {
          name: categoryInfo?.title || "Otros",
          value: count,
          color: categoryInfo?.color || "#6b7280",
          percentage: total > 0 ? (count / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error("Error fetching category data:", error);
    return [];
  }
}

export async function getSeverityDistribution(
  orgId: string,
  userId?: string // For member filtering
): Promise<{
  high: number;
  medium: number;
  low: number;
  unknown: number;
}> {
  try {
    const whereClause: Prisma.FormSubmissionWhereInput = { orgId };

    if (userId) {
      whereClause.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const [high, medium, low, unknown] = await Promise.all([
      prisma.formSubmission.count({
        where: { ...whereClause, aiSeverity: "HIGH" },
      }),
      prisma.formSubmission.count({
        where: { ...whereClause, aiSeverity: "MEDIUM" },
      }),
      prisma.formSubmission.count({
        where: { ...whereClause, aiSeverity: "LOW" },
      }),
      prisma.formSubmission.count({
        where: { ...whereClause, aiSeverity: "UNKNOWN" },
      }),
    ]);

    return { high, medium, low, unknown };
  } catch (error) {
    console.error("Error fetching severity distribution:", error);
    return { high: 0, medium: 0, low: 0, unknown: 0 };
  }
}

export async function getSourceDistribution(
  orgId: string,
  userId?: string // For member filtering
): Promise<{
  ethicLine: number;
  customForm: number;
}> {
  try {
    const whereClause: Prisma.FormSubmissionWhereInput = { orgId };

    if (userId) {
      whereClause.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const [ethicLine, customForm] = await Promise.all([
      prisma.formSubmission.count({
        where: { ...whereClause, source: "ETHIC_LINE" },
      }),
      prisma.formSubmission.count({
        where: { ...whereClause, source: "CUSTOM_FORM" },
      }),
    ]);

    return { ethicLine, customForm };
  } catch (error) {
    console.error("Error fetching source distribution:", error);
    return { ethicLine: 0, customForm: 0 };
  }
}

export async function getDepartmentData(
  orgId: string,
  userId?: string // For member filtering
): Promise<DepartmentData[]> {
  try {
    const whereClause: Prisma.FormSubmissionWhereInput = {
      orgId,
      source: SubmissionSource.ETHIC_LINE,
    };

    if (userId) {
      whereClause.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const submissions = await prisma.formSubmission.findMany({
      where: whereClause,
      select: {
        content: true,
      },
    });

    const departmentCount: Record<string, number> = {};
    const total = submissions.length;

    submissions.forEach((submission) => {
      const content = JSON.parse(submission.content);
      const department = content.reported?.department || "Otro";
      departmentCount[department] = (departmentCount[department] || 0) + 1;
    });

    return Object.entries(departmentCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 departments
  } catch (error) {
    console.error("Error fetching department data:", error);
    return [];
  }
}

export async function getReportsWithFilters(
  filters: ReportFilters,
  page: number = 1,
  pageSize: number = 20,
  userId?: string,
  departmentId?: string
): Promise<{
  reports: any[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  counts: FilterCounts;
}> {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    throw new Error("Organization not found");
  }

  const whereClause: Prisma.FormSubmissionWhereInput = {
    orgId,
  };

  // Status filtering
  if (typeof filters.status === "string" && filters.status !== "all") {
    const normalized = filters.status.toUpperCase();
    if (normalized === "ARCHIVED") {
      whereClause.status = "ARCHIVED" as any;
    } else if (normalized === "CLOSED" || normalized === "RESOLVED") {
      whereClause.status = normalized as any;
    } else {
      // PENDING, IN_PROGRESS, etc.
      whereClause.status = normalized as any;
    }
  } else {
    // Default active view: exclude archived and closed/resolved
    whereClause.status = { notIn: ["ARCHIVED", "CLOSED", "RESOLVED"] } as any;
  }

  // If userId is provided (member role), filter by assigned reports
  if (userId) {
    // For members, show reports where they are assigned
    whereClause.assignments = {
      some: {
        userId: userId,
      },
    };
  } else if (typeof filters.assignee === "string" && filters.assignee !== "all") {
    // Only apply assignee filtering if userId is not provided (i.e., for admins)
    switch (filters.assignee) {
      case "unassigned":
        whereClause.assignments = {
          none: {},
        };
        break;
      case "me":
        whereClause.assignments = {
          some: {
            userId: authUserId,
          },
        };
        break;
      case "others":
        whereClause.assignments = {
          some: {
            userId: {
              not: authUserId,
            },
          },
        };
        break;
    }
  }

  // If departmentId is provided, filter by department
  if (departmentId) {
    whereClause.departmentId = departmentId;
  }

  if (filters.search) {
    whereClause.OR = [
      { content: { contains: filters.search, mode: "insensitive" } },
      { aiSummary: { contains: filters.search, mode: "insensitive" } },
      { reporterName: { contains: filters.search, mode: "insensitive" } },
      { reporterEmail: { contains: filters.search, mode: "insensitive" } },
      { type: { contains: filters.search, mode: "insensitive" } },
      { id: { equals: parseInt(filters.search) || undefined } },
    ];
  }

  if (typeof filters.severity === "string" && filters.severity !== "all") {
    whereClause.aiSeverity = filters.severity.toUpperCase() as any;
  }

  if (typeof filters.source === "string" && filters.source !== "all") {
    whereClause.source = filters.source.toUpperCase() as any;
  }

  // New filters support
  if (typeof filters.priority === "string" && filters.priority !== "all") {
    whereClause.priority = filters.priority.toUpperCase() as any;
  }

  if (filters.departmentId && filters.departmentId !== "all") {
    whereClause.departmentId = filters.departmentId;
  }

  if (filters.anonymous && filters.anonymous !== "all") {
    whereClause.isAnonymous = filters.anonymous === "anonymous";
  }

  if (typeof filters.reportType === "string" && filters.reportType !== "all") {
    whereClause.type = {
      contains: filters.reportType,
      mode: "insensitive",
    } as any;
  }

  if (typeof filters.dateRange === "string" && filters.dateRange !== "all") {
    const now = new Date();
    let startDate: Date;

    switch (filters.dateRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;
      default:
        startDate = new Date(0);
    }

    whereClause.submittedAt = {
      gte: startDate,
    };
  }

  if (typeof filters.assignee === "string" && filters.assignee !== "all") {
    switch (filters.assignee) {
      case "unassigned":
        whereClause.assignments = {
          none: {},
        };
        break;
      case "me":
        whereClause.assignments = {
          some: {
            userId: authUserId,
          },
        };
        break;
      case "others":
        whereClause.assignments = {
          some: {
            userId: {
              not: authUserId,
            },
          },
        };
        break;
    }
  }

  const skip = (page - 1) * pageSize;

  const [reports, totalCount, counts] = await Promise.all([
    prisma.formSubmission.findMany({
      where: whereClause,
      orderBy: { submittedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        form: {
          select: {
            title: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          select: {
            id: true,
            userId: true,
            userName: true,
            createdAt: true,
          },
          take: 5, // Limit to first 5 assignments for performance
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            assignments: true,
          },
        },
      },
    }),
    prisma.formSubmission.count({
      where: whereClause,
    }),
    (async (): Promise<FilterCounts> => {
      const [byStatus, bySeverity, bySource] = await Promise.all([
        prisma.formSubmission.groupBy({
          by: ["status"],
          where: { orgId },
          _count: { _all: true },
        }),
        prisma.formSubmission.groupBy({
          by: ["aiSeverity"],
          where: { orgId },
          _count: { _all: true },
        }),
        prisma.formSubmission.groupBy({
          by: ["source"],
          where: { orgId },
          _count: { _all: true },
        }),
      ]);
      return {
        status: Object.fromEntries(
          byStatus.map((r) => [r.status as string, r._count._all])
        ),
        severity: Object.fromEntries(
          bySeverity.map((r) => [r.aiSeverity as string, r._count._all])
        ),
        source: Object.fromEntries(
          bySource.map((r) => [r.source as string, r._count._all])
        ),
      };
    })(),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Convert the data to match the expected types
  const formattedReports = reports.map((report) => ({
    ...report,
    submittedAt: report.submittedAt.toISOString(),
    processedAt: report.processedAt?.toISOString() || null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    assignedAt: null, // Remove this field as we now use assignments
    assigneeId: null, // Remove this field as we now use assignments
    assigneeName: null, // Remove this field as we now use assignments
    assignments: report.assignments.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      createdBy: "", // You might want to add this field to the query if needed
    })),
  }));

  return {
    reports: formattedReports as unknown as ReportItem[],
    totalCount,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    counts,
  };
}

export async function updateReportStatus(
  reportId: number,
  status: ReportStatus
): Promise<void> {
  const orgId = await resolveOrgId();

  if (!orgId) {
    throw new Error("Unauthorized - No organization access");
  }

  try {
    const report = await prisma.formSubmission.findFirst({
      where: { id: reportId, orgId },
    });

    if (!report) {
      throw new Error("Report not found or access denied");
    }

    await prisma.formSubmission.update({
      where: { id: reportId },
      data: {
        status,
        processedAt:
          status === "CLOSED" || status === "RESOLVED" ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    // Create activity log
    await prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "STATUS_CHANGED",
        details: { oldStatus: report.status, newStatus: status },
        userId: "system",
        userName: "Sistema",
      },
    });

    revalidatePath(`/app/reports/${reportId}`);
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
}

export async function deleteReport(reportId: number): Promise<void> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress || undefined;
  const canManageOrganization = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );

  if (!canManageOrganization) {
    throw new Error("No tienes permisos para eliminar reportes");
  }

  const existingReport = await prisma.formSubmission.findFirst({
    where: {
      id: reportId,
      orgId,
    },
    select: {
      id: true,
    },
  });

  if (!existingReport) {
    throw new Error("Reporte no encontrado");
  }

  await prisma.$transaction(async (tx) => {
    await tx.aiProcessingJob.deleteMany({
      where: {
        orgId,
        submissionId: reportId,
      },
    });

    await tx.formSubmission.delete({
      where: {
        id: reportId,
      },
    });
  });

  revalidatePath("/app");
  revalidatePath("/app/reports");
  revalidatePath("/app/reports/archived");
}

export async function updateReportProcessedAt(
  reportId: number,
  processedAt: Date
): Promise<void> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  const user = await currentUser();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!orgId) {
    throw new Error("Organization not found");
  }

  await prisma.formSubmission.update({
    where: {
      id: reportId,
      orgId,
    },
    data: {
      processedAt: processedAt,
    },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: "PROCESSED_AT",
      details: {
        newProcessedAt: processedAt,
        updatedBy: userId,
      },
      userId,
      userName: user?.fullName as string,
    },
  });

  revalidatePath("/app/reports");
}

export async function bulkUpdateReports(
  reportIds: number[],
  action: "priority" | "status" | "archive", // Remove "assign" as it's no longer valid
  value?: string
): Promise<void> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!orgId) {
    throw new Error("Organization not found");
  }

  const updateData: Prisma.FormSubmissionUpdateManyArgs["data"] = {};

  switch (action) {
    case "priority":
      if (value) {
        updateData.priority = value.toUpperCase() as any;
      }
      break;
    case "status":
      if (value) {
        updateData.status = value.toUpperCase() as any;
      }
      break;
    case "archive":
      updateData.status = "ARCHIVED";
      break;
  }

  await prisma.formSubmission.updateMany({
    where: {
      id: { in: reportIds },
      orgId,
    },
    data: updateData,
  });

  // Create activity for each report
  const activities = reportIds.map((reportId) => ({
    submissionId: reportId,
    action: `BULK_${action.toUpperCase()}`,
    details: {
      value,
      updatedBy: userId,
    },
    userId,
    userName: "Current User",
  }));

  await prisma.reportActivity.createMany({
    data: activities,
  });

  revalidatePath("/app/reports");
}

// ============================
// REPORT DETAILS METHODS
// ============================

export async function getReport(reportId: number): Promise<FormSubmission> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const report = await prisma.formSubmission.findFirst({
    where: {
      id: reportId,
      orgId,
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        orderBy: { uploadedAt: "desc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
      assignments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  // Convert Date objects to strings and handle JsonValue types
  return {
    ...report,
    departmentId: report.departmentId,
    department: report.department
      ? {
          id: report.department.id,
          name: report.department.name,
        }
      : null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    submittedAt: report.submittedAt.toISOString(),
    processedAt: report.processedAt?.toISOString() || null,
    // Return sanitized metadata to the UI (no IP, userAgent, etc.)
    metadata: ((): any => {
      const m = report.metadata as Record<string, any> | null;
      if (!m) return null;
      const { aiAnalysis, requiresUrgentAction } = m;
      return {
        aiAnalysis,
        requiresUrgentAction,
      };
    })(),
    comments: report.comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorEmail: comment.authorEmail ?? undefined,
    })),
    attachments: report.attachments.map((attachment) => ({
      ...attachment,
      uploadedAt: attachment.uploadedAt.toISOString(),
    })),
    activities: report.activities.map((activity) => ({
      ...activity,
      createdAt: activity.createdAt.toISOString(),
      details: activity.details as Record<string, any> | undefined,
    })),
    assignments: report.assignments.map((assignment) => ({
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
    })),
  };
}

export async function updateReportStatusDetailed(
  reportId: number,
  newStatus: string,
  userId?: string,
  userName?: string
) {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId || !orgId) {
    throw new Error("Unauthorized");
  }

  const actualUserId = userId || authUserId;
  const actualUserName = userName || "Current User";

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const oldStatus = report.status;

  await prisma.$transaction([
    prisma.formSubmission.update({
      where: { id: reportId },
      data: { status: newStatus.toUpperCase() as any },
    }),
    prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "STATUS_CHANGED",
        details: {
          oldStatus,
          newStatus: newStatus.toUpperCase(),
        },
        userId: actualUserId,
        userName: actualUserName,
      },
    }),
  ]);

  // Send notifications to assigned members
  try {
    const assignments = await prisma.reportAssignment.findMany({
      where: { reportId },
      select: { userId: true },
    });

    for (const assignment of assignments) {
      await notificationsService.createNotification({
        userId: assignment.userId,
        orgId,
        type: "REPORT_STATUS_CHANGED",
        title: "Estado de Reporte Actualizado",
        message: `El reporte REP-${String(reportId).padStart(6, "0")} cambió de ${oldStatus} a ${newStatus.toUpperCase()}`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: "IN_APP",
        metadata: {
          oldStatus,
          newStatus: newStatus.toUpperCase(),
          changedBy: actualUserName,
          reportTitle: `REP-${String(reportId).padStart(6, "0")}`,
        },
      });
    }
  } catch (notificationError) {
    console.error(
      "Error sending status change notifications:",
      notificationError
    );
    // Don't fail the status update if notifications fail
  }

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

export async function updateReportPriority(
  reportId: number,
  newPriority: string,
  userId?: string,
  userName?: string
) {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId || !orgId) {
    throw new Error("Unauthorized");
  }

  const actualUserId = userId || authUserId;
  const actualUserName = userName || "Current User";

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const oldPriority = report.priority;

  await prisma.$transaction([
    prisma.formSubmission.update({
      where: { id: reportId },
      data: { priority: newPriority.toUpperCase() as any },
    }),
    prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "PRIORITY_UPDATED",
        details: {
          oldPriority,
          newPriority: newPriority.toUpperCase(),
        },
        userId: actualUserId,
        userName: actualUserName,
      },
    }),
  ]);

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

export async function updateReportCategory(
  reportId: number,
  newCategory: string,
  userId?: string,
  userName?: string
) {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId || !orgId) {
    throw new Error("Unauthorized");
  }

  const actualUserId = userId || authUserId;
  const actualUserName = userName || "Current User";

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const oldCategory = report.type;

  await prisma.$transaction([
    prisma.formSubmission.update({
      where: { id: reportId },
      data: { type: newCategory.toUpperCase() as any },
    }),
    prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "CATEGORY_UPDATED",
        details: {
          oldCategory,
          newCategory: newCategory.toUpperCase(),
        },
        userId: actualUserId,
        userName: actualUserName,
      },
    }),
  ]);

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

export async function updateReportDepartment(
  reportId: number,
  newDepartment: string,
  userId?: string,
  userName?: string
) {
  const { userId: authUserId, orgId } = await auth();

  if (!authUserId || !orgId) {
    throw new Error("Unauthorized");
  }

  const actualUserId = userId || authUserId;
  const actualUserName = userName || "Current User";

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const oldDepartment = report.departmentId;

  await prisma.$transaction([
    prisma.formSubmission.update({
      where: { id: reportId },
      data: { departmentId: newDepartment.toUpperCase() as any },
    }),
    prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "DEPARTMENT_UPDATED",
        details: {
          oldDepartment,
          newDepartment: newDepartment.toUpperCase(),
        },
        userId: actualUserId,
        userName: actualUserName,
      },
    }),
  ]);

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

export async function updateReportMetadata(
  reportId: number,
  data: {
    type?: string | null;
    departmentId?: string | null;
    subject?: string | null;
  }
): Promise<void> {
  const { userId, orgId } = await auth();
  const user = await currentUser();

  if (!userId || !orgId) throw new Error("Unauthorized");

  await prisma.formSubmission.update({
    where: { id: reportId, orgId },
    data: {
      type: data.type ?? undefined,
      departmentId: data.departmentId ?? undefined,
      internalNotes: undefined,
      updatedAt: new Date(),
    },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: "METADATA_UPDATED",
      details: { ...data },
      userId,
      userName: user?.fullName || "Usuario",
    },
  });

  revalidatePath(`/app/reports/${reportId}`);
}

export async function updateReportSubject(
  reportId: number,
  subject: string
): Promise<void> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId) throw new Error("Unauthorized");

  await prisma.formSubmission.update({
    where: { id: reportId, orgId },
    data: {
      aiSummary: subject,
      updatedAt: new Date(),
    },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: "SUBJECT_UPDATED",
      details: { subject },
      userId,
      userName: user?.fullName || "Usuario",
    },
  });

  revalidatePath(`/app/reports/${reportId}`);
}

export async function getReportComments(
  reportId: number
): Promise<ReportComment[]> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const comments = await prisma.reportComment.findMany({
    where: {
      submissionId: reportId,
      submission: {
        orgId,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Convert Date objects to strings
  return comments.map((comment) => ({
    ...comment,
    updatedAt: comment.updatedAt,
    createdAt: comment.createdAt,
    authorEmail: comment.authorEmail ?? undefined, // Convert null to undefined
  }));
}

export async function addReportComment(
  reportId: number,
  content: string,
  authorId?: string,
  authorName?: string,
  authorEmail?: string,
  isInternal = false
): Promise<ReportComment> {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId || !orgId) {
    throw new Error("Unauthorized");
  }

  const actualAuthorId = authorId || authUserId;
  const actualAuthorName = authorName || "Current User";

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const [comment] = await prisma.$transaction([
    prisma.reportComment.create({
      data: {
        submissionId: reportId,
        content,
        authorId: actualAuthorId,
        authorName: actualAuthorName,
        authorEmail,
        isInternal,
      },
    }),
    prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "COMMENT_ADDED",
        details: {
          isInternal,
          preview: content.substring(0, 100),
        },
        userId: actualAuthorId,
        userName: actualAuthorName,
      },
    }),
  ]);

  revalidatePath(`/app/reports/${reportId}`);

  // Convert Date to string
  return {
    ...comment,
    createdAt: comment.createdAt,
    authorEmail: comment.authorEmail ?? undefined, // Convert null to undefined
  };
}

export async function getReportAttachments(
  reportId: number
): Promise<ReportAttachment[]> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const attachments = await prisma.reportAttachment.findMany({
    where: {
      submissionId: reportId,
      submission: {
        orgId,
      },
    },
    orderBy: { uploadedAt: "desc" },
  });

  // Convert Date objects to strings
  return attachments.map((attachment) => ({
    ...attachment,
    uploadedAt: attachment.uploadedAt.toISOString(),
  }));
}

export async function uploadReportAttachment(
  reportId: number,
  file: File,
  uploadedById?: string,
  uploadedByName?: string
): Promise<ReportAttachment> {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId || !orgId) {
    throw new Error("Unauthorized");
  }

  const actualUploadedById = uploadedById || authUserId;
  const actualUploadedByName = uploadedByName || "Current User";

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  // Upload to Cloudinary
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const dataURI = `data:${file.type};base64,${base64}`;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const uploadResponse = await cloudinary.uploader.upload(dataURI, {
    folder: `reports/${orgId}/attachments`,
    resource_type: "auto",
    max_file_size: 50000000, // 50MB - Generous for evidence files
    allowed_formats: [
      "jpg",
      "png",
      "gif",
      "pdf",
      "doc",
      "docx",
      "mp3",
      "mp4",
      "avi",
      "mov",
      "xlsx",
      "txt",
    ],
  });

  const [attachment] = await prisma.$transaction([
    prisma.reportAttachment.create({
      data: {
        submissionId: reportId,
        filename: file.name,
        fileUrl: uploadResponse.secure_url,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: actualUploadedById,
        uploadedByName: actualUploadedByName,
      },
    }),
    prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "ATTACHMENT_UPLOADED",
        details: {
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          cloudinaryUrl: uploadResponse.secure_url,
          cloudinaryPublicId: uploadResponse.public_id,
        },
        userId: actualUploadedById,
        userName: actualUploadedByName,
      },
    }),
  ]);

  revalidatePath(`/app/reports/${reportId}`);

  // Convert Date to string
  return {
    ...attachment,
    uploadedAt: attachment.uploadedAt.toISOString(),
  };
}

export async function getReportActivities(
  reportId: number
): Promise<ReportActivity[]> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const activities = await prisma.reportActivity.findMany({
    where: {
      submissionId: reportId,
      submission: {
        orgId,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert Date objects to strings and handle JsonValue types
  return activities.map((activity) => ({
    ...activity,
    createdAt: activity.createdAt.toISOString(),
    details: activity.details as Record<string, any> | undefined,
  }));
}

export async function addReportNote(
  reportId: number,
  note: string,
  userId?: string,
  userName?: string
) {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId || !orgId) {
    throw new Error("Unauthorized");
  }

  const actualUserId = userId || authUserId;
  const actualUserName = userName || "Current User";

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  await prisma.$transaction([
    prisma.formSubmission.update({
      where: { id: reportId },
      data: { internalNotes: note },
    }),
    prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "NOTE_ADDED",
        details: {
          preview: (note || "").substring(0, 100),
        },
        userId: actualUserId,
        userName: actualUserName,
      },
    }),
  ]);

  revalidatePath(`/app/reports/${reportId}`);
}

// ===== REPORT UPDATES MANAGEMENT =====

export async function getReportUpdates(reportId: number) {
  const orgId = await resolveOrgId();

  if (!orgId) {
    throw new Error("Unauthorized - No organization access");
  }

  try {
    const updates = await prisma.reportUpdate.findMany({
      where: {
        submissionId: reportId,
        submission: { orgId },
      },
      orderBy: { createdAt: "desc" },
    });

    return updates;
  } catch (error) {
    console.error("Error fetching report updates:", error);
    throw error;
  }
}

export async function createReportUpdate(
  reportId: number,
  data: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    dueDate?: string;
    assignedTo?: string;
  }
) {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify report exists and user has access
    const report = await prisma.formSubmission.findFirst({
      where: { id: reportId, orgId },
    });

    if (!report) {
      throw new Error("Report not found or access denied");
    }

    // Check if report is closed
    if (report.status === "CLOSED" || report.status === "RESOLVED") {
      throw new Error("Cannot add updates to a closed report");
    }

    const update = await prisma.$transaction(async (tx) => {
      const newUpdate = await tx.reportUpdate.create({
        data: {
          submissionId: reportId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          assignedTo: data.assignedTo || null,
          createdById: userId,
          createdByName: user.fullName || "Unknown User",
        },
      });

      // Create activity log
      await tx.reportActivity.create({
        data: {
          submissionId: reportId,
          action: "UPDATE_ADDED",
          details: {
            updateId: newUpdate.id,
            title: data.title,
            priority: data.priority,
          },
          userId,
          userName: user.fullName || "Unknown User",
        },
      });

      return newUpdate;
    });

    // Notify assignees and admins
    const [assignments, admins] = await Promise.all([
      prisma.reportAssignment.findMany({ where: { reportId } }),
      prisma.organizationMembership.findMany({
        where: { orgId: report.orgId, role: "ADMIN" },
      }),
    ]);

    const recipients = new Set<string>();
    assignments.forEach((a) => recipients.add(a.userId));
    admins.forEach((m) => recipients.add(m.userId));

    await Promise.all(
      Array.from(recipients).map((uid) =>
        notificationsService.createNotification({
          userId: uid,
          orgId: report.orgId,
          type: "SYSTEM_ALERT" as any,
          title: "Nueva acción en el caso",
          message: `Se creó "${data.title}" en el caso REP-${String(reportId).padStart(6, "0")}`,
          actionUrl: `/app/reports/${reportId}`,
          reportId,
          channel: "BOTH" as any,
          metadata: { priority: data.priority, dueDate: data.dueDate },
        })
      )
    );

    revalidatePath(`/app/reports/${reportId}`);
    return update;
  } catch (error) {
    console.error("Error creating report update:", error);
    throw error;
  }
}

export async function updateReportUpdate(
  updateId: number,
  data: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    status: "pending" | "in_progress" | "completed";
    dueDate?: string;
    assignedTo?: string;
  }
) {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify update exists and user has access
    const existingUpdate = await prisma.reportUpdate.findFirst({
      where: {
        id: updateId,
        submission: { orgId },
      },
      include: { submission: true },
    });

    if (!existingUpdate) {
      throw new Error("Update not found or access denied");
    }

    // Check if report is closed
    if (
      existingUpdate.submission.status === "CLOSED" ||
      existingUpdate.submission.status === "RESOLVED"
    ) {
      throw new Error("Cannot modify updates on a closed report");
    }

    const update = await prisma.$transaction(async (tx) => {
      const updatedUpdate = await tx.reportUpdate.update({
        where: { id: updateId },
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          assignedTo: data.assignedTo || null,
          updatedAt: new Date(),
        },
      });

      // Create activity log
      await tx.reportActivity.create({
        data: {
          submissionId: existingUpdate.submissionId,
          action: "UPDATE_MODIFIED",
          details: {
            updateId: updateId,
            title: data.title,
            oldStatus: existingUpdate.status,
            newStatus: data.status,
          },
          userId,
          userName: user.fullName || "Unknown User",
        },
      });

      return updatedUpdate;
    });

    revalidatePath(`/app/reports/${existingUpdate.submissionId}`);
    return update;
  } catch (error) {
    console.error("Error updating report update:", error);
    throw error;
  }
}

export async function deleteReportUpdate(updateId: number) {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify update exists and user has access
    const existingUpdate = await prisma.reportUpdate.findFirst({
      where: {
        id: updateId,
        submission: { orgId },
      },
      include: { submission: true },
    });

    if (!existingUpdate) {
      throw new Error("Update not found or access denied");
    }

    // Check if report is closed
    if (
      existingUpdate.submission.status === "CLOSED" ||
      existingUpdate.submission.status === "RESOLVED"
    ) {
      throw new Error("Cannot delete updates from a closed report");
    }

    await prisma.$transaction(async (tx) => {
      await tx.reportUpdate.delete({
        where: { id: updateId },
      });

      // Create activity log
      await tx.reportActivity.create({
        data: {
          submissionId: existingUpdate.submissionId,
          action: "UPDATE_DELETED",
          details: {
            updateId: updateId,
            title: existingUpdate.title,
          },
          userId,
          userName: user.fullName || "Unknown User",
        },
      });
    });

    revalidatePath(`/app/reports/${existingUpdate.submissionId}`);
  } catch (error) {
    console.error("Error deleting report update:", error);
    throw error;
  }
}

// ============================
// HELPER FUNCTIONS
// ============================

function extractSubject(content: any, source: string): string {
  if (source === "ETHIC_LINE") {
    const irregularityType = content.irregularityType || "";
    const reportedName = content.reported?.firstName || "No especificado";
    const typeInfo = IRREGULARITY_TYPES.find(
      (type: { id: any }) => type.id === irregularityType
    );

    return `${typeInfo?.title || "Irregularidad"} - ${reportedName}`;
  }

  // Handle API/manual reports with flat structure
  if (source === "API") {
    const title = content.titulo_reporte || content.title;
    if (title) {
      return title.length > 50 ? title.substring(0, 50) + "..." : title;
    }

    const irregularityType =
      content.tipo_irregularidad || content.irregularityType;
    if (irregularityType) {
      const typeInfo = IRREGULARITY_TYPES.find(
        (type: { id: any }) => type.id === irregularityType
      );
      return typeInfo?.title || irregularityType;
    }
  }

  // For custom forms, try to extract a meaningful subject
  const values = Object.values(content);
  return values.length > 0
    ? String(values[0]).substring(0, 50) + "..."
    : "Formulario personalizado";
}

function extractCategory(content: any, source: string): string {
  if (source === "ETHIC_LINE") {
    const irregularityType = content.irregularityType;
    const typeInfo = IRREGULARITY_TYPES.find(
      (type) => type.id === irregularityType
    );
    return typeInfo?.title || "Otros";
  }

  // Handle API/manual reports with flat structure
  if (source === "API") {
    const irregularityType =
      content.tipo_irregularidad || content.irregularityType;
    if (irregularityType) {
      const typeInfo = IRREGULARITY_TYPES.find(
        (type) => type.id === irregularityType
      );
      return typeInfo?.title || irregularityType;
    }
  }

  return "Formulario Personalizado";
}

// Note: Department is derived from the DB relation now; helper kept removed to avoid unused-var warning.

// ===== CUSTOM REPORT ACTIVITIES =====

export async function createCustomReportActivity(
  reportId: number,
  data: {
    title: string;
    description: string;
  }
) {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();
  const user = await (await import("@clerk/nextjs/server")).currentUser();

  if (!userId || !orgId || !user) {
    throw new Error("No autorizado");
  }

  try {
    // Verify report exists and user has access
    const report = await prisma.formSubmission.findFirst({
      where: { id: reportId, orgId },
    });

    if (!report) {
      throw new Error("Report not found or access denied");
    }

    // Idempotency: avoid duplicates created within 10s with same title/description by same user
    const tenSecondsAgo = new Date(Date.now() - 10_000);
    const duplicate = await prisma.reportActivity.findFirst({
      where: {
        submissionId: reportId,
        action: "CUSTOM_EVENT",
        userId,
        createdAt: { gte: tenSecondsAgo },
      },
      orderBy: { createdAt: "desc" },
    });
    if (duplicate && (duplicate.details as any)?.title === data.title && (duplicate.details as any)?.description === data.description) {
      return duplicate;
    }

    const activity = await prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "CUSTOM_EVENT",
        details: {
          title: data.title,
          description: data.description,
          type: "custom",
        },
        userId,
        userName: user.fullName || "Unknown User",
      },
    });

    revalidatePath(`/app/reports/${reportId}`);
    return activity;
  } catch (error) {
    console.error("Error creating custom activity:", error);
    throw error;
  }
}

// ============================
// ARCHIVED REPORTS
// ============================

export async function getArchivedReports(
  filters: ReportFilters,
  page: number = 1,
  pageSize: number = 20,
  userId?: string,
  departmentId?: string
): Promise<ReportsWithPagination> {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    throw new Error("Organization not found");
  }

  const whereClause: Prisma.FormSubmissionWhereInput = {
    orgId,
    status: "ARCHIVED", // Only show archived reports
  };

  // If userId is provided (member role), filter by assigned reports
  if (userId) {
    whereClause.assignments = {
      some: {
        userId: userId,
      },
    };
  } else if (filters.assignee !== "all") {
    switch (filters.assignee) {
      case "unassigned":
        whereClause.assignments = {
          none: {},
        };
        break;
      case "me":
        whereClause.assignments = {
          some: {
            userId: authUserId,
          },
        };
        break;
      case "others":
        whereClause.assignments = {
          some: {
            userId: {
              not: authUserId,
            },
          },
        };
        break;
    }
  }

  // If departmentId is provided, filter by department
  if (departmentId) {
    whereClause.departmentId = departmentId;
  }

  if (filters.search) {
    whereClause.OR = [
      { content: { contains: filters.search, mode: "insensitive" } },
      { aiSummary: { contains: filters.search, mode: "insensitive" } },
      { reporterName: { contains: filters.search, mode: "insensitive" } },
      { reporterEmail: { contains: filters.search, mode: "insensitive" } },
      { type: { contains: filters.search, mode: "insensitive" } },
      { id: { equals: parseInt(filters.search) || undefined } },
    ];
  }

  if (typeof filters.severity === "string" && filters.severity !== "all") {
    whereClause.aiSeverity = filters.severity.toUpperCase() as any;
  }

  if (typeof filters.source === "string" && filters.source !== "all") {
    whereClause.source = filters.source.toUpperCase() as any;
  }

  if (typeof filters.dateRange === "string" && filters.dateRange !== "all") {
    const now = new Date();
    let startDate: Date;

    switch (filters.dateRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;
      default:
        startDate = new Date(0);
    }

    whereClause.submittedAt = {
      gte: startDate,
    };
  }

  const skip = (page - 1) * pageSize;

  const [reports, totalCount] = await Promise.all([
    prisma.formSubmission.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { submittedAt: "desc" },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          select: {
            userId: true,
            userName: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.formSubmission.count({ where: whereClause }),
  ]);

  const totalPages2 = Math.ceil(totalCount / pageSize);

  return {
    reports: reports.map((submission) => ({
      id: submission.id,
      orgId: submission.orgId,
      formId: submission.formId,
      departmentId: submission.departmentId,
      content: submission.content,
      source: submission.source,
      metadata: submission.metadata,
      submittedAt: submission.submittedAt,
      aiSummary: submission.aiSummary,
      aiSeverity: submission.aiSeverity,
      processedAt: submission.processedAt,
      status: submission.status,
      priority: submission.priority,
      type: submission.type,
      location: submission.location,
      isAnonymous: submission.isAnonymous,
      reporterName: submission.reporterName,
      reporterEmail: submission.reporterEmail,
      reporterPhone: submission.reporterPhone,
      internalNotes: submission.internalNotes,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      department: submission.department
        ? { id: submission.department.id, name: submission.department.name }
        : null,
      _count: undefined,
      assignments: submission.assignments.map((assignment) => ({
        id: `${submission.id}-${assignment.userId}`,
        reportId: submission.id,
        userId: assignment.userId,
        userName: assignment.userName,
        createdAt: assignment.createdAt.toISOString(),
        createdBy: "system",
      })),
    })),
    totalCount,
    currentPage: page,
    totalPages: totalPages2,
  };
}

// ============================
// CLOSED REPORTS
// ============================
export async function getClosedReports(
  filters: ReportFilters,
  page: number = 1,
  pageSize: number = 20,
  userId?: string,
  departmentId?: string
): Promise<ReportsWithPagination> {
  const { userId: authUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!authUserId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    throw new Error("Organization not found");
  }

  const whereClause: Prisma.FormSubmissionWhereInput = {
    orgId,
    status: { in: ["CLOSED", "RESOLVED"] } as any,
  };

  if (userId) {
    whereClause.assignments = { some: { userId } };
  }

  if (filters.search) {
    whereClause.OR = [
      { content: { contains: filters.search, mode: "insensitive" } },
      { aiSummary: { contains: filters.search, mode: "insensitive" } },
      { reporterName: { contains: filters.search, mode: "insensitive" } },
      { reporterEmail: { contains: filters.search, mode: "insensitive" } },
      { type: { contains: filters.search, mode: "insensitive" } },
      { id: { equals: parseInt(filters.search) || undefined } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const [reports, totalCount] = await Promise.all([
    prisma.formSubmission.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { submittedAt: "desc" },
      include: {
        department: { select: { id: true, name: true } },
        assignments: { select: { userId: true, userName: true, createdAt: true } },
      },
    }),
    prisma.formSubmission.count({ where: whereClause }),
  ]);

  const totalPages2 = Math.ceil(totalCount / pageSize);

  return {
    reports: reports.map((submission) => ({
      id: submission.id,
      orgId: submission.orgId,
      formId: submission.formId,
      departmentId: submission.departmentId,
      content: submission.content,
      source: submission.source,
      metadata: submission.metadata,
      submittedAt: submission.submittedAt,
      aiSummary: submission.aiSummary,
      aiSeverity: submission.aiSeverity,
      processedAt: submission.processedAt,
      status: submission.status,
      priority: submission.priority,
      type: submission.type,
      location: submission.location,
      isAnonymous: submission.isAnonymous,
      reporterName: submission.reporterName,
      reporterEmail: submission.reporterEmail,
      reporterPhone: submission.reporterPhone,
      internalNotes: submission.internalNotes,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      department: submission.department
        ? { id: submission.department.id, name: submission.department.name }
        : null,
      _count: undefined,
      assignments: submission.assignments.map((assignment) => ({
        id: `${submission.id}-${assignment.userId}`,
        reportId: submission.id,
        userId: assignment.userId,
        userName: assignment.userName,
        createdAt: assignment.createdAt.toISOString(),
        createdBy: "system",
      })),
    })),
    totalCount,
    currentPage: page,
    totalPages: totalPages2,
  };
}

export async function createReportTask(
  reportId: number,
  data: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    status?: "pending" | "in_progress" | "completed" | "blocked";
    dueDate?: string;
    assignedTo?: string;
    parentId?: number;
  }
) {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    throw new Error("No autorizado");
  }

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });
  if (!report) throw new Error("Report not found or access denied");

  const siblingMax = await prisma.reportUpdate.aggregate({
    where: { submissionId: reportId, parentId: data.parentId ?? null },
    _max: { order: true },
  });

  const task = await prisma.reportUpdate.create({
    data: {
      submissionId: reportId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status || "pending",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assignedTo: data.assignedTo || null,
      parentId: data.parentId,
      order: (siblingMax._max.order ?? 0) + 1,
      createdById: userId,
      createdByName: user.fullName || "Unknown User",
    },
  });

  const isSubtask = Boolean(data.parentId);

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: "CUSTOM_EVENT",
      details: {
        title: `${isSubtask ? "Subtarea" : "Tarea"} creada`,
        description: `Se creó la ${isSubtask ? "subtarea" : "tarea"} #${task.id}: ${data.title}`,
        taskId: task.id,
        parentTaskId: data.parentId ?? undefined,
        taskTitle: data.title,
      },
      userId,
      userName: user.fullName || "Unknown User",
    },
  });

  revalidatePath(`/app/reports/${reportId}`);
  return task;
}

export async function updateReportTask(
  taskId: number,
  data: Partial<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    status: "pending" | "in_progress" | "completed" | "blocked";
    dueDate: string | null;
    assignedTo: string | null;
    parentId: number | null;
  }>
) {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  const user = await currentUser();
  if (!userId || !orgId || !user) throw new Error("Unauthorized");

  const existing = await prisma.reportUpdate.findFirst({
    where: { id: taskId, submission: { orgId } },
  });
  if (!existing) throw new Error("Task not found or access denied");

  const updated = await prisma.reportUpdate.update({
    where: { id: taskId },
    data: {
      title: data.title ?? undefined,
      description: data.description ?? undefined,
      priority: data.priority ?? undefined,
      status: data.status ?? undefined,
      dueDate:
        data.dueDate === undefined
          ? undefined
          : data.dueDate
            ? new Date(data.dueDate)
            : null,
      assignedTo: data.assignedTo === undefined ? undefined : data.assignedTo,
      parentId:
        data.parentId === undefined
          ? undefined
          : (data.parentId as number | null),
    },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: existing.submissionId,
      action: "CUSTOM_EVENT",
      details: {
        title: "Tarea actualizada",
        description: `La tarea #${taskId} fue actualizada`,
        taskId,
      },
      userId,
      userName: user.fullName || "Unknown User",
    },
  });

  revalidatePath(`/app/reports/${existing.submissionId}`);
  return updated;
}

export async function deleteReportTask(taskId: number) {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  const user = await currentUser();
  if (!userId || !orgId || !user) throw new Error("Unauthorized");

  const existing = await prisma.reportUpdate.findFirst({
    where: { id: taskId, submission: { orgId } },
  });
  if (!existing) throw new Error("Task not found or access denied");

  await prisma.reportUpdate.delete({ where: { id: taskId } });

  await prisma.reportActivity.create({
    data: {
      submissionId: existing.submissionId,
      action: "CUSTOM_EVENT",
      details: {
        title: "Tarea eliminada",
        description: `Se eliminó la tarea #${taskId}`,
        taskId,
      },
      userId,
      userName: user.fullName || "Unknown User",
    },
  });

  revalidatePath(`/app/reports/${existing.submissionId}`);
}

export async function reorderReportTasks(
  reportId: number,
  parentId: number | null,
  orderedIds: number[]
): Promise<void> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  if (!userId || !orgId) throw new Error("Unauthorized");

  // Verify tasks belong to org and report
  const tasks = await prisma.reportUpdate.findMany({
    where: {
      id: { in: orderedIds },
      submissionId: reportId,
      submission: { orgId },
      parentId: parentId ?? null,
    },
    select: { id: true },
  });
  const valid = new Set(tasks.map((t) => t.id));
  const updates: { id: number; order: number }[] = [];
  orderedIds.forEach((id, idx) => {
    if (valid.has(id)) updates.push({ id, order: idx + 1 });
  });

  await prisma.$transaction(
    updates.map((u) =>
      prisma.reportUpdate.update({
        where: { id: u.id },
        data: { order: u.order },
      })
    )
  );

  revalidatePath(`/app/reports/${reportId}`);
}
