import prisma from "@/modules/prisma/lib/prisma";

interface AnalyticsData {
  totalReports: number;
  newReports: number;
  inProgressReports: number;
  closedReports: number;
  avgResolutionTime: number;
  monthlyData: Array<{
    month: string;
    reports: number;
  }>;
}

class AnalyticsService {
  async getBasicAnalytics(orgId: string): Promise<AnalyticsData> {
    // Basic case management statistics available to all plans
    const [totalReports, thisMonthReports, reportsByStatus] = await Promise.all(
      [
        // Total reports count
        prisma.formSubmission.count({
          where: { orgId },
        }),

        // This month's reports
        prisma.formSubmission.count({
          where: {
            orgId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),

        // Reports by status
        prisma.formSubmission.groupBy({
          by: ["status"],
          where: { orgId },
          _count: { status: true },
        }),
      ]
    );

    return {
      totalReports,
      newReports: thisMonthReports,
      inProgressReports:
        reportsByStatus.find((item) => item.status === "IN_PROGRESS")?._count
          .status || 0,
      closedReports:
        reportsByStatus.find((item) => item.status === "CLOSED")?._count
          .status || 0,
      avgResolutionTime: 0, // Placeholder
      monthlyData: [], // Placeholder
    };
  }
}

const analyticsService = new AnalyticsService();

// Export functions for backward compatibility
export async function fetchOrganizationStats(orgId: string) {
  return analyticsService.getBasicAnalytics(orgId);
}

export async function fetchAnalyticsData(orgId: string) {
  return analyticsService.getBasicAnalytics(orgId);
}

// Additional functions for AnalyticsContext compatibility
export async function fetchDashboardData(orgId: string) {
  return analyticsService.getBasicAnalytics(orgId);
}

export async function fetchReportsStats(orgId: string) {
  return analyticsService.getBasicAnalytics(orgId);
}

export async function fetchMemberStats(orgId: string) {
  return analyticsService.getBasicAnalytics(orgId);
}
