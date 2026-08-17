"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { differenceInDays } from "date-fns";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

// getTeamPerformance/getTeamMembers take orgId as a plain argument (called
// from client components with whatever org is on screen), which means
// nothing stops a signed-in user from calling either directly with an
// arbitrary org's UUID and pulling that org's full team roster —
// names, emails, roles, departments, performance data. Every other
// org-scoped action in this codebase derives orgId from the session
// (resolveOrgId()) instead of trusting a caller-supplied one; these two
// need their own explicit membership check since they take orgId as input.
async function assertCanViewOrgTeam(orgId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [membership, user] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    }),
    currentUser(),
  ]);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isSuper = Boolean(userEmail && isSuperAdmin(userEmail));

  if (!membership && !isSuper) {
    throw new Error("Forbidden");
  }

  return userId;
}

export async function getTeamPerformance(orgId: string) {
  await assertCanViewOrgTeam(orgId);

  try {
    // Get all organization members
    const members = await prisma.organizationMembership.findMany({
      where: { orgId },
      include: {
        user: true,
      },
    });

    // Get performance stats for each member
    const teamStats = await Promise.all(
      members.map(async (member) => {
        const [assignedReports, completedReports] = await Promise.all([
          prisma.formSubmission.count({
            where: {
              orgId,
              assignments: {
                some: {
                  userId: member.userId,
                },
              },
            },
          }),
          prisma.formSubmission.count({
            where: {
              orgId,
              assignments: {
                some: {
                  userId: member.userId,
                },
              },
              status: { in: ["RESOLVED", "CLOSED"] },
            },
          }),
        ]);

        // Calculate average resolution time
        const resolvedReports = await prisma.formSubmission.findMany({
          where: {
            orgId,
            assignments: {
              some: {
                userId: member.userId,
              },
            },
            status: { in: ["RESOLVED", "CLOSED"] },
            processedAt: { not: null },
          },
          select: {
            submittedAt: true,
            processedAt: true,
          },
        });

        const averageResolutionTime =
          resolvedReports.length > 0
            ? resolvedReports.reduce((acc, report) => {
                const days = differenceInDays(
                  new Date(report.processedAt!),
                  new Date(report.submittedAt)
                );
                return acc + days;
              }, 0) / resolvedReports.length
            : 0;

        const performanceScore =
          assignedReports > 0
            ? Math.round((completedReports / assignedReports) * 100)
            : 0;

        return {
          userId: member.userId,
          userName: `${member.user.firstName || ""} ${
            member.user.lastName || member.user.email
          }`,
          assignedReports,
          completedReports,
          averageResolutionTime,
          performanceScore,
        };
      })
    );

    return teamStats.sort((a, b) => b.performanceScore - a.performanceScore);
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return [];
  }
}

export async function getTeamMembers(orgId: string) {
  await assertCanViewOrgTeam(orgId);

  try {
    const members = await prisma.organizationMembership.findMany({
      where: { orgId },
      include: {
        user: true,
        department: true,
      },
    });

    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        // Base assignment filter
        const assignmentFilter = {
          assignments: {
            some: {
              userId: member.userId,
            },
          },
        };

        // For members, only count reports in their department
        const reportWhereClause =
          member.role === "MEMBER" && member.departmentId
            ? {
                orgId,
                departmentId: member.departmentId,
                ...assignmentFilter,
              }
            : {
                orgId,
                ...assignmentFilter,
              };

        const [
          assignedReports,
          completedReports,
          inProgressReports,
          pendingReports,
        ] = await Promise.all([
          prisma.formSubmission.count({
            where: reportWhereClause,
          }),
          prisma.formSubmission.count({
            where: {
              ...reportWhereClause,
              status: { in: ["RESOLVED", "CLOSED"] },
            },
          }),
          prisma.formSubmission.count({
            where: {
              ...reportWhereClause,
              status: "IN_PROGRESS",
            },
          }),
          prisma.formSubmission.count({
            where: {
              ...reportWhereClause,
              status: "PENDING",
            },
          }),
        ]);

        const performanceScore =
          assignedReports > 0
            ? Math.round((completedReports / assignedReports) * 100)
            : 0;

        return {
          userId: member.userId,
          userName: `${member.user.firstName || ""} ${
            member.user.lastName || member.user.email
          }`,
          email: member.user.email,
          role: member.role,
          departmentId: member.departmentId,
          departmentName: member.department?.name,
          assignedReports,
          completedReports,
          inProgressReports,
          pendingReports,
          performanceScore,
        };
      })
    );

    return membersWithStats;
  } catch (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }
}

export async function getMemberDetails(memberId: string, orgId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify the user is admin of the organization
    const adminMembership = await prisma.organizationMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== "ADMIN") {
      throw new Error("Forbidden");
    }

    // Get member details
    const member = await prisma.organizationMembership.findUnique({
      where: {
        userId_orgId: {
          userId: memberId,
          orgId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new Error("Member not found");
    }

    // Get member's reports
    const reports = await prisma.formSubmission.findMany({
      where: {
        orgId,
        assignments: {
          some: {
            userId: memberId,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 20,
    });

    // Calculate performance metrics
    const [
      totalAssigned,
      totalResolved,
      totalPending,
      totalInProgress,
      highSeverityCount,
      averageResolutionDays,
    ] = await Promise.all([
      prisma.formSubmission.count({
        where: {
          orgId,
          assignments: {
            some: {
              userId: memberId,
            },
          },
        },
      }),
      prisma.formSubmission.count({
        where: {
          orgId,
          assignments: {
            some: {
              userId: memberId,
            },
          },
          status: { in: ["RESOLVED", "CLOSED"] },
        },
      }),
      prisma.formSubmission.count({
        where: {
          orgId,
          assignments: {
            some: {
              userId: memberId,
            },
          },
          status: "PENDING",
        },
      }),
      prisma.formSubmission.count({
        where: {
          orgId,
          assignments: {
            some: {
              userId: memberId,
            },
          },
          status: "IN_PROGRESS",
        },
      }),
      prisma.formSubmission.count({
        where: {
          orgId,
          assignments: {
            some: {
              userId: memberId,
            },
          },
          aiSeverity: "HIGH",
        },
      }),
      calculateAverageResolutionTime(memberId, orgId),
    ]);

    // Get weekly performance
    const weeklyPerformance = await getWeeklyPerformance(memberId, orgId);

    return {
      member: {
        ...member,
        userName: `${member.user.firstName || ""} ${
          member.user.lastName || member.user.email
        }`,
      },
      stats: {
        totalAssigned,
        totalResolved,
        totalPending,
        totalInProgress,
        highSeverityCount,
        averageResolutionDays,
        resolutionRate:
          totalAssigned > 0 ? (totalResolved / totalAssigned) * 100 : 0,
      },
      recentReports: reports,
      weeklyPerformance,
    };
  } catch (error) {
    console.error("Error fetching member details:", error);
    throw error;
  }
}

async function calculateAverageResolutionTime(
  userId: string,
  orgId: string
): Promise<number> {
  const resolvedReports = await prisma.formSubmission.findMany({
    where: {
      orgId,
      assignments: {
        some: {
          userId: userId,
        },
      },
      status: { in: ["RESOLVED", "CLOSED"] },
      processedAt: { not: null },
    },
    select: {
      submittedAt: true,
      processedAt: true,
    },
  });

  if (resolvedReports.length === 0) return 0;

  const totalDays = resolvedReports.reduce((acc, report) => {
    const days = differenceInDays(
      new Date(report.processedAt!),
      new Date(report.submittedAt)
    );
    return acc + days;
  }, 0);

  return Math.round(totalDays / resolvedReports.length);
}

async function getWeeklyPerformance(userId: string, orgId: string) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  const performance = await Promise.all(
    last7Days.map(async (date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const [assigned, resolved] = await Promise.all([
        prisma.formSubmission.count({
          where: {
            orgId,
            assignments: {
              some: {
                userId: userId,
              },
            },
          },
        }),
        prisma.formSubmission.count({
          where: {
            orgId,
            assignments: {
              some: {
                userId: userId,
              },
            },
            processedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { in: ["RESOLVED", "CLOSED"] },
          },
        }),
      ]);

      return {
        date: date.toISOString(),
        dayName: date.toLocaleDateString("es-ES", { weekday: "short" }),
        assigned,
        resolved,
      };
    })
  );

  return performance;
}
