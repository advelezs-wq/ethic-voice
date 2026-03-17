"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { ReportsStats } from "@/types/reports";
import { subDays } from "date-fns";
import { Prisma } from "@prisma/client";

export async function getReportsStats(
  orgId?: string,
  userId?: string // For member filtering
): Promise<ReportsStats> {
  const { orgId: authOrgId } = await auth();
  const targetOrgId = orgId || authOrgId;

  if (!targetOrgId) {
    throw new Error("Organization not found");
  }

  try {
    const now = new Date();
    const lastPeriodStart = subDays(now, 30);
    const previousPeriodStart = subDays(now, 60);
    const last7Days = subDays(now, 7);
    const last14Days = subDays(now, 14);

    // Base where clause for all counts - exclude archived reports from main stats
  const baseWhere: Prisma.FormSubmissionWhereInput = {
      ...(orgId && { orgId }),
      status: {
        not: "ARCHIVED",
      },
    };

    // If userId is provided (member role), filter by assigned reports
    if (userId) {
      baseWhere.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    // Get all reports for the organization (or user if member)
    const [
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      highSeverityReports,
      highPriorityReports,
      anonymousReports,
      lastPeriodReports,
      previousPeriodReports,
      reportsLast7Days,
      assignedReports,
      activeInvestigatorsData,
    ] = await Promise.all([
      // Total reports
      prisma.formSubmission.count({ where: baseWhere }),

      // Pending reports
      prisma.formSubmission.count({
        where: { ...baseWhere, status: "PENDING" },
      }),

      // In progress reports
      prisma.formSubmission.count({
        where: { ...baseWhere, status: "IN_PROGRESS" },
      }),

      // Resolved reports
      prisma.formSubmission.count({
        where: { ...baseWhere, status: { in: ["RESOLVED", "CLOSED"] } },
      }),

      // High severity reports
      prisma.formSubmission.count({
        where: { ...baseWhere, aiSeverity: "HIGH" },
      }),

      // High priority reports
      prisma.formSubmission.count({
        where: { ...baseWhere, priority: { in: ["URGENT", "HIGH"] } },
      }),

      // Anonymous reports
      prisma.formSubmission.count({
        where: { ...baseWhere, isAnonymous: true },
      }),

      // Reports from last 30 days
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          submittedAt: { gte: lastPeriodStart },
        },
      }),

      // Reports from previous 30 days
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          submittedAt: {
            gte: previousPeriodStart,
            lt: lastPeriodStart,
          },
        },
      }),

      // New reports in last 7 days
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          submittedAt: { gte: last7Days },
        },
      }),

      // New reports in last 14 days
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          submittedAt: { gte: last14Days },
        },
      }),

      // Assigned reports (only relevant for admin/super admin view)
      userId
        ? 0
        : prisma.formSubmission.count({
            where: {
              orgId: targetOrgId,
              assignments: {
                some: {}, // Has at least one assignment
              },
            },
          }),

      // Active investigators - only for admin/super admin
      userId
        ? []
        : prisma.reportAssignment.findMany({
            where: {
              report: {
                orgId: targetOrgId,
                status: { in: ["IN_PROGRESS"] },
              },
            },
            select: {
              userId: true,
              userName: true,
            },
            distinct: ["userId"],
          }),
    ]);

    // Count unique active investigators
    const activeInvestigators = Array.isArray(activeInvestigatorsData)
      ? activeInvestigatorsData.length
      : 0;

    // Calculate average resolution time
    const resolvedReportsWithTime = await prisma.formSubmission.findMany({
      where: {
        ...baseWhere,
        status: { in: ["RESOLVED", "CLOSED"] },
        processedAt: { not: null },
      },
      select: {
        submittedAt: true,
        processedAt: true,
      },
    });

    const averageResolutionTime =
      resolvedReportsWithTime.length > 0
        ? resolvedReportsWithTime.reduce((acc, report) => {
            const days = Math.floor(
              (new Date(report.processedAt!).getTime() -
                new Date(report.submittedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return acc + days;
          }, 0) / resolvedReportsWithTime.length
        : 0;

    // Calculate changes with better logic
    const totalReportsChange =
      previousPeriodReports > 0
        ? (
            ((lastPeriodReports - previousPeriodReports) /
              previousPeriodReports) *
            100
          ).toFixed(0)
        : lastPeriodReports > 0
          ? "100"
          : "0";

    // Calculate pending reports change
    const [lastPeriodPending, previousPeriodPending] = await Promise.all([
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          status: "PENDING",
          submittedAt: { gte: lastPeriodStart },
        },
      }),
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          status: "PENDING",
          submittedAt: {
            gte: previousPeriodStart,
            lt: lastPeriodStart,
          },
        },
      }),
    ]);

    const pendingReportsChange =
      previousPeriodPending > 0
        ? (
            ((lastPeriodPending - previousPeriodPending) /
              previousPeriodPending) *
            100
          ).toFixed(0)
        : lastPeriodPending > 0
          ? "100"
          : "0";

    // Calculate resolved reports change
    const [lastPeriodResolved, previousPeriodResolved] = await Promise.all([
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          status: { in: ["RESOLVED", "CLOSED"] },
          submittedAt: { gte: lastPeriodStart },
        },
      }),
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          status: { in: ["RESOLVED", "CLOSED"] },
          submittedAt: {
            gte: previousPeriodStart,
            lt: lastPeriodStart,
          },
        },
      }),
    ]);

    const resolvedReportsChange =
      previousPeriodResolved > 0
        ? (
            ((lastPeriodResolved - previousPeriodResolved) /
              previousPeriodResolved) *
            100
          ).toFixed(0)
        : lastPeriodResolved > 0
          ? "100"
          : "0";

    // Calculate high priority reports change
    const [lastPeriodHighPriority, previousPeriodHighPriority] =
      await Promise.all([
        prisma.formSubmission.count({
          where: {
            ...baseWhere,
            priority: { in: ["URGENT", "HIGH"] },
            submittedAt: { gte: lastPeriodStart },
          },
        }),
        prisma.formSubmission.count({
          where: {
            ...baseWhere,
            priority: { in: ["URGENT", "HIGH"] },
            submittedAt: {
              gte: previousPeriodStart,
              lt: lastPeriodStart,
            },
          },
        }),
      ]);

    const highPriorityReportsChange =
      previousPeriodHighPriority > 0
        ? (
            ((lastPeriodHighPriority - previousPeriodHighPriority) /
              previousPeriodHighPriority) *
            100
          ).toFixed(0)
        : lastPeriodHighPriority > 0
          ? "100"
          : "0";

    // Additional stats for enhanced view
    const [
      mediumSeverityReports,
      lowSeverityReports,
      closedReports,
      ethicLineReports,
      customFormReports,
      reportsLast14Days,
      overdueReports,
    ] = await Promise.all([
      prisma.formSubmission.count({
        where: { ...baseWhere, aiSeverity: "MEDIUM" },
      }),
      prisma.formSubmission.count({
        where: { ...baseWhere, aiSeverity: "LOW" },
      }),
      prisma.formSubmission.count({
        where: { ...baseWhere, status: "CLOSED" },
      }),
      prisma.formSubmission.count({
        where: { ...baseWhere, source: "ETHIC_LINE" },
      }),
      prisma.formSubmission.count({
        where: { ...baseWhere, source: "CUSTOM_FORM" },
      }),
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          submittedAt: { gte: subDays(now, 14) },
        },
      }),
      // Overdue reports (pending reports older than their severity deadline)
      prisma.formSubmission.count({
        where: {
          ...baseWhere,
          status: "PENDING",
          OR: [
            {
              aiSeverity: "HIGH",
              submittedAt: { lt: subDays(now, 3) },
            },
            {
              aiSeverity: "MEDIUM",
              submittedAt: { lt: subDays(now, 5) },
            },
            {
              aiSeverity: "LOW",
              submittedAt: { lt: subDays(now, 8) },
            },
          ],
        },
      }),
    ]);

    const assignmentRate =
      totalReports > 0 ? (assignedReports / totalReports) * 100 : 0;

    // Calculate new reports change more accurately
    const reportsLast7To14Days = reportsLast14Days - reportsLast7Days;
    const newReportsLast7DaysChange =
      reportsLast7To14Days > 0
        ? (
            ((reportsLast7Days - reportsLast7To14Days) / reportsLast7To14Days) *
            100
          ).toFixed(0)
        : reportsLast7Days > 0
          ? "100"
          : "0";

    // Format changes with + or - prefix
    const formatChange = (change: string): string => {
      const num = parseInt(change);
      if (num > 0) return `+${change}%`;
      if (num < 0) return `${change}%`;
      return "Sin cambios";
    };

    return {
      // Required stats from interface
      totalReports,
      pendingReports,
      resolvedReports,
      highPriorityReports,
      activeInvestigators,
      averageResolutionTime,
      totalReportsChange: formatChange(totalReportsChange),
      pendingReportsChange: formatChange(pendingReportsChange),
      resolvedReportsChange: formatChange(resolvedReportsChange),
      highPriorityReportsChange: formatChange(highPriorityReportsChange),

      // Additional stats for enhanced view
      inProgressReports,
      closedReports,
      highSeverityReports,
      mediumSeverityReports,
      lowSeverityReports,
      anonymousReports,
      ethicLineReports,
      customFormReports,
      assignmentRate,
      overdueReports,
      newReportsLast7Days: reportsLast7Days,
      newReportsLast7DaysChange: formatChange(newReportsLast7DaysChange),
    } as ReportsStats & {
      inProgressReports: number;
      closedReports: number;
      highSeverityReports: number;
      mediumSeverityReports: number;
      lowSeverityReports: number;
      anonymousReports: number;
      ethicLineReports: number;
      customFormReports: number;
      assignmentRate: number;
      overdueReports: number;
      newReportsLast7Days: number;
      newReportsLast7DaysChange: string;
    };
  } catch (error) {
    console.error("Error fetching reports stats:", error);
    throw error;
  }
}
