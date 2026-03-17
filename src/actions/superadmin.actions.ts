"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getDashboardStats } from "./analytics.actions";
import { getTeamPerformance } from "./team.actions";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export async function getAllOrganizationsStats() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized - No user ID");
    }

    // Get current user from Clerk
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

    if (!userEmail || !isSuperAdmin(userEmail)) {
      throw new Error("Forbidden - Not a super admin");
    }

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            forms: true,
            complaints: true,
            memberships: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get stats for each organization
    const organizationsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const [pendingReports, resolvedReports, highSeverityReports] =
          await Promise.all([
            prisma.formSubmission.count({
              where: { orgId: org.id, status: "PENDING" },
            }),
            prisma.formSubmission.count({
              where: { orgId: org.id, status: { in: ["RESOLVED", "CLOSED"] } },
            }),
            prisma.formSubmission.count({
              where: { orgId: org.id, aiSeverity: "HIGH" },
            }),
          ]);

        return {
          ...org,
          stats: {
            pendingReports,
            resolvedReports,
            highSeverityReports,
          },
        };
      })
    );

    // System-wide stats
    const [totalUsers, totalReports] = await Promise.all([
      prisma.user.count(),
      prisma.formSubmission.count(),
    ]);

    return {
      organizations: organizationsWithStats,
      systemStats: {
        totalOrganizations: organizations.length,
        activeOrganizations: organizations.filter((org) => org.isActive).length,
        totalUsers,
        totalReports,
      },
    };
  } catch (error) {
    console.error("Error in getAllOrganizationsStats:", error);
    throw error;
  }
}

export async function getOrganizationDetails(orgId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

    if (!userEmail || !isSuperAdmin(userEmail)) {
      throw new Error("Forbidden");
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            forms: true,
            complaints: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get detailed stats
    const stats = await getDashboardStats(orgId);
    const teamPerformance = await getTeamPerformance(orgId);

    return {
      organization,
      stats,
      teamPerformance,
    };
  } catch (error) {
    console.error("Error fetching organization details:", error);
    throw error;
  }
}
