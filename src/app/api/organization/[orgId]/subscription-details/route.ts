import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import rebillService from "@/modules/app/services/rebill.service";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    console.log(
      "📊 [SUBSCRIPTION-DETAILS] Getting subscription details for org:",
      orgId
    );

    // Get organization with active subscription
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
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const activeSubscription = organization.subscriptions[0];

    if (!activeSubscription) {
      console.log("ℹ️ [SUBSCRIPTION-DETAILS] No active subscription found");
      return NextResponse.json({
        subscription: null,
        message: "No active subscription found",
      });
    }

    // Get additional subscription details from Rebill if possible
    let rebillSubscriptionData = null;
    if (activeSubscription.providerSubscriptionId) {
      try {
        rebillSubscriptionData = await rebillService.getSubscriptionStatus(
          activeSubscription.providerSubscriptionId
        );
        console.log("✅ [SUBSCRIPTION-DETAILS] Got Rebill subscription data");
      } catch (error) {
        console.log(
          "⚠️ [SUBSCRIPTION-DETAILS] Could not fetch Rebill data:",
          error
        );
        // Continue without Rebill data
      }
    }

    // Calculate trial info
    const isTrialActive = activeSubscription.isTrialActive || false;
    let trialDaysRemaining = 0;

    if (isTrialActive && activeSubscription.trialDays) {
      const trialStartDate = new Date(activeSubscription.startDate);
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setDate(
        trialStartDate.getDate() + activeSubscription.trialDays
      );

      const now = new Date();
      const timeDiff = trialEndDate.getTime() - now.getTime();
      trialDaysRemaining = Math.max(
        0,
        Math.ceil(timeDiff / (1000 * 3600 * 24))
      );
    }

    // Compute safe prices with fallback to plan config when DB fields are missing
    const planCfg = PLAN_CONFIGS[activeSubscription.planType as PlanType];
    const monthlyPrice =
      activeSubscription.monthlyPrice != null
        ? Number(activeSubscription.monthlyPrice)
        : Number(planCfg?.price?.monthly || 0);
    const yearlyPrice =
      activeSubscription.yearlyPrice != null
        ? Number(activeSubscription.yearlyPrice)
        : Number(planCfg?.price?.yearly || 0);

    // Normalize limits against current plan configuration
    const normalizeLimit = (value: number | null | undefined, cfg: number) => {
      if (cfg === -1) return -1; // Unlimited per plan config
      if (typeof value !== "number" || value <= 0) return cfg;
      if (value === -1) return cfg; // Normalize legacy unlimited to current config
      return Math.max(value, cfg);
    };

    const effectiveMaxUsers = normalizeLimit(
      (activeSubscription as any).maxUsers,
      planCfg?.features?.maxUsers ?? 1
    );
    const effectiveMaxInvestigators = normalizeLimit(
      (activeSubscription as any).maxInvestigators,
      planCfg?.features?.maxInvestigators ?? 4
    );
    const effectiveMaxEmployees = normalizeLimit(
      (activeSubscription as any).maxEmployees,
      planCfg?.features?.maxEmployees ?? 50
    );

    // Prepare subscription details
    const subscriptionDetails = {
      id: activeSubscription.id,
      planType: activeSubscription.planType,
      planName: activeSubscription.planName || activeSubscription.planType,
      status: activeSubscription.status,
      startDate: activeSubscription.startDate.toISOString(),
      endDate: activeSubscription.endDate?.toISOString(),
      monthlyPrice: String(monthlyPrice || 0),
      yearlyPrice: yearlyPrice ? String(yearlyPrice) : undefined,
      billingCycle: activeSubscription.billingCycle,
      currency: activeSubscription.currency || "COP",
      isTrialActive,
      trialDaysRemaining: isTrialActive ? trialDaysRemaining : undefined,
      nextChargeDate:
        rebillSubscriptionData?.nextChargeDate ||
        activeSubscription.endDate?.toISOString(),
      providerSubscriptionId: activeSubscription.providerSubscriptionId,

      // Plan features
      hasEmailChannel: activeSubscription.hasEmailChannel,
      hasAiProcessing: activeSubscription.hasAiProcessing,
      hasChatbotChannel: activeSubscription.hasChatbotChannel,
      hasPhoneChannel: activeSubscription.hasPhoneChannel,
      hasAdvancedAnalytics: activeSubscription.hasAdvancedAnalytics,
      hasColorThemes: activeSubscription.hasColorThemes,
      hasCustomization: activeSubscription.hasCustomization,
      hasBilingualSupport: activeSubscription.hasBilingualSupport,
      hasExternalManager: activeSubscription.hasExternalManager,
      hasUnlimitedUsers: activeSubscription.hasUnlimitedUsers,

      // Limits (normalized)
      maxUsers: effectiveMaxUsers,
      maxInvestigators: effectiveMaxInvestigators,
      maxEmployees: effectiveMaxEmployees,

      // Additional info from organization
      organizationName: organization.name,
      organizationCurrentPlan: organization.currentPlan,
      organizationHasActivePlan: organization.hasActivePlan,

      // Rebill data if available
      rebillStatus: rebillSubscriptionData?.status,
      rebillNextCharge: rebillSubscriptionData?.nextChargeDate,
      rebillCustomerId: rebillSubscriptionData?.customerId,
    };

    console.log("✅ [SUBSCRIPTION-DETAILS] Returning subscription details:", {
      subscriptionId: subscriptionDetails.id,
      planType: subscriptionDetails.planType,
      status: subscriptionDetails.status,
      hasRebillData: !!rebillSubscriptionData,
    });

    return NextResponse.json({
      success: true,
      subscription: subscriptionDetails,
    });
  } catch (error) {
    console.error("❌ [SUBSCRIPTION-DETAILS] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
