import { auth, currentUser } from "@clerk/nextjs/server";
import { clerkClient, createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

// ✅ Helper function to get Clerk client safely
function getClerkClient() {
  try {
    // Always create a new client for consistency across environments
    console.log("🔄 Creating Clerk client instance...");
    return createClerkClient({
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
  } catch (error) {
    console.error("❌ Failed to create Clerk client:", error);
    console.error("❌ Environment variables:", {
      hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    });
    return null;
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "🐛 [DEBUG] Starting comprehensive user status check for:",
      userId
    );

    // ✅ Get user from currentUser() which is more reliable than getUser()
    const clerkCurrentUser = await currentUser();
    console.log("🔍 [DEBUG] Current user from Clerk:", {
      id: clerkCurrentUser?.id,
      email: clerkCurrentUser?.primaryEmailAddress?.emailAddress,
    });

    // ✅ Get Clerk client safely
    const clerk = getClerkClient();
    if (!clerk) {
      console.error("❌ Clerk client is not available");
      return NextResponse.json(
        { error: "Authentication service unavailable" },
        { status: 500 }
      );
    }

    // Initialize response data
    const debugData = {
      timestamp: new Date().toISOString(),
      userId,
      clerkData: null as any,
      clerkOrganizations: [] as Array<{
        id: string;
        name: string;
        slug: string;
        role: string;
        createdAt: number;
      }>,
      clerkError: null as string | null,
      databaseUser: null as {
        id: string;
        email: string;
        hasCompletedOrgSetup: boolean;
        createdAt: Date | null;
        updatedAt: Date | null;
      } | null,
      databaseOrganizations: [] as Array<{
        id: string;
        name: string;
        slug: string;
        role: string;
        joinedAt: Date;
      }>,
      databaseError: null as string | null,
      subscriptions: [] as Array<{
        id: number;
        planType: string;
        status: string;
        isTrialActive: boolean;
        organizationId: string | null;
        organizationName: string | null;
        createdAt: Date;
        paymentCount: number;
      }>,
      subscriptionError: null as string | null,
      adminStatus: {
        isAdmin: false,
        email: null as string | null,
        adminEmails: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "not_set",
      },
      syncStatus: {
        clerkUserExists: false,
        clerkHasOrgs: false,
        databaseUserExists: false,
        databaseHasOrgs: false,
        hasActiveSubscription: false,
        subscriptionLinkedToOrg: false,
      },
      recommendations: [] as string[],
    };

    // 1. Get user data from currentUser() first (more reliable)
    if (clerkCurrentUser) {
      debugData.clerkData = {
        id: clerkCurrentUser.id,
        email: clerkCurrentUser.primaryEmailAddress?.emailAddress,
        firstName: clerkCurrentUser.firstName,
        lastName: clerkCurrentUser.lastName,
        createdAt: clerkCurrentUser.createdAt,
      };
      debugData.syncStatus.clerkUserExists = true;
      debugData.adminStatus.email =
        clerkCurrentUser.primaryEmailAddress?.emailAddress ?? null;

      if (debugData.adminStatus.email) {
        debugData.adminStatus.isAdmin = isSuperAdmin(
          debugData.adminStatus.email
        );
        console.log("🔍 [DEBUG] Super admin check result:", {
          email: debugData.adminStatus.email,
          isAdmin: debugData.adminStatus.isAdmin,
          superAdminEmails: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS,
        });
      }
    } else {
      console.error("❌ [DEBUG] currentUser() returned null");
      debugData.clerkError = "currentUser() returned null";
    }

    // 2. Fetch organization memberships from Clerk (with error handling)
    try {
      if (debugData.clerkData && clerk) {
        const orgMemberships = await clerk.users.getOrganizationMembershipList({
          userId,
          limit: 50,
        });

        debugData.clerkOrganizations = orgMemberships.data.map(
          (membership) => ({
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
            role: membership.role,
            createdAt: membership.createdAt,
          })
        );
        debugData.syncStatus.clerkHasOrgs =
          debugData.clerkOrganizations.length > 0;
      } else {
        console.log(
          "🔄 [DEBUG] Skipping org membership fetch - no Clerk client or user data"
        );
        debugData.syncStatus.clerkHasOrgs = false;
      }
    } catch (error) {
      console.error("❌ [DEBUG] Clerk organizations fetch error:", error);
      debugData.clerkError =
        debugData.clerkError ||
        (error instanceof Error ? error.message : "Unknown error");
      debugData.syncStatus.clerkHasOrgs = false;
    }

    // 3. Fetch user data from database (with correct relationship name)
    try {
      const databaseUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            // ✅ Use correct field name from schema
            include: {
              organization: true,
            },
          },
        },
      });

      if (databaseUser) {
        debugData.databaseUser = {
          id: databaseUser.id,
          email: databaseUser.email,
          hasCompletedOrgSetup: databaseUser.hasCompletedOrgSetup,
          createdAt: databaseUser.createdAt,
          updatedAt: databaseUser.updatedAt,
        };
        debugData.syncStatus.databaseUserExists = true;

        // Map organization memberships
        debugData.databaseOrganizations = databaseUser.memberships.map(
          (membership) => ({
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
            role: membership.role,
            joinedAt: membership.createdAt,
          })
        );
        debugData.syncStatus.databaseHasOrgs =
          debugData.databaseOrganizations.length > 0;
      }
    } catch (error) {
      console.error("❌ [DEBUG] Database user fetch error:", error);
      debugData.databaseError =
        error instanceof Error ? error.message : "Unknown error";
    }

    // 4. Check subscriptions
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        include: {
          organization: true,
          paymentTransactions: true,
        },
        orderBy: { createdAt: "desc" },
      });

      debugData.subscriptions = subscriptions.map((sub) => ({
        id: sub.id,
        planType: sub.planType,
        status: sub.status,
        isTrialActive: sub.isTrialActive,
        organizationId: sub.orgId,
        organizationName: sub.organization?.name || null,
        createdAt: sub.createdAt,
        paymentCount: sub.paymentTransactions.length,
      }));

      // Check for active subscription
      const activeSubscription = subscriptions.find(
        (sub) => sub.status === "ACTIVE"
      );
      debugData.syncStatus.hasActiveSubscription = !!activeSubscription;

      if (activeSubscription) {
        debugData.syncStatus.subscriptionLinkedToOrg = !!activeSubscription.orgId;
      }

      // Compute cancellation data from most recent subscription with CANCELED
      const cancelled = subscriptions.find((s) => s.status === "CANCELED");
      let cancellationInfo: any = null;
      if (cancelled) {
        const endsAt = cancelled.endDate ?? null;
        let daysRemaining: number | null = null;
        if (endsAt) {
          const diffMs = new Date(endsAt as unknown as string).getTime() - Date.now();
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }
        cancellationInfo = {
          isCancelled: true,
          endsAt,
          daysRemaining,
          subscriptionId: cancelled.id,
          orgId: cancelled.orgId,
        };
      }
      (debugData as any).cancellation = cancellationInfo;
    } catch (error) {
      console.error("❌ [DEBUG] Subscription fetch error:", error);
      debugData.subscriptionError =
        error instanceof Error ? error.message : "Unknown error";
    }

    // 5. Generate recommendations based on sync status
    const recommendations = [];

    if (!debugData.syncStatus.clerkUserExists) {
      recommendations.push(
        "❌ Clerk user data is missing - auth may be broken"
      );
    }

    if (!debugData.syncStatus.databaseUserExists) {
      recommendations.push(
        "⚠️ Database user record is missing - webhooks may not be working"
      );
    }

    if (
      debugData.syncStatus.clerkHasOrgs &&
      !debugData.syncStatus.databaseHasOrgs
    ) {
      recommendations.push(
        "🔄 Organizations exist in Clerk but not in database - sync needed"
      );
    }

    if (
      !debugData.syncStatus.clerkHasOrgs &&
      debugData.syncStatus.databaseHasOrgs
    ) {
      recommendations.push(
        "🔄 Organizations exist in database but not in Clerk - cleanup needed"
      );
    }

    if (
      debugData.syncStatus.hasActiveSubscription &&
      !debugData.syncStatus.subscriptionLinkedToOrg
    ) {
      recommendations.push(
        "🔗 Active subscription exists but not linked to organization"
      );
    }

    if (
      !debugData.syncStatus.hasActiveSubscription &&
      debugData.syncStatus.clerkHasOrgs
    ) {
      recommendations.push(
        "💳 User has organizations but no active subscription"
      );
    }

    debugData.recommendations = recommendations;

    // 6. Create final response based on current state
    const dbHasOrganizations = debugData.databaseOrganizations.length > 0;
    const hasOrganization = dbHasOrganizations; // ✅ Only trust DB for org presence
    const hasActiveSubscription = debugData.syncStatus.hasActiveSubscription;
    const needsOnboarding = hasActiveSubscription && !hasOrganization;

    console.log("✅ [DEBUG] Comprehensive status check completed:", {
      clerkOrgs: debugData.clerkOrganizations.length,
      dbOrgs: debugData.databaseOrganizations.length,
      subscriptions: debugData.subscriptions.length,
      isAdmin: debugData.adminStatus.isAdmin,
      recommendations: recommendations.length,
    });

    // Resolve organization activity status
    const orgIdResolved = debugData.clerkOrganizations[0]?.id || null;
    let orgIsActive: boolean | null = null;
    if (orgIdResolved) {
      try {
        const org = await prisma.organization.findUnique({ where: { id: orgIdResolved }, select: { isActive: true } });
        orgIsActive = org?.isActive ?? null;
      } catch (e) {
        orgIsActive = null;
      }
    }

    return NextResponse.json({
      hasActiveSubscription,
      hasOrganization,
      hasCompletedOnboarding: hasOrganization, // If they have org in DB, onboarding is complete
      needsOnboarding,
      subscription:
        debugData.subscriptions.find((sub) => sub.status === "ACTIVE") || null,
      organizationId: orgIdResolved,
      orgIsActive,
      cancellation: (debugData as any).cancellation || null,
      isAdmin: debugData.adminStatus.isAdmin,
      isSuperAdmin: debugData.adminStatus.isAdmin,
      // ✅ New flags for middleware/clients to make stricter decisions
      dbUserExists: debugData.syncStatus.databaseUserExists,
      dbHasOrganizations: dbHasOrganizations,
      clerkHasOrganizations: debugData.syncStatus.clerkHasOrgs,
      debug: debugData,
    });
  } catch (error) {
    console.error("❌ [DEBUG] Comprehensive status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check user status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
