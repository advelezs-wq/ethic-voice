import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import {
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
} from "@/types/subscription.types";
import rebillService from "@/modules/app/services/rebill.service";

interface CreateSubscriptionRequest {
  planType: PlanType;
  billingCycle: BillingCycle;
  returnUrl?: string;
  upgradeFrom?: PlanType;
  customerData: {
    name: string;
    email: string;
    phone?: string;
    document: {
      type: "CC" | "NIT" | "CE" | "PP";
      number: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateSubscriptionRequest = await req.json();
    const {
      planType,
      billingCycle = "MONTHLY",
      returnUrl,
      customerData,
    } = body;

    if (!planType) {
      return NextResponse.json(
        { error: "Plan type is required" },
        { status: 400 }
      );
    }

    if (!customerData) {
      return NextResponse.json(
        { error: "Customer data is required" },
        { status: 400 }
      );
    }

    // Get plan configuration
    const planConfig = PLAN_CONFIGS[planType as PlanType];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    console.log("🔄 Creating subscription with Rebill plan for user:", {
      userId,
      planType,
      billingCycle,
      customerEmail: customerData.email,
    });

    // Check for existing active subscriptions
    const existingSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if user already has the same plan in active status
    const samePlanSubscription = existingSubscriptions.find(
      (sub) =>
        sub.status === "ACTIVE" &&
        sub.planType === planType &&
        sub.billingCycle === billingCycle
    );

    if (samePlanSubscription) {
      console.log("✅ User already has active subscription for this plan");
      return NextResponse.json({
        success: true,
        subscription: {
          id: samePlanSubscription.id,
          status: samePlanSubscription.status,
          planType: samePlanSubscription.planType,
          returnUrl: returnUrl || "/app",
        },
        message: "User already has an active subscription for this plan",
      });
    }

    // Get price
    const price =
      billingCycle === "YEARLY"
        ? planConfig.price.yearly
        : planConfig.price.monthly;

    if (!price) {
      return NextResponse.json(
        { error: "Price not available for selected billing cycle" },
        { status: 400 }
      );
    }

    // ✅ Create internal subscription record first (TRIALING until payment confirmed)
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planType,
        planName: planConfig.name,
        status: "TRIALING", // Will be updated to ACTIVE via webhook
        billingCycle: billingCycle as BillingCycle,
        startDate: new Date(),
        monthlyPrice: billingCycle === "MONTHLY" ? price : null,
        yearlyPrice: billingCycle === "YEARLY" ? price : null,
        currency: planConfig.price.currency,
        trialDays: null,
        isTrialActive: false,
        // Plan features
        hasEmailChannel: planConfig.features.hasEmailChannel,
        hasAiProcessing: planConfig.features.hasAiProcessing,
        hasChatbotChannel: planConfig.features.hasChatbotChannel,
        hasPhoneChannel: planConfig.features.hasPhoneChannel,
        maxUsers: planConfig.features.maxUsers || 1,
        maxInvestigators: planConfig.features.maxInvestigators || 5,
        maxEmployees: planConfig.features.maxEmployees || 50,
        hasExternalManager: planConfig.features.hasExternalManager || false,
        hasBilingualSupport: planConfig.features.hasBilingualSupport || false,
        hasUnlimitedUsers: planConfig.features.hasUnlimitedUsers || false,
        hasAdvancedAnalytics: planConfig.features.hasAdvancedAnalytics || false,
        hasCustomization: planConfig.features.hasCustomization || false,
        hasColorThemes: planConfig.features.hasColorThemes || false,
        hasUnlimitedCustomization:
          planConfig.features.hasUnlimitedCustomization || false,
        metadata: {
          returnUrl: returnUrl || "/app",
          activationReason: "Pending payment confirmation",
          createdAt: new Date().toISOString(),
        },
      },
    });

    console.log("✅ Internal subscription created:", {
      id: subscription.id,
      status: subscription.status,
      planType: subscription.planType,
    });

    try {
      // ✅ Get Rebill plan ID and create checkout session
      const planId = rebillService.getPlanId(planType, billingCycle);

      console.log("🔍 Using Rebill plan ID:", planId);

      // Create checkout session using Rebill's corrected API
      const subscriptionResponse = await rebillService.createCheckoutSession({
        planId: planId,
        customerData: {
          firstName: customerData.name.split(" ")[0] || customerData.name,
          lastName: customerData.name.split(" ").slice(1).join(" ") || "",
          email: customerData.email,
          phone: customerData.phone,
          document: customerData.document,
        },
        metadata: {
          internalSubscriptionId: subscription.id.toString(),
          userId: userId,
          planType,
          billingCycle,
        },
        returnUrl: returnUrl || "/app",
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/rebill`,
      });

      if (subscriptionResponse.success && subscriptionResponse.paymentUrl) {
        // Update subscription with Rebill data
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            providerSubscriptionId: subscriptionResponse.subscriptionId,
            metadata: {
              ...((subscription.metadata as Record<string, unknown> | null) ?? {}),
              rebillSubscriptionId: subscriptionResponse.subscriptionId,
              paymentUrl: subscriptionResponse.paymentUrl,
              activationReason: "Awaiting payment via Rebill checkout session",
              updatedAt: new Date().toISOString(),
            },
          },
        });

        console.log("✅ Rebill checkout session created successfully:", {
          subscriptionId: subscription.id,
          rebillSubscriptionId: subscriptionResponse.subscriptionId,
          paymentUrl: subscriptionResponse.paymentUrl,
        });

        return NextResponse.json({
          success: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            planType: subscription.planType,
            paymentUrl: subscriptionResponse.paymentUrl,
            returnUrl: returnUrl || "/app",
          },
          redirect: {
            url: subscriptionResponse.paymentUrl,
            external: true,
          },
        });
      } else {
        console.error(
          "❌ Failed to create Rebill checkout session:",
          subscriptionResponse.error
        );

        // Delete the subscription if checkout session creation failed
        await prisma.subscription.delete({
          where: { id: subscription.id },
        });

        return NextResponse.json(
          {
            error: "Failed to create payment subscription",
            details: subscriptionResponse.error,
          },
          { status: 500 }
        );
      }
    } catch (rebillError) {
      console.error("❌ Rebill integration error:", rebillError);

      // Delete the subscription if Rebill failed
      await prisma.subscription.delete({
        where: { id: subscription.id },
      });

      // Check if it's a plan ID error
      if (
        rebillError instanceof Error &&
        rebillError.message.includes("Plan ID not found")
      ) {
        return NextResponse.json(
          {
            error: "Plan configuration incomplete",
            details:
              "Please run the create-rebill-plans script to set up Rebill plans first.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Payment system unavailable",
          details:
            rebillError instanceof Error
              ? rebillError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
