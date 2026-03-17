"use server";

import prisma from "@/modules/prisma/lib/prisma";

export async function getActiveOrganizations() {
  try {
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        brandColor: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
    return organizations;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

export async function getOrganizationAnalytics(orgId: string) {
  try {
    const [organization, recentSubmissions, submissionsByType] =
      await Promise.all([
        prisma.organization.findUnique({
          where: { id: orgId },
          select: {
            totalSubmissions: true,
            customFormSubmissions: true,
            ethicLineSubmissions: true,
          },
        }),

        prisma.formSubmission.findMany({
          where: { orgId },
          orderBy: { submittedAt: "desc" },
          take: 10,
          select: {
            id: true,
            source: true,
            submittedAt: true,
            aiSeverity: true,
          },
        }),

        prisma.formSubmission.groupBy({
          by: ["source"],
          where: { orgId },
          _count: true,
        }),
      ]);

    const total = organization?.totalSubmissions || 0;
    const customFormPercentage =
      total > 0
        ? ((organization?.customFormSubmissions || 0) / total) * 100
        : 0;
    const ethicLinePercentage =
      total > 0 ? ((organization?.ethicLineSubmissions || 0) / total) * 100 : 0;

    return {
      totals: {
        all: total,
        customForms: organization?.customFormSubmissions || 0,
        ethicLine: organization?.ethicLineSubmissions || 0,
      },
      percentages: {
        customForms: customFormPercentage,
        ethicLine: ethicLinePercentage,
      },
      recentSubmissions,
      byType: submissionsByType,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw new Error("Failed to fetch analytics");
  }
}
