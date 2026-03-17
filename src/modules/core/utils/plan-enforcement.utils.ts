import prisma from "@/modules/prisma/lib/prisma";
import { getOrganizationPlanInfo } from "./subscription.utils";
import { isSuperAdmin } from "./permissions";

interface PlanEnforcementResult {
  success: boolean;
  blockedUsers: Array<{
    id: string;
    email: string;
    role: string;
    reason: string;
  }>;
  unblockedUsers: Array<{
    id: string;
    email: string;
    role: string;
  }>;
  message: string;
  currentLimits: {
    maxUsers: number;
    maxInvestigators: number;
    currentAdmins: number;
    currentMembers: number;
    activeAdmins: number;
    activeMembers: number;
  };
}

/**
 * Enforce plan limits for an organization
 * Blocks excess users when plan is downgraded
 * Unblocks users when plan is upgraded
 */
export async function enforcePlanLimits(
  orgId: string,
  userId?: string
): Promise<PlanEnforcementResult> {
  console.log(
    "🛡️ [PLAN-ENFORCEMENT] Starting plan limits enforcement for organization:",
    orgId
  );

  try {
    // Get current plan information
    const planInfo = await getOrganizationPlanInfo(orgId, userId);

    if (!planInfo) {
      throw new Error("Organization not found or no plan information");
    }

    const rawMaxUsers = planInfo.limits?.maxUsers ?? 1;
    const rawMaxInvestigators = planInfo.limits?.maxInvestigators ?? 4;

    // Treat -1 as unlimited
    const maxUsers =
      rawMaxUsers === -1 ? Number.POSITIVE_INFINITY : rawMaxUsers;
    const maxInvestigators =
      rawMaxInvestigators === -1
        ? Number.POSITIVE_INFINITY
        : rawMaxInvestigators;

    console.log("📊 [PLAN-ENFORCEMENT] Plan limits:", {
      planType: planInfo.planType,
      maxUsers,
      maxInvestigators,
    });

    // Get all organization members (excluding super admin)
    const memberships = await prisma.organizationMembership.findMany({
      where: {
        orgId: orgId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Keep oldest members active when enforcing limits
      },
    });

    // Filter out super admin
    const filteredMemberships = memberships.filter((membership) => {
      return !isSuperAdmin(membership.user.email);
    });

    const admins = filteredMemberships.filter((m) => m.role === "ADMIN");
    const members = filteredMemberships.filter((m) => m.role === "MEMBER");

    console.log("👥 [PLAN-ENFORCEMENT] Current membership:", {
      totalAdmins: admins.length,
      totalMembers: members.length,
      maxUsers,
      maxInvestigators,
    });

    let blockedUsers: PlanEnforcementResult["blockedUsers"] = [];
    let unblockedUsers: PlanEnforcementResult["unblockedUsers"] = [];

    // Enforce admin limits
    if (admins.length > maxUsers) {
      const excessAdmins = admins.slice(Number(maxUsers)); // Block excess admins (newest first due to ordering)

      for (const admin of excessAdmins) {
        await prisma.organizationMembership.update({
          where: { id: admin.id },
          data: { isBlocked: true },
        });

        blockedUsers.push({
          id: admin.id,
          email: admin.user.email,
          role: "ADMIN",
          reason: `Plan allows maximum ${rawMaxUsers} administrator${rawMaxUsers > 1 ? "s" : ""}`,
        });

        console.log("🚫 [PLAN-ENFORCEMENT] Blocked admin:", admin.user.email);
      }
    } else {
      // Unblock admins if we're under the limit
      const blockedAdmins = admins.filter((a) => a.isBlocked);
      const canUnblock = Math.min(
        blockedAdmins.length,
        Number(maxUsers) - (admins.length - blockedAdmins.length)
      );

      for (let i = 0; i < canUnblock; i++) {
        const admin = blockedAdmins[i];
        await prisma.organizationMembership.update({
          where: { id: admin.id },
          data: { isBlocked: false },
        });

        unblockedUsers.push({
          id: admin.id,
          email: admin.user.email,
          role: "ADMIN",
        });

        console.log("✅ [PLAN-ENFORCEMENT] Unblocked admin:", admin.user.email);
      }
    }

    // Enforce investigator limits
    if (members.length > maxInvestigators) {
      const excessMembers = members.slice(Number(maxInvestigators)); // Block excess members (newest first)

      for (const member of excessMembers) {
        await prisma.organizationMembership.update({
          where: { id: member.id },
          data: { isBlocked: true },
        });

        blockedUsers.push({
          id: member.id,
          email: member.user.email,
          role: "MEMBER",
          reason: `Plan allows maximum ${rawMaxInvestigators} investigator${rawMaxInvestigators > 1 ? "s" : ""}`,
        });

        console.log(
          "🚫 [PLAN-ENFORCEMENT] Blocked investigator:",
          member.user.email
        );
      }
    } else {
      // Unblock members if we're under the limit
      const blockedMembers = members.filter((m) => m.isBlocked);
      const canUnblock = Math.min(
        blockedMembers.length,
        Number(maxInvestigators) - (members.length - blockedMembers.length)
      );

      for (let i = 0; i < canUnblock; i++) {
        const member = blockedMembers[i];
        await prisma.organizationMembership.update({
          where: { id: member.id },
          data: { isBlocked: false },
        });

        unblockedUsers.push({
          id: member.id,
          email: member.user.email,
          role: "MEMBER",
        });

        console.log(
          "✅ [PLAN-ENFORCEMENT] Unblocked investigator:",
          member.user.email
        );
      }
    }

    // Update organization counters (avoid negatives when unlimited)
    const activeAdmins = Math.min(admins.length, Number(maxUsers));
    const activeMembers = Math.min(members.length, Number(maxInvestigators));

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        currentUsers: activeAdmins,
        currentInvestigators: activeMembers,
      },
    });

    const result: PlanEnforcementResult = {
      success: true,
      blockedUsers,
      unblockedUsers,
      message: `Plan limits enforced. ${blockedUsers.length} users blocked, ${unblockedUsers.length} users unblocked.`,
      currentLimits: {
        maxUsers: rawMaxUsers,
        maxInvestigators: rawMaxInvestigators,
        currentAdmins: admins.length,
        currentMembers: members.length,
        activeAdmins,
        activeMembers,
      },
    };

    console.log("🎉 [PLAN-ENFORCEMENT] Plan enforcement completed:", {
      blockedCount: blockedUsers.length,
      unblockedCount: unblockedUsers.length,
      activeAdmins,
      activeMembers,
    });

    return result;
  } catch (error) {
    console.error("❌ [PLAN-ENFORCEMENT] Error enforcing plan limits:", error);

    return {
      success: false,
      blockedUsers: [],
      unblockedUsers: [],
      message: `Error enforcing plan limits: ${error instanceof Error ? error.message : "Unknown error"}`,
      currentLimits: {
        maxUsers: 1,
        maxInvestigators: 4,
        currentAdmins: 0,
        currentMembers: 0,
        activeAdmins: 0,
        activeMembers: 0,
      },
    };
  }
}

/**
 * Get organization members with their blocked status
 */
export async function getOrganizationMembersWithStatus(orgId: string) {
  const memberships = await prisma.organizationMembership.findMany({
    where: {
      orgId: orgId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Filter out super admin and transform data
  return memberships
    .filter((membership) => !isSuperAdmin(membership.user.email))
    .map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      orgId: membership.orgId,
      role: membership.role,
      isBlocked: membership.isBlocked || false,
      createdAt: membership.createdAt,
      user: {
        id: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
      },
    }));
}

/**
 * Manually block/unblock a specific user
 */
export async function toggleUserBlock(
  membershipId: string,
  isBlocked: boolean
) {
  const membership = await prisma.organizationMembership.findUnique({
    where: { id: membershipId },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("Membership not found");
  }

  // Prevent blocking super admin
  if (isSuperAdmin(membership.user.email)) {
    throw new Error("Cannot modify super administrator status");
  }

  await prisma.organizationMembership.update({
    where: { id: membershipId },
    data: { isBlocked },
  });

  return {
    id: membership.id,
    email: membership.user.email,
    role: membership.role,
    isBlocked,
    name: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
  };
}
