"use server";

import prisma from "@/modules/prisma/lib/prisma";
import { subDays, format } from "date-fns";
import { es } from "date-fns/locale";
import type { DashboardStats } from "@/types/dashboard.types";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export async function getDashboardStats(
  orgId: string,
  userId?: string,
  departmentId?: string
): Promise<DashboardStats> {
  const { userId: authUserId } = await auth();

  if (!authUserId) {
    redirect("/sign-in");
  }

  // Base filters for all queries - exclude archived reports
  const baseWhere: Prisma.FormSubmissionWhereInput = {
    orgId,
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

  // If departmentId is provided, filter by department
  if (departmentId) {
    baseWhere.departmentId = departmentId;
  }

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [
    totalReports,
    newReports,
    inProgress,
    closedReports,
    anonymousReports,
    criticalReports,
    currentPeriodReports,
    previousPeriodReports,
    resolvedReportsWithTime,
  ] = await Promise.all([
    // Total reports
    prisma.formSubmission.count({ where: baseWhere }),

    // New reports (pending)
    prisma.formSubmission.count({
      where: { ...baseWhere, status: "PENDING" },
    }),

    // In progress reports
    prisma.formSubmission.count({
      where: { ...baseWhere, status: "IN_PROGRESS" },
    }),

    // Closed reports
    prisma.formSubmission.count({
      where: { ...baseWhere, status: { in: ["RESOLVED", "CLOSED"] } },
    }),

    // Anonymous reports
    prisma.formSubmission.count({
      where: { ...baseWhere, isAnonymous: true },
    }),

    // Critical reports (high severity + urgent/high priority)
    prisma.formSubmission.count({
      where: {
        ...baseWhere,
        OR: [{ aiSeverity: "HIGH" }, { priority: { in: ["URGENT", "HIGH"] } }],
      },
    }),

    // Current period (last 30 days)
    prisma.formSubmission.count({
      where: {
        ...baseWhere,
        submittedAt: { gte: thirtyDaysAgo },
      },
    }),

    // Previous period (30-60 days ago)
    prisma.formSubmission.count({
      where: {
        ...baseWhere,
        submittedAt: {
          gte: subDays(now, 60),
          lt: thirtyDaysAgo,
        },
      },
    }),

    // Resolved reports with time calculation
    prisma.formSubmission.findMany({
      where: {
        ...baseWhere,
        status: { in: ["RESOLVED", "CLOSED"] },
        processedAt: { not: null },
      },
      select: {
        submittedAt: true,
        processedAt: true,
      },
    }),
  ]);

  // Calculate average resolution time
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

  // Calculate percentage change
  const percentageChange =
    previousPeriodReports > 0
      ? ((currentPeriodReports - previousPeriodReports) /
          previousPeriodReports) *
        100
      : currentPeriodReports > 0
        ? 100
        : 0;

  return {
    totalReports,
    newReports,
    inProgress,
    closedReports,
    anonymousReports,
    criticalReports,
    averageResolutionTime,
    percentageChange,
  };
}

export async function getSeverityDistribution(
  orgId: string,
  userId?: string
): Promise<{ high: number; medium: number; low: number; unknown: number }> {
  try {
    const baseWhere: Prisma.FormSubmissionWhereInput = { orgId };

    // If userId is provided (member role), filter by reports assigned to them
    if (userId) {
      baseWhere.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const [high, medium, low, unknown] = await Promise.all([
      prisma.formSubmission.count({
        where: { ...baseWhere, aiSeverity: "HIGH" },
      }),
      prisma.formSubmission.count({
        where: { ...baseWhere, aiSeverity: "MEDIUM" },
      }),
      prisma.formSubmission.count({
        where: { ...baseWhere, aiSeverity: "LOW" },
      }),
      prisma.formSubmission.count({
        where: { ...baseWhere, aiSeverity: "UNKNOWN" },
      }),
    ]);

    return { high, medium, low, unknown };
  } catch (error) {
    console.error("Error fetching severity distribution:", error);
    throw error;
  }
}

export async function getSourceDistribution(
  orgId: string,
  userId?: string
): Promise<{ ethicLine: number; customForm: number }> {
  try {
    const baseWhere: Prisma.FormSubmissionWhereInput = { orgId };

    // If userId is provided (member role), filter by reports assigned to them
    if (userId) {
      baseWhere.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const [ethicLine, customForm] = await Promise.all([
      prisma.formSubmission.count({
        where: { ...baseWhere, source: "ETHIC_LINE" },
      }),
      prisma.formSubmission.count({
        where: { ...baseWhere, source: "CUSTOM_FORM" },
      }),
    ]);

    return { ethicLine, customForm };
  } catch (error) {
    console.error("Error fetching source distribution:", error);
    throw error;
  }
}

export async function getWeeklyTrend(
  orgId: string,
  userId?: string
): Promise<Array<{ name: string; reports: number }>> {
  try {
    const baseWhere: Prisma.FormSubmissionWhereInput = { orgId };

    // If userId is provided (member role), filter by reports assigned to them
    if (userId) {
      baseWhere.assignments = {
        some: {
          userId: userId,
        },
      };
    }

    const weeklyData: Array<{ name: string; reports: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const dayEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      const count = await prisma.formSubmission.count({
        where: {
          ...baseWhere,
          submittedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      weeklyData.push({
        name: format(date, "EEE", { locale: es }),
        reports: count,
      });
    }

    return weeklyData;
  } catch (error) {
    console.error("Error fetching weekly trend:", error);
    return [];
  }
}
