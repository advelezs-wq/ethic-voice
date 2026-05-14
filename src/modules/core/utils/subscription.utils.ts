import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import prisma from "@/modules/prisma/lib/prisma";
import { Organization, Subscription } from "@prisma/client";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

/**
 * Update organization plan features based on subscription
 */
export async function updateOrganizationPlanFeatures(
  orgId: string,
  planType: PlanType | string
): Promise<void> {
  try {
    console.log("🏢 Updating organization plan features:", {
      orgId,
      planType,
    });

    // Get plan configuration
    const planConfig = PLAN_CONFIGS[planType as PlanType];
    if (!planConfig) {
      console.error("❌ Invalid plan type:", planType);
      return;
    }

    // Update organization with plan features
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        currentPlan: planType as PlanType,
        hasActivePlan: true,
        isEmailChannelActive: planConfig.features.hasEmailChannel,
        isAiProcessingActive: planConfig.features.hasAiProcessing,
        isChatbotActive: planConfig.features.hasChatbotChannel,
        isPhoneChannelActive: planConfig.features.hasPhoneChannel,
        subscriptionSetupCompleted: true,
      },
    });

    console.log(`✅ Organization ${orgId} plan features updated successfully`);
  } catch (error) {
    console.error("❌ Error updating organization plan features:", error);

    if (error instanceof Error) {
      console.error("❌ Organization update error details:", {
        message: error.message,
        stack: error.stack,
        orgId,
        planType,
      });
    }

    throw error; // Re-throw to handle in calling function
  }
}

/**
 * Get current subscription permissions for an organization
 */
export async function getOrganizationSubscriptionPermissions(orgId: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!organization || !organization.subscriptions.length) {
      // Return basic permissions for organizations without active subscriptions
      return {
        hasActivePlan: false,
        currentPlan: "STARTER" as PlanType,
        canAccessEmailChannel: false,
        canAccessAiProcessing: false,
        canAccessChatbot: false,
        canAccessPhone: false,
        maxUsers: 1,
        maxInvestigators: 4,
        maxEmployees: 50,
      };
    }

    const subscription = organization.subscriptions[0];
    const planConfig = PLAN_CONFIGS[subscription.planType];

    return {
      hasActivePlan: organization.hasActivePlan,
      currentPlan: subscription.planType,
      canAccessEmailChannel: subscription.hasEmailChannel,
      canAccessAiProcessing: subscription.hasAiProcessing,
      canAccessChatbot: subscription.hasChatbotChannel,
      canAccessPhone: subscription.hasPhoneChannel,
      maxUsers: subscription.maxUsers,
      maxInvestigators: subscription.maxInvestigators,
      maxEmployees: subscription.maxEmployees,
      features: planConfig?.features || null,
    };
  } catch (error) {
    console.error(
      "❌ Error getting organization subscription permissions:",
      error
    );
    throw error;
  }
}

/**
 * Check if organization has reached user limits
 */
export async function checkOrganizationUserLimits(orgId: string) {
  try {
    const permissions = await getOrganizationSubscriptionPermissions(orgId);

    // Get current user counts
    // Note: This would need to be implemented based on your user management system
    // For now, returning basic structure

    return {
      canAddAdmins: true, // permissions.currentUserCount < permissions.maxUsers
      canAddInvestigators: true, // permissions.currentInvestigatorCount < permissions.maxInvestigators
      canAddEmployees: true, // permissions.currentEmployeeCount < permissions.maxEmployees
      limits: {
        maxUsers: permissions.maxUsers,
        maxInvestigators: permissions.maxInvestigators,
        maxEmployees: permissions.maxEmployees,
      },
    };
  } catch (error) {
    console.error("❌ Error checking organization user limits:", error);
    throw error;
  }
}

/**
 * Get organization plan information
 */
export async function getOrganizationPlanInfo(orgId: string, userId?: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!organization) {
      return null;
    }

    let activeSubscription = organization.subscriptions[0];

    // ✅ AUTO-LINK LOGIC: If no active subscription found for organization,
    // check if user has unlinked active subscription and link it automatically
    if (!activeSubscription && userId) {
      console.log(
        "🔍 [AUTO-LINK] No active subscription found for organization, checking for unlinked user subscriptions..."
      );

      // Find active subscription without orgId for the user
      const unlinkedSubscription = await prisma.subscription.findFirst({
        where: {
          userId: userId,
          status: "ACTIVE",
          orgId: null, // Not linked to any organization
        },
        orderBy: {
          createdAt: "desc", // Get the most recent active subscription
        },
      });

      if (unlinkedSubscription) {
        console.log(
          "✅ [AUTO-LINK] Found unlinked subscription, linking to organization:",
          {
            subscriptionId: unlinkedSubscription.id,
            planType: unlinkedSubscription.planType,
            orgId: orgId,
          }
        );

        // Update subscription with organization ID
        activeSubscription = await prisma.subscription.update({
          where: { id: unlinkedSubscription.id },
          data: {
            orgId: orgId,
          },
        });

        // Update organization with plan features
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            currentPlan: unlinkedSubscription.planType,
            hasActivePlan: true,
            isEmailChannelActive: unlinkedSubscription.hasEmailChannel,
            isAiProcessingActive: unlinkedSubscription.hasAiProcessing,
            isChatbotActive: unlinkedSubscription.hasChatbotChannel,
            isPhoneChannelActive: unlinkedSubscription.hasPhoneChannel,
            subscriptionSetupCompleted: true,
          },
        });
        await recalculateOrganizationSeatUsage(orgId);

        // Update organization object for the response
        organization.hasActivePlan = true;
        organization.currentPlan = unlinkedSubscription.planType;

        console.log(
          "🎉 [AUTO-LINK] Successfully linked subscription to organization!"
        );
      } else {
        console.log(
          "ℹ️ [AUTO-LINK] No unlinked active subscriptions found for user"
        );
      }
    }

    const planType =
      activeSubscription?.planType || organization.currentPlan || "STARTER";
    const planConfig = PLAN_CONFIGS[planType as PlanType];

    // Compute effective limits: never below plan config, and treat -1 carefully (unlimited only for plans that specify it)
    const configMaxUsers = planConfig?.features?.maxUsers ?? 1;
    const configMaxInvestigators =
      planConfig?.features?.maxInvestigators ?? 4;

    const resolveMax = (subValue?: number | null, cfg?: number) => {
      const configVal = typeof cfg === "number" ? cfg : 0;
      if (configVal === -1) return -1; // Unlimited per plan config
      if (typeof subValue !== "number" || subValue <= 0) return configVal;
      if (subValue === -1) return configVal; // Normalize legacy unlimited to current config
      return Math.max(subValue, configVal);
    };

    const effectiveMaxUsers = resolveMax(
      activeSubscription?.maxUsers,
      configMaxUsers
    );
    const effectiveMaxInvestigators = resolveMax(
      activeSubscription?.maxInvestigators,
      configMaxInvestigators
    );

    const memberships = await prisma.organizationMembership.findMany({
      where: { orgId },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    const visibleMemberships = memberships.filter(
      (membership) => !isSuperAdmin(membership.user.email)
    );
    const currentAdmins = visibleMemberships.filter(
      (membership) => membership.role === "ADMIN"
    ).length;
    const currentMembers = visibleMemberships.filter(
      (membership) => membership.role === "MEMBER"
    ).length;

    const isOverUserLimit =
      effectiveMaxUsers !== -1 && currentAdmins > effectiveMaxUsers;
    const isOverInvestigatorLimit =
      effectiveMaxInvestigators !== -1 &&
      currentMembers > effectiveMaxInvestigators;

    return {
      orgId: organization.id,
      planType,
      hasActivePlan: organization.hasActivePlan,
      subscriptionStatus: activeSubscription?.status || "INACTIVE",
      currentUsers: currentAdmins,
      currentInvestigators: currentMembers,
      isOverUserLimit,
      isOverInvestigatorLimit,
      restrictions: [
        ...(isOverUserLimit
          ? [`Administradores por encima del límite (${currentAdmins}/${effectiveMaxUsers})`]
          : []),
        ...(isOverInvestigatorLimit
          ? [
              `Investigadores por encima del límite (${currentMembers}/${effectiveMaxInvestigators})`,
            ]
          : []),
      ],
      features: planConfig?.features || PLAN_CONFIGS.STARTER.features,
      limits: {
        maxUsers: effectiveMaxUsers,
        maxInvestigators: effectiveMaxInvestigators,
        maxEmployees:
          activeSubscription?.maxEmployees ||
          planConfig?.features?.maxEmployees ||
          50,
      },
      // Convenience top-level fields for clients that read flattened values
      maxUsers: effectiveMaxUsers,
      maxInvestigators: effectiveMaxInvestigators,
      subscription: activeSubscription,
    };
  } catch (error) {
    console.error("❌ Error getting organization plan info:", error);
    throw error;
  }
}

export async function recalculateOrganizationSeatUsage(orgId: string) {
  const memberships = await prisma.organizationMembership.findMany({
    where: { orgId },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  const visibleMemberships = memberships.filter(
    (membership) => !isSuperAdmin(membership.user.email)
  );

  const adminCount = visibleMemberships.filter(
    (membership) => membership.role === "ADMIN"
  ).length;
  const memberCount = visibleMemberships.filter(
    (membership) => membership.role === "MEMBER"
  ).length;

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      currentUsers: Math.max(adminCount, 0),
      currentInvestigators: Math.max(memberCount, 0),
    },
  });

  return {
    currentUsers: adminCount,
    currentInvestigators: memberCount,
  };
}

/**
 * Update organization usage counters
 */
export async function updateOrganizationUsage(
  orgId: string,
  usage: {
    emailReports?: number;
    aiProcessing?: number;
    formSubmissions?: number;
    phoneReports?: number;
    chatbotQueries?: number;
  }
) {
  try {
    // For now, just log the usage update
    // In a full implementation, you'd update usage counters in the database
    console.log("📊 Updating organization usage:", {
      orgId,
      usage,
    });

    // TODO: Implement actual usage tracking in database
    // This could involve updating monthly usage counters, checking limits, etc.

    return {
      success: true,
      updatedUsage: usage,
    };
  } catch (error) {
    console.error("❌ Error updating organization usage:", error);
    throw error;
  }
}

/**
 * Get plan restrictions for a specific plan type
 */
export function getPlanRestriction(planType: PlanType | string) {
  const planConfig = PLAN_CONFIGS[planType as PlanType];

  if (!planConfig) {
    console.warn("⚠️ Unknown plan type:", planType);
    return PLAN_CONFIGS.STARTER;
  }

  return planConfig;
}
