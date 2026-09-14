/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import {
  resolveOrgId,
  assertUserCanAccessOrg,
  assertUserCanAccessReport,
  assertUserCanWriteToReport,
} from "@/modules/core/utils/org-resolver";
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
} from "@/types/reports";
import { SubmissionSource } from "@/types/submission.types";
import {
  userHasPermission,
  isSuperAdmin as isSuperAdminByEmail,
  assertRoleCanWrite,
} from "@/modules/core/utils/permissions";
import { cookies } from "next/headers";

async function resolveReportsScope() {
  const orgId = await resolveOrgId();
  const jar = await cookies();
  const scopeCookie = jar.get("ev_scope")?.value;
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const isSuperAdmin = Boolean(email && isSuperAdminByEmail(email));
  const isGlobalScope = isSuperAdmin && scopeCookie !== "org";

  return { orgId, isGlobalScope };
}

// ============================
// ORIGINAL DASHBOARD METHODS
// ============================

export async function getRecentReports(
  orgId: string,
  limit = 5,
  userId?: string // For member filtering
): Promise<Report[]> {
  await assertUserCanAccessOrg(orgId);

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
  await assertUserCanAccessOrg(orgId);

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
  await assertUserCanAccessOrg(orgId);

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
  const { orgId, isGlobalScope } = await resolveReportsScope();

  if (!authUserId) {
    redirect("/sign-in");
  }

  if (!isGlobalScope && !orgId) {
    throw new Error("Organization not found");
  }

  const whereClause: Prisma.FormSubmissionWhereInput = isGlobalScope
    ? {}
    : {
        orgId: orgId as string,
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
          where: isGlobalScope ? {} : { orgId: orgId as string },
          _count: { _all: true },
        }),
        prisma.formSubmission.groupBy({
          by: ["aiSeverity"],
          where: isGlobalScope ? {} : { orgId: orgId as string },
          _count: { _all: true },
        }),
        prisma.formSubmission.groupBy({
          by: ["source"],
          where: isGlobalScope ? {} : { orgId: orgId as string },
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
  status: ReportStatus,
  closureSummary?: string
): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    throw new Error("Unauthorized - No organization access");
  }

  try {
    // orgId comes from the report itself, not resolveOrgId()'s cookie-
    // selected org — see assignMembersToReport in report-assignments.actions.ts
    // for the full rationale (a superadmin in the global cross-org view
    // routinely has a different org selected than the report being acted
    // on, which made this throw a misleading "not found or access denied").
    const report = await prisma.formSubmission.findFirst({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error("Report not found or access denied");
    }
    const orgId = report.orgId;
    await assertRoleCanWrite(userId, orgId);

    await prisma.formSubmission.update({
      where: { id: reportId },
      data: {
        status,
        processedAt:
          status === "CLOSED" || status === "RESOLVED" ? new Date() : null,
        updatedAt: new Date(),
        // ReportClosureComponent's "Resumen de cierre" textarea used to be
        // collected and then silently discarded — it was never passed to
        // this function, so it never reached the DB. internalNotes is what
        // that same component later reads back and displays as the closure
        // summary once the case shows as closed.
        ...(closureSummary?.trim() ? { internalNotes: closureSummary.trim() } : {}),
      },
    });

    await prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "STATUS_CHANGED",
        details: { oldStatus: report.status, newStatus: status },
        userId,
        userName: user?.fullName || "Usuario",
      },
    });

    revalidatePath(`/app/reports/${reportId}`);
    revalidatePath("/app/reports");
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
}

export type ClosureOutcome =
  | "SUBSTANTIATED"
  | "PARTIALLY_SUBSTANTIATED"
  | "UNSUBSTANTIATED"
  | "INCONCLUSIVE";

const CLOSURE_OUTCOMES: ClosureOutcome[] = [
  "SUBSTANTIATED",
  "PARTIALLY_SUBSTANTIATED",
  "UNSUBSTANTIATED",
  "INCONCLUSIVE",
];

const RETALIATION_FOLLOWUP_DAYS = 30;

// Null when the org hasn't configured a retention policy — cases are then
// kept indefinitely, which is the safe default (see Organization.caseRetentionDays).
async function computeRetentionExpiresAt(
  orgId: string,
  from: Date
): Promise<Date | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { caseRetentionDays: true },
  });
  if (!org?.caseRetentionDays || org.caseRetentionDays <= 0) return null;

  const expires = new Date(from);
  expires.setDate(expires.getDate() + org.caseRetentionDays);
  return expires;
}

/**
 * Anti-retaliation check-in: standard practice on the platforms this was
 * modeled on (NAVEX, Case IQ) is a scheduled follow-up after closure to
 * confirm the reporter hasn't faced retaliation. Reuses the existing
 * task/ReportUpdate infrastructure instead of a new schema — it's just a
 * task due in 30 days, assigned to whoever closed the case.
 */
async function scheduleRetaliationFollowUp(params: {
  reportId: number;
  isAnonymous: boolean;
  closerId: string;
  closerName: string;
}) {
  const { reportId, isAnonymous, closerId, closerName } = params;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + RETALIATION_FOLLOWUP_DAYS);

  try {
    const siblingMax = await prisma.reportUpdate.aggregate({
      where: { submissionId: reportId, parentId: null },
      _max: { order: true },
    });

    await prisma.reportUpdate.create({
      data: {
        submissionId: reportId,
        title: "Seguimiento anti-represalias",
        description: isAnonymous
          ? "El caso está cerrado. Publica un mensaje en el chat del caso (visible para el denunciante) preguntando si ha sufrido algún tipo de represalia desde el cierre."
          : "El caso está cerrado. Contacta directamente al denunciante para confirmar que no ha sufrido ningún tipo de represalia.",
        priority: "medium",
        status: "pending",
        dueDate,
        assignedTo: closerName,
        order: (siblingMax._max.order ?? 0) + 1,
        createdById: closerId,
        createdByName: closerName,
      },
    });
  } catch (e) {
    console.error("Error scheduling retaliation follow-up:", e);
  }
}

/**
 * Two-stage case closure. An org admin closing their own investigation
 * closes immediately (status -> CLOSED). Anyone else with edit access
 * submits a request that an admin must separately approve — report.status
 * doesn't change until then, so the reporter-facing tracking page stays
 * accurate ("En investigación") while the request is pending review.
 */
export async function requestReportClosure(
  reportId: number,
  data: { summary: string; outcome: ClosureOutcome }
): Promise<{ finalized: boolean }> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("No autorizado");

  if (!CLOSURE_OUTCOMES.includes(data.outcome)) {
    throw new Error("Resultado de cierre no válido");
  }
  const summary = data.summary?.trim();
  if (!summary || summary.length < 10) {
    throw new Error(
      "Describe brevemente lo que se hizo en el caso (mínimo 10 caracteres)"
    );
  }

  // orgId comes from the report itself — see updateReportStatus above.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: {
      orgId: true,
      status: true,
      closureRequestedAt: true,
      closureApprovedAt: true,
      isAnonymous: true,
    },
  });
  if (!report) throw new Error("Reporte no encontrado o sin acceso");
  const orgId = report.orgId;
  if (report.status === "CLOSED") throw new Error("El caso ya está cerrado");
  if (report.closureRequestedAt && !report.closureApprovedAt) {
    throw new Error("Ya hay una solicitud de cierre pendiente de aprobación");
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );
  const requesterName = user.fullName || "Usuario";
  const now = new Date();
  const reportCode = `REP-${String(reportId).padStart(6, "0")}`;

  if (isAdmin) {
    const retentionExpiresAt = await computeRetentionExpiresAt(orgId, now);

    await prisma.formSubmission.update({
      where: { id: reportId },
      data: {
        status: "CLOSED",
        processedAt: now,
        closureSummary: summary,
        closureOutcome: data.outcome,
        closureRequestedAt: now,
        closureRequestedById: userId,
        closureRequestedByName: requesterName,
        closureApprovedAt: now,
        closureApprovedById: userId,
        closureApprovedByName: requesterName,
        closureRejectionReason: null,
        retentionExpiresAt,
      },
    });

    await prisma.reportActivity.createMany({
      data: [
        {
          submissionId: reportId,
          action: "STATUS_CHANGED",
          details: { oldStatus: report.status, newStatus: "CLOSED" },
          userId,
          userName: requesterName,
        },
        {
          submissionId: reportId,
          action: "CLOSURE_APPROVED",
          details: { outcome: data.outcome, selfClosed: true },
          userId,
          userName: requesterName,
        },
      ],
    });

    await scheduleRetaliationFollowUp({
      reportId,
      isAnonymous: report.isAnonymous,
      closerId: userId,
      closerName: requesterName,
    });

    revalidatePath(`/app/reports/${reportId}`);
    revalidatePath("/app/reports");
    return { finalized: true };
  }

  await prisma.formSubmission.update({
    where: { id: reportId },
    data: {
      closureSummary: summary,
      closureOutcome: data.outcome,
      closureRequestedAt: now,
      closureRequestedById: userId,
      closureRequestedByName: requesterName,
      closureApprovedAt: null,
      closureApprovedById: null,
      closureApprovedByName: null,
      closureRejectionReason: null,
    },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: "CLOSURE_REQUESTED",
      details: { outcome: data.outcome },
      userId,
      userName: requesterName,
    },
  });

  // Notify org admins that a closure request awaits their review.
  try {
    const admins = await prisma.organizationMembership.findMany({
      where: { orgId, role: "ADMIN" },
      select: { userId: true },
    });
    for (const admin of admins) {
      await notificationsService.createNotification({
        userId: admin.userId,
        orgId,
        type: "SYSTEM_ALERT" as any,
        title: "Solicitud de cierre pendiente",
        message: `${requesterName} solicitó cerrar el caso ${reportCode} — requiere tu aprobación`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: "BOTH" as any,
        metadata: { kind: "closure_requested", outcome: data.outcome },
      });
    }
  } catch (e) {
    console.error("Error notifying admins of closure request:", e);
  }

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
  return { finalized: false };
}

export async function approveReportClosure(reportId: number): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("No autorizado");

  // orgId comes from the report itself — see updateReportStatus above.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: {
      orgId: true,
      status: true,
      closureRequestedAt: true,
      closureApprovedAt: true,
      closureRequestedById: true,
      isAnonymous: true,
    },
  });
  if (!report) throw new Error("Reporte no encontrado o sin acceso");
  const orgId = report.orgId;

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );
  if (!isAdmin) {
    throw new Error("Solo un administrador puede aprobar el cierre del caso");
  }
  if (!report.closureRequestedAt || report.closureApprovedAt) {
    throw new Error("No hay una solicitud de cierre pendiente");
  }
  // A pending request only exists when the original requester wasn't an
  // admin (requestReportClosure closes admin-submitted requests
  // immediately). If that person is promoted to admin before anyone else
  // reviews it, this stops them from approving their own prior request —
  // the two-stage workflow exists specifically so the person who did the
  // investigation isn't also the one certifying it was done correctly.
  if (report.closureRequestedById === userId) {
    throw new Error(
      "Quien solicitó el cierre no puede aprobarlo — se requiere otro administrador"
    );
  }

  const approverName = user.fullName || "Usuario";
  const now = new Date();
  const retentionExpiresAt = await computeRetentionExpiresAt(orgId, now);

  await prisma.formSubmission.update({
    where: { id: reportId },
    data: {
      status: "CLOSED",
      processedAt: now,
      closureApprovedAt: now,
      closureApprovedById: userId,
      closureApprovedByName: approverName,
      closureRejectionReason: null,
      retentionExpiresAt,
    },
  });

  await prisma.reportActivity.createMany({
    data: [
      {
        submissionId: reportId,
        action: "STATUS_CHANGED",
        details: { oldStatus: report.status, newStatus: "CLOSED" },
        userId,
        userName: approverName,
      },
      {
        submissionId: reportId,
        action: "CLOSURE_APPROVED",
        details: {},
        userId,
        userName: approverName,
      },
    ],
  });

  await scheduleRetaliationFollowUp({
    reportId,
    isAnonymous: report.isAnonymous,
    closerId: userId,
    closerName: approverName,
  });

  try {
    if (
      report.closureRequestedById &&
      report.closureRequestedById !== userId
    ) {
      await notificationsService.createNotification({
        userId: report.closureRequestedById,
        orgId,
        type: "SYSTEM_ALERT" as any,
        title: "Cierre de caso aprobado",
        message: `${approverName} aprobó el cierre del caso REP-${String(reportId).padStart(6, "0")}`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: "IN_APP" as any,
        metadata: { kind: "closure_approved" },
      });
    }
  } catch (e) {
    console.error("Error notifying requester of closure approval:", e);
  }

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

export async function rejectReportClosure(
  reportId: number,
  reason?: string
): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("No autorizado");

  // orgId comes from the report itself — see updateReportStatus above.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: {
      orgId: true,
      closureRequestedAt: true,
      closureApprovedAt: true,
      closureRequestedById: true,
    },
  });
  if (!report) throw new Error("Reporte no encontrado o sin acceso");
  const orgId = report.orgId;

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );
  if (!isAdmin) {
    throw new Error(
      "Solo un administrador puede rechazar una solicitud de cierre"
    );
  }
  if (!report.closureRequestedAt || report.closureApprovedAt) {
    throw new Error("No hay una solicitud de cierre pendiente");
  }

  const reviewerName = user.fullName || "Usuario";
  const cleanReason = reason?.trim() || null;

  await prisma.formSubmission.update({
    where: { id: reportId },
    data: {
      closureRequestedAt: null,
      closureRequestedById: null,
      closureRequestedByName: null,
      closureRejectionReason: cleanReason,
    },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: "CLOSURE_REJECTED",
      details: { reason: cleanReason },
      userId,
      userName: reviewerName,
    },
  });

  try {
    if (report.closureRequestedById && report.closureRequestedById !== userId) {
      const reportCode = `REP-${String(reportId).padStart(6, "0")}`;
      await notificationsService.createNotification({
        userId: report.closureRequestedById,
        orgId,
        type: "SYSTEM_ALERT" as any,
        title: "Solicitud de cierre rechazada",
        message: cleanReason
          ? `${reviewerName} rechazó el cierre del caso ${reportCode}: ${cleanReason}`
          : `${reviewerName} rechazó el cierre del caso ${reportCode}`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: "BOTH" as any,
        metadata: { kind: "closure_rejected", reason: cleanReason },
      });
    }
  } catch (e) {
    console.error("Error notifying requester of closure rejection:", e);
  }

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

export async function reopenReportCase(reportId: number): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("No autorizado");

  // orgId comes from the report itself — see updateReportStatus above.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true, status: true },
  });
  if (!report) throw new Error("Reporte no encontrado o sin acceso");
  const orgId = report.orgId;

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );
  if (!isAdmin) {
    throw new Error("Solo un administrador puede reabrir un caso cerrado");
  }

  await prisma.formSubmission.update({
    where: { id: reportId },
    data: {
      status: "IN_PROGRESS",
      processedAt: null,
      closureRequestedAt: null,
      closureRequestedById: null,
      closureRequestedByName: null,
      closureApprovedAt: null,
      closureApprovedById: null,
      closureApprovedByName: null,
      closureRejectionReason: null,
      retentionExpiresAt: null,
    },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: "STATUS_CHANGED",
      details: { oldStatus: report.status, newStatus: "IN_PROGRESS" },
      userId,
      userName: user.fullName || "Usuario",
    },
  });

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

/**
 * Legal hold unconditionally blocks the retention cron from ever deleting
 * this case, regardless of retentionExpiresAt — for cases under litigation,
 * regulatory inquiry, or any reason legal counsel needs the record kept.
 * Admin-only: this overrides an automated compliance policy, not a
 * day-to-day case-management action.
 */
export async function setLegalHold(
  reportId: number,
  hold: boolean,
  reason?: string
): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("No autorizado");

  // orgId comes from the report itself — see updateReportStatus above.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true, legalHold: true },
  });
  if (!report) throw new Error("Reporte no encontrado o sin acceso");
  const orgId = report.orgId;

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );
  if (!isAdmin) {
    throw new Error("Solo un administrador puede activar o quitar el legal hold");
  }

  const actorName = user.fullName || "Usuario";
  const cleanReason = reason?.trim() || null;

  if (hold && !cleanReason) {
    throw new Error("Indica el motivo del legal hold");
  }

  await prisma.formSubmission.update({
    where: { id: reportId },
    data: hold
      ? {
          legalHold: true,
          legalHoldReason: cleanReason,
          legalHoldSetAt: new Date(),
          legalHoldSetById: userId,
          legalHoldSetByName: actorName,
        }
      : {
          legalHold: false,
          legalHoldReason: null,
          legalHoldSetAt: null,
          legalHoldSetById: null,
          legalHoldSetByName: null,
        },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: hold ? "LEGAL_HOLD_ENABLED" : "LEGAL_HOLD_DISABLED",
      details: { reason: cleanReason },
      userId,
      userName: actorName,
    },
  });

  revalidatePath(`/app/reports/${reportId}`);
}

/**
 * Restricts (or unrestricts) a case to assigned investigators + admins/
 * viewers only. Admin-only: it's the mechanism a case gets *hidden* from
 * the rest of the org, so only an admin should be able to flip it — and
 * an admin should assign the right investigators before or right after
 * restricting it, since an unassigned confidential case is invisible to
 * every non-admin/non-viewer member, including the admin's own team who
 * might otherwise have picked it up.
 */
export async function setReportConfidential(
  reportId: number,
  isConfidential: boolean
): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("No autorizado");

  // orgId comes from the report itself — see updateReportStatus above.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true, isConfidential: true },
  });
  if (!report) throw new Error("Reporte no encontrado o sin acceso");
  const orgId = report.orgId;

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );
  if (!isAdmin) {
    throw new Error(
      "Solo un administrador puede marcar un caso como confidencial"
    );
  }

  const actorName = user.fullName || "Usuario";

  await prisma.formSubmission.update({
    where: { id: reportId },
    data: isConfidential
      ? {
          isConfidential: true,
          confidentialSetById: userId,
          confidentialSetByName: actorName,
        }
      : {
          isConfidential: false,
          confidentialSetById: null,
          confidentialSetByName: null,
        },
  });

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: isConfidential ? "MARKED_CONFIDENTIAL" : "UNMARKED_CONFIDENTIAL",
      details: {},
      userId,
      userName: actorName,
    },
  });

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

/**
 * Right to erasure / "derecho al olvido": scrubs the identified reporter's
 * name, email, and phone from the case (and from any reporter-authored
 * chat messages, whose authorName/authorEmail were captured verbatim at
 * send time) on a data-subject erasure request. The substantive
 * investigation record — the report content, findings, chat message text
 * itself — is deliberately left intact: most data-protection regimes
 * (GDPR Art. 17(3) and LATAM habeas-data equivalents) exempt compliance
 * investigation records from full erasure while still requiring identity
 * to be removable on request. Irreversible and admin-only; blocked while
 * legalHold is active since a litigation hold requires identity to stay
 * unmodified.
 */
export async function anonymizeReporterData(
  reportId: number,
  reason?: string
): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("No autorizado");

  // orgId comes from the report itself — see updateReportStatus above.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: {
      orgId: true,
      isAnonymous: true,
      legalHold: true,
      reporterName: true,
      reporterEmail: true,
      reporterPhone: true,
      reporterDataAnonymized: true,
    },
  });
  if (!report) throw new Error("Reporte no encontrado o sin acceso");
  const orgId = report.orgId;

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );
  if (!isAdmin) {
    throw new Error(
      "Solo un administrador puede anonimizar los datos del denunciante"
    );
  }

  if (report.legalHold) {
    throw new Error(
      "No se puede anonimizar mientras el caso está en legal hold — quita el legal hold primero"
    );
  }

  if (report.reporterDataAnonymized) {
    throw new Error("Los datos del denunciante ya fueron anonimizados");
  }

  if (
    report.isAnonymous &&
    !report.reporterName &&
    !report.reporterEmail &&
    !report.reporterPhone
  ) {
    throw new Error("Este caso ya es anónimo — no hay datos que anonimizar");
  }

  const actorName = user.fullName || "Usuario";
  const cleanReason = reason?.trim() || null;

  await prisma.$transaction(async (tx) => {
    await tx.formSubmission.update({
      where: { id: reportId },
      data: {
        reporterName: null,
        reporterEmail: null,
        reporterPhone: null,
        isAnonymous: true,
        reporterDataAnonymized: true,
        reporterDataAnonymizedAt: new Date(),
        reporterDataAnonymizedById: userId,
        reporterDataAnonymizedByName: actorName,
      },
    });

    await tx.reportComment.updateMany({
      where: { submissionId: reportId, authorId: "reporter" },
      data: { authorName: "Denunciante", authorEmail: null },
    });

    await tx.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "REPORTER_DATA_ANONYMIZED",
        details: { reason: cleanReason },
        userId,
        userName: actorName,
      },
    });
  });

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

export async function deleteReport(reportId: number): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // orgId comes from the report itself — see updateReportStatus above.
  const existingReport = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { id: true, orgId: true },
  });

  if (!existingReport) {
    throw new Error("Reporte no encontrado");
  }
  const orgId = existingReport.orgId;

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
  const user = await currentUser();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // orgId comes from the report itself — see updateReportStatus above.
  const existingReport = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true },
  });
  if (!existingReport) {
    throw new Error("Organization not found");
  }
  await assertRoleCanWrite(userId, existingReport.orgId);

  await prisma.formSubmission.update({
    where: { id: reportId },
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
  action: "priority" | "status" | "archive",
  value?: string
): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!reportIds.length) return;

  // A superadmin's bulk selection in the global cross-org view can span
  // multiple orgs — restricting the update to a single resolveOrgId() org
  // (or requiring one at all) would silently update only the subset that
  // happened to match, dropping the rest with no error. Verify per-org
  // write access for every org actually represented in the selection
  // instead of assuming one.
  const targetReports = await prisma.formSubmission.findMany({
    where: { id: { in: reportIds } },
    select: { id: true, orgId: true },
  });
  const orgIds = [...new Set(targetReports.map((r) => r.orgId))];
  for (const orgId of orgIds) {
    await assertRoleCanWrite(userId, orgId);
  }

  const updateData: Prisma.FormSubmissionUpdateManyArgs["data"] = {};

  switch (action) {
    case "priority":
      if (!value) throw new Error("Se requiere un valor de prioridad");
      updateData.priority = value.toUpperCase() as any;
      break;
    case "status":
      if (!value) throw new Error("Se requiere un valor de estado");
      updateData.status = value.toUpperCase() as any;
      break;
    case "archive":
      updateData.status = "ARCHIVED";
      break;
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.formSubmission.updateMany({
    where: { id: { in: reportIds } },
    data: updateData,
  });

  const userName = user?.fullName || "Usuario";
  const activities = reportIds.map((reportId) => ({
    submissionId: reportId,
    action: `BULK_${action.toUpperCase()}`,
    details: { value, updatedBy: userId },
    userId,
    userName,
  }));

  await prisma.reportActivity.createMany({ data: activities });

  revalidatePath("/app/reports");
}

// ============================
// REPORT DETAILS METHODS
// ============================

export async function getReport(reportId: number): Promise<FormSubmission> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Mirror resolveReportsScope()'s global-scope check (used by the reports
  // list) — a superadmin viewing "Todas las organizaciones" sees reports
  // across every org with no orgId filter, but this detail lookup used to
  // always scope to resolveOrgId()'s single cookie-selected org. Clicking
  // into any report belonging to a *different* org than whatever org
  // happened to be last selected threw "Report not found" even though the
  // report was right there in the list the admin clicked it from.
  const { orgId, isGlobalScope } = await resolveReportsScope();

  if (!isGlobalScope && !orgId) {
    throw new Error("Unauthorized");
  }

  const report = await prisma.formSubmission.findFirst({
    where: isGlobalScope ? { id: reportId } : { id: reportId, orgId: orgId as string },
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

  if (report.isConfidential) {
    const isAssigned = report.assignments.some((a) => a.userId === userId);
    if (!isAssigned) {
      const user = await currentUser();
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      // canViewAllReports is true for ADMIN, VIEWER (oversight), and
      // SUPER_ADMIN alike — false for a MEMBER who isn't assigned, which
      // is exactly who a confidential case needs to be hidden from.
      // Use the report's own org, not the resolver's org — in global scope
      // they can legitimately differ, and the permission check must run
      // against the org the report actually belongs to.
      const canBypass = await userHasPermission(
        userId,
        report.orgId,
        "canViewAllReports",
        userEmail
      );
      if (!canBypass) {
        throw new Error(
          "Este caso es confidencial — solo los investigadores asignados y administradores pueden verlo"
        );
      }
    }
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
    closureOutcome: report.closureOutcome as FormSubmission["closureOutcome"],
    closureRequestedAt: report.closureRequestedAt?.toISOString() || null,
    closureApprovedAt: report.closureApprovedAt?.toISOString() || null,
    retentionExpiresAt: report.retentionExpiresAt?.toISOString() || null,
    legalHoldSetAt: report.legalHoldSetAt?.toISOString() || null,
    reporterDataAnonymizedAt:
      report.reporterDataAnonymizedAt?.toISOString() || null,
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

export async function updateReportPriority(
  reportId: number,
  newPriority: string
) {
  const { userId: authUserId } = await auth();
  const user = await currentUser();

  if (!authUserId) {
    throw new Error("Unauthorized");
  }

  // orgId comes from the report itself — see updateReportStatus above.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }
  await assertRoleCanWrite(authUserId, report.orgId);

  const actualUserId = authUserId;
  const actualUserName = user?.fullName || "Usuario";

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

export async function updateReportMetadata(
  reportId: number,
  data: {
    type?: string | null;
    departmentId?: string | null;
    subject?: string | null;
  }
): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) throw new Error("Unauthorized");

  // orgId comes from the report itself — see updateReportStatus above.
  const existingReport = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true },
  });
  if (!existingReport) throw new Error("Report not found");
  await assertRoleCanWrite(userId, existingReport.orgId);

  await prisma.formSubmission.update({
    where: { id: reportId },
    data: {
      type: data.type ?? undefined,
      departmentId: data.departmentId ?? undefined,
      internalNotes: undefined,
      updatedAt: new Date(),
    },
  });

  // departmentId is a per-org UUID with no static label map (unlike `type`,
  // whose fixed slug set the timeline can resolve on the client) — resolve
  // its name here so the timeline shows "Control Interno" instead of the
  // raw id.
  let departmentName: string | undefined;
  if (data.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { name: true },
    });
    departmentName = department?.name;
  }

  await prisma.reportActivity.create({
    data: {
      submissionId: reportId,
      action: "METADATA_UPDATED",
      details: { ...data, ...(departmentName ? { departmentName } : {}) },
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
  const user = await currentUser();

  if (!userId) throw new Error("Unauthorized");

  // orgId comes from the report itself — see updateReportStatus above.
  // Confirmed live: this exact function silently failed (Prisma's update
  // where-clause matched nothing) whenever the caller's resolveOrgId()
  // org didn't match the report's real org, with no visible error.
  const existingReport = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true },
  });
  if (!existingReport) throw new Error("Report not found");
  await assertRoleCanWrite(userId, existingReport.orgId);

  await prisma.formSubmission.update({
    where: { id: reportId },
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

export async function getReportAttachments(
  reportId: number
): Promise<ReportAttachment[]> {
  // Resolves org from the report itself and enforces confidentiality —
  // the old resolveOrgId()-based check silently returned an empty list
  // (Prisma's relational filter just matches nothing) for any report
  // outside the caller's cookie-selected org, instead of erroring.
  await assertUserCanAccessReport(reportId);

  const attachments = await prisma.reportAttachment.findMany({
    where: { submissionId: reportId },
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
  file: File
): Promise<ReportAttachment> {
  const { userId: authUserId } = await auth();

  if (!authUserId) {
    throw new Error("Unauthorized");
  }

  // orgId comes from the report itself, and this also enforces the
  // VIEWER-can't-write restriction — see updateReportStatus above.
  const { orgId } = await assertUserCanWriteToReport(reportId);

  // uploadedById/uploadedByName used to be caller-supplied parameters that
  // both real call sites always omitted — the only effect was that a
  // Server Action call crafted outside the normal UI could name any
  // uploader it liked, forging who added a piece of evidence. This app
  // handles chain-of-custody-sensitive material, so attribution always
  // comes from the authenticated session now, never the caller.
  const uploaderUser = await currentUser();
  const actualUploadedById = authUserId;
  const actualUploadedByName =
    [uploaderUser?.firstName, uploaderUser?.lastName]
      .filter(Boolean)
      .join(" ") ||
    uploaderUser?.primaryEmailAddress?.emailAddress ||
    "Usuario desconocido";

  // Reject oversized files before reading them into memory — Cloudinary's
  // own max_file_size only rejects after this server has already buffered
  // and base64-encoded the whole file.
  const MAX_REPORT_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_REPORT_ATTACHMENT_SIZE_BYTES) {
    throw new Error("El archivo excede el tamaño máximo permitido (50MB)");
  }

  // Upload to Cloudinary
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Cloudinary's allowed_formats below checks extension/format, not file
  // content — bring this in line with scanUploadedFile(), the same
  // magic-byte + executable-signature check every other upload path in
  // this app (public submission evidence, chat attachments) already uses.
  const { scanUploadedFile } = await import(
    "@/lib/security/submission-security"
  );
  const scanResult = await scanUploadedFile(buffer, file.name, file.type);
  if (!scanResult.safe) {
    throw new Error(
      scanResult.reason || "El archivo no pasó la validación de seguridad"
    );
  }

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
  // orgId comes from the report itself — see updateReportStatus above.
  await assertUserCanAccessReport(reportId);

  const activities = await prisma.reportActivity.findMany({
    where: { submissionId: reportId },
    orderBy: { createdAt: "desc" },
  });

  // Convert Date objects to strings and handle JsonValue types
  return activities.map((activity) => ({
    ...activity,
    createdAt: activity.createdAt.toISOString(),
    details: activity.details as Record<string, any> | undefined,
  }));
}

export async function addReportNote(reportId: number, note: string) {
  const { userId: authUserId } = await auth();
  const user = await currentUser();

  if (!authUserId) {
    throw new Error("Unauthorized");
  }

  const actualUserId = authUserId;
  const actualUserName = user?.fullName || "Usuario";

  // orgId comes from the report itself, and this also enforces the
  // VIEWER-can't-write restriction — see updateReportStatus above.
  await assertUserCanWriteToReport(reportId);

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
  // orgId comes from the report itself — see updateReportStatus above.
  await assertUserCanAccessReport(reportId);

  try {
    const updates = await prisma.reportUpdate.findMany({
      where: { submissionId: reportId },
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
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  try {
    // orgId comes from the report itself, and this also enforces the
    // VIEWER-can't-write restriction — see updateReportStatus above.
    const report = await assertUserCanWriteToReport(reportId);

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
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify update exists — org comes from its own submission, not the
    // caller's cookie-selected org — see updateReportStatus above.
    const existingUpdate = await prisma.reportUpdate.findFirst({
      where: { id: updateId },
      include: { submission: true },
    });

    if (!existingUpdate) {
      throw new Error("Update not found or access denied");
    }
    await assertUserCanWriteToReport(existingUpdate.submissionId);

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
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify update exists — org comes from its own submission, not the
    // caller's cookie-selected org — see updateReportStatus above.
    const existingUpdate = await prisma.reportUpdate.findFirst({
      where: { id: updateId },
      include: { submission: true },
    });

    if (!existingUpdate) {
      throw new Error("Update not found or access denied");
    }
    await assertUserCanWriteToReport(existingUpdate.submissionId);

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
  const user = await (await import("@clerk/nextjs/server")).currentUser();

  if (!userId || !user) {
    throw new Error("No autorizado");
  }

  try {
    // orgId comes from the report itself, and this also enforces the
    // VIEWER-can't-write restriction — see updateReportStatus above.
    await assertUserCanWriteToReport(reportId);

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
  const { orgId, isGlobalScope } = await resolveReportsScope();

  if (!authUserId) {
    redirect("/sign-in");
  }

  if (!isGlobalScope && !orgId) {
    throw new Error("Organization not found");
  }

  const whereClause: Prisma.FormSubmissionWhereInput = {
    ...(isGlobalScope ? {} : { orgId: orgId as string }),
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
  const { orgId, isGlobalScope } = await resolveReportsScope();

  if (!authUserId) {
    redirect("/sign-in");
  }

  if (!isGlobalScope && !orgId) {
    throw new Error("Organization not found");
  }

  const whereClause: Prisma.FormSubmissionWhereInput = {
    ...(isGlobalScope ? {} : { orgId: orgId as string }),
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

/**
 * Notifica al miembro asignado a una tarea. `assignedTo` guarda el nombre
 * legible, así que se resuelve el userId buscando la membresía cuyo nombre
 * completo coincide.
 */
async function notifyTaskAssignment(params: {
  reportId: number;
  orgId: string;
  assignedToName: string;
  assignedById: string;
  taskTitle: string;
}) {
  const { reportId, orgId, assignedToName, assignedById, taskTitle } = params;
  try {
    const memberships = await prisma.organizationMembership.findMany({
      where: { orgId },
      include: { user: true },
    });
    const normalized = assignedToName.trim().toLowerCase();
    const target = memberships.find((m) => {
      const fullName = `${m.user?.firstName || ""} ${m.user?.lastName || ""}`
        .trim()
        .toLowerCase();
      return fullName && fullName === normalized;
    });
    if (!target?.userId || target.userId === assignedById) return;

    await notificationsService.createNotification({
      userId: target.userId,
      orgId,
      type: "REPORT_ASSIGNED",
      title: "Nueva tarea asignada",
      message: `Se te asignó la tarea "${taskTitle}" en el reporte REP-${String(reportId).padStart(6, "0")}`,
      actionUrl: `/app/reports/${reportId}?tab=tasks`,
      reportId,
      channel: "BOTH",
      metadata: {
        reportTitle: `REP-${String(reportId).padStart(6, "0")}`,
        taskTitle,
      },
    });
  } catch (e) {
    console.error("No se pudo notificar la asignación de tarea:", e);
  }
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
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("No autorizado");
  }

  // orgId comes from the report itself, and this also enforces the
  // VIEWER-can't-write restriction — see updateReportStatus above.
  const report = await assertUserCanWriteToReport(reportId);
  const orgId = report.orgId;

  if (report.status === "CLOSED" || report.status === "RESOLVED") {
    throw new Error("No se pueden agregar tareas a un caso cerrado");
  }

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

  if (data.assignedTo) {
    await notifyTaskAssignment({
      reportId,
      orgId,
      assignedToName: data.assignedTo,
      assignedById: userId,
      taskTitle: data.title,
    });
  }

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
    completionNotes: string | null;
  }>
) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("Unauthorized");

  // Org comes from the task's own submission — see updateReportStatus above.
  const existing = await prisma.reportUpdate.findFirst({
    where: { id: taskId },
  });
  if (!existing) throw new Error("Task not found or access denied");
  const { orgId } = await assertUserCanWriteToReport(existing.submissionId);

  const isCompleting = data.status === "completed" && existing.status !== "completed";

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
      completionNotes:
        data.completionNotes === undefined ? undefined : data.completionNotes,
      completedAt: isCompleting ? new Date() : undefined,
    },
  });

  const activityTitle = isCompleting ? "Tarea completada" : "Tarea actualizada";
  const activityDesc = isCompleting
    ? `La tarea "${existing.title}" fue marcada como completada`
    : `La tarea #${taskId} fue actualizada`;

  await prisma.reportActivity.create({
    data: {
      submissionId: existing.submissionId,
      action: "CUSTOM_EVENT",
      details: {
        title: activityTitle,
        description: activityDesc,
        taskId,
        ...(isCompleting && data.completionNotes
          ? { completionNotes: data.completionNotes }
          : {}),
      },
      userId,
      userName: user.fullName || "Unknown User",
    },
  });

  const newAssignee = data.assignedTo;
  if (newAssignee && newAssignee !== existing.assignedTo) {
    await notifyTaskAssignment({
      reportId: existing.submissionId,
      orgId,
      assignedToName: newAssignee,
      assignedById: userId,
      taskTitle: data.title || existing.title,
    });
  }

  revalidatePath(`/app/reports/${existing.submissionId}`);
  return updated;
}

export async function deleteReportTask(taskId: number) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("Unauthorized");

  // Org comes from the task's own submission — see updateReportStatus above.
  const existing = await prisma.reportUpdate.findFirst({
    where: { id: taskId },
  });
  if (!existing) throw new Error("Task not found or access denied");
  await assertUserCanWriteToReport(existing.submissionId);

  // Delete children first to avoid FK constraint violations, then parent
  await prisma.$transaction(async (tx) => {
    await tx.reportUpdate.deleteMany({ where: { parentId: taskId } });
    await tx.reportUpdate.delete({ where: { id: taskId } });

    await tx.reportActivity.create({
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
  });

  revalidatePath(`/app/reports/${existing.submissionId}`);
}

export async function reorderReportTasks(
  reportId: number,
  parentId: number | null,
  orderedIds: number[]
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // orgId comes from the report itself, and this also enforces the
  // VIEWER-can't-write restriction — see updateReportStatus above.
  await assertUserCanWriteToReport(reportId);

  // Verify tasks belong to this report (org access already checked above)
  const tasks = await prisma.reportUpdate.findMany({
    where: {
      id: { in: orderedIds },
      submissionId: reportId,
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
