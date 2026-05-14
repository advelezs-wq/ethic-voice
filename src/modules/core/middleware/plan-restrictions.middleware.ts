import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser, clerkClient, createClerkClient } from "@clerk/nextjs/server";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import {
  getPlanPermissions,
  PlanType,
  SubscriptionPermissions,
} from "@/types/subscription.types";
import { PlanRestrictionReason } from "@/types/auth.types";
import { isSuperAdmin } from "../utils/permissions";

// ✅ Helper function to get Clerk client safely
function getClerkClient() {
  try {
    // Handle both function and object exports for Clerk client
    if (typeof clerkClient === "function") {
      const client = (clerkClient as unknown as () => any)();
      return client;
    } else if (clerkClient) {
      return clerkClient as any;
    }

    // Fallback: create new client instance
    console.log("🔄 Creating new Clerk client instance...");
    const client = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    });

    return client;
  } catch (error) {
    console.error("❌ Failed to get Clerk client:", error);
    return null;
  }
}

interface PlanRestrictionConfig {
  requiredFeature?: keyof SubscriptionPermissions;
  minimumPlan?: PlanType;
  requiresActivePlan?: boolean;
  allowDuringTrial?: boolean;
  customCheck?: (
    planInfo: any,
    permissions: SubscriptionPermissions
  ) => boolean;
}

// Route patterns and their required plan features
const PLAN_RESTRICTIONS: Record<string, PlanRestrictionConfig> = {
  // Email configuration routes
  "/api/organization/email": {
    requiredFeature: "canAccessEmailChannel",
    requiresActivePlan: true,
    allowDuringTrial: true,
  },

  // AI processing routes
  "/api/ai": {
    requiredFeature: "canUseAiProcessing",
    requiresActivePlan: true,
    allowDuringTrial: true,
  },

  // Analytics routes
  "/api/analytics/advanced": {
    requiredFeature: "canAccessAdvancedAnalytics",
    requiresActivePlan: true,
    allowDuringTrial: false,
  },

  // User management
  "/api/organization/members": {
    customCheck: (_planInfo, _permissions) => {
      // Allow viewing members, but restrict creation based on limits
      return true; // We'll handle specific restrictions in the route
    },
  },

  // Settings and customization
  "/api/organization/settings/theme": {
    requiredFeature: "canCustomizeColors",
    requiresActivePlan: true,
    allowDuringTrial: true,
  },

  "/api/organization/settings/advanced": {
    requiredFeature: "canAccessAllSettings",
    requiresActivePlan: true,
    allowDuringTrial: false,
  },
};

// Check if a route matches any restriction pattern
function getRouteRestriction(pathname: string): PlanRestrictionConfig | null {
  for (const [pattern, config] of Object.entries(PLAN_RESTRICTIONS)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  return null;
}

export async function checkPlanRestrictions(
  req: NextRequest,
  userId?: string
): Promise<NextResponse | null> {
  try {
    // If userId is not provided, try to get it from auth (for backwards compatibility)
    if (!userId) {
      const authResult = await auth();
      userId = authResult.userId || undefined;
    }

    if (!userId) {
      // User not authenticated - let auth middleware handle this
      return null;
    }

    // Check if user is super admin - they bypass all plan restrictions
    // Avoid throwing if Clerk context isn't available on edge
    try {
      const user = await currentUser().catch(() => null as any);
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      if (userEmail && isSuperAdmin(userEmail)) {
        console.log(
          "👑 [PLAN-MIDDLEWARE] Super admin detected, bypassing all plan restrictions"
        );
        return null; // Allow access
      }
    } catch {
      // Silently continue with normal plan checks
    }

    const pathname = req.nextUrl.pathname;
    const restriction = getRouteRestriction(pathname);

    if (!restriction) {
      // No plan restrictions for this route
      return null;
    }

    // Get organization ID from request (could be from params, query, or body)
    let orgId: string | null = null;

    // Try to get orgId from URL params
    const urlParts = pathname.split("/");
    const orgIndex = urlParts.findIndex((part) => part === "organization");
    if (orgIndex !== -1 && urlParts[orgIndex + 1]) {
      orgId = urlParts[orgIndex + 1];
    }

    // Try to get orgId from query params
    if (!orgId) {
      orgId = req.nextUrl.searchParams.get("orgId");
    }

    // Try to get orgId from request body for POST/PUT requests
    if (
      !orgId &&
      (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")
    ) {
      try {
        const body = await req.clone().json();
        orgId = body.orgId || body.organizationId;
      } catch {
        // Ignore JSON parse errors
      }
    }

    if (!orgId) {
      // No organization context - might be a user-level route
      return null;
    }

    // Get organization plan info
    const planInfo = await getOrganizationPlanInfo(orgId);

    if (!planInfo) {
      return NextResponse.json(
        {
          error: "Organization not found or no plan information available",
          code: "ORGANIZATION_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const planPermissions = getPlanPermissions(
      planInfo.planType as unknown as PlanType
    );

    // Check if plan is active (if required)
    if (restriction.requiresActivePlan && !planInfo.hasActivePlan) {
      const trialActive = Boolean((planInfo as any).subscription?.isTrialActive);
      if (!restriction.allowDuringTrial || !trialActive) {
        return NextResponse.json(
          {
            error: "Active subscription required",
            code: "SUBSCRIPTION_REQUIRED",
            currentPlan: planInfo.planType,
            upgradeUrl: "/pricing",
            restriction: {
              reason: PlanRestrictionReason.SUBSCRIPTION_INACTIVE,
              message:
                "Your subscription is not active. Please activate your plan to access this feature.",
            },
          },
          { status: 403 }
        );
      }
    }

    // Check specific feature requirement
    if (restriction.requiredFeature) {
      const hasFeature = planPermissions[restriction.requiredFeature];

      if (!hasFeature) {
        // Determine the minimum plan that includes this feature
        const planOrder = [
          PlanType.STARTER,
          PlanType.GROW,
          PlanType.GROW_PRO,
          PlanType.PREMIUM,
        ];
        const requiredPlan = planOrder.find((plan) =>
          getPlanPermissions(plan)[restriction.requiredFeature!]
        );
        const planRestriction = {
          reason: PlanRestrictionReason.PLAN_UPGRADE_REQUIRED,
          message: requiredPlan
            ? `This feature requires the ${requiredPlan} plan or higher.`
            : "This feature is not available in the current plan.",
          requiredPlan,
          upgradeUrl: "/pricing",
        };

        return NextResponse.json(
          {
            error: "Feature not available in current plan",
            code: "FEATURE_RESTRICTED",
            currentPlan: planInfo.planType,
            requiredFeature: restriction.requiredFeature,
            restriction: planRestriction,
            upgradeUrl: "/pricing",
          },
          { status: 403 }
        );
      }
    }

    // Check minimum plan requirement
    if (restriction.minimumPlan) {
      const planOrder = [
        PlanType.STARTER,
        PlanType.GROW,
        PlanType.GROW_PRO,
        PlanType.PREMIUM,
      ];
      const currentPlanIndex = planOrder.indexOf(
        planInfo.planType as unknown as PlanType
      );
      const requiredPlanIndex = planOrder.indexOf(restriction.minimumPlan);

      if (currentPlanIndex < requiredPlanIndex) {
        return NextResponse.json(
          {
            error: "Plan upgrade required",
            code: "PLAN_UPGRADE_REQUIRED",
            currentPlan: planInfo.planType,
            minimumPlan: restriction.minimumPlan,
            upgradeUrl: "/pricing",
          },
          { status: 403 }
        );
      }
    }

    // Run custom check if provided
    if (
      restriction.customCheck &&
      !restriction.customCheck(planInfo, planPermissions)
    ) {
      return NextResponse.json(
        {
          error: "Access denied by plan restrictions",
          code: "CUSTOM_RESTRICTION",
          currentPlan: planInfo.planType,
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }

    // All checks passed - allow request to continue
    return null;
  } catch (error) {
    console.error("Error checking plan restrictions:", error);

    // On error, allow request to continue but log the issue
    // This ensures the platform doesn't break if there's a temporary issue
    return null;
  }
}

// Helper function to check user limits for API endpoints
export async function checkUserLimits(
  orgId: string,
  actionType: "create_user" | "create_investigator"
): Promise<{ allowed: boolean; restriction?: any }> {
  try {
    const planInfo = await getOrganizationPlanInfo(orgId);

    if (!planInfo) {
      return {
        allowed: false,
        restriction: { message: "Organization not found" },
      };
    }

    const planPermissions = getPlanPermissions(
      planInfo.planType as unknown as PlanType
    );

    switch (actionType) {
      case "create_user":
        if (
          planPermissions.canCreateUnlimitedUsers ||
          planPermissions.maxUsersAllowed === -1
        ) {
          return { allowed: true };
        }

        const currentUsers = (planInfo as any).currentUsers ?? 0;
        if (currentUsers >= planPermissions.maxUsersAllowed) {
          return {
            allowed: false,
            restriction: {
              reason: PlanRestrictionReason.USER_LIMIT_EXCEEDED,
              message: `User limit reached (${currentUsers}/${planPermissions.maxUsersAllowed})`,
              currentUsage: currentUsers,
              limit: planPermissions.maxUsersAllowed,
              upgradeUrl: "/pricing",
            },
          };
        }
        break;

      case "create_investigator":
        if (planPermissions.maxInvestigatorsAllowed === -1) {
          return { allowed: true };
        }

        const currentInvestigators =
          (planInfo as any).currentInvestigators ?? 0;
        if (currentInvestigators >= planPermissions.maxInvestigatorsAllowed) {
          return {
            allowed: false,
            restriction: {
              reason: PlanRestrictionReason.INVESTIGATOR_LIMIT_EXCEEDED,
              message: `Investigator limit reached (${currentInvestigators}/${planPermissions.maxInvestigatorsAllowed})`,
              currentUsage: currentInvestigators,
              limit: planPermissions.maxInvestigatorsAllowed,
              upgradeUrl: "/pricing",
            },
          };
        }
        break;
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking user limits:", error);
    return {
      allowed: false,
      restriction: { message: "Error checking limits" },
    };
  }
}

// Utility function to generate upgrade response for blocked actions
export function createUpgradeResponse(
  feature: string,
  currentPlan: PlanType,
  requiredPlan?: PlanType
) {
  return NextResponse.json(
    {
      error: `${feature} requires a plan upgrade`,
      code: "UPGRADE_REQUIRED",
      currentPlan,
      requiredPlan,
      upgradeUrl: `/app/billing/upgrade?feature=${encodeURIComponent(feature)}&from=${currentPlan}&to=${requiredPlan}`,
      action: "upgrade",
    },
    { status: 402 } // Payment Required
  );
}
