import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { PLAN_CONFIGS } from "@/types/subscription.types";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId, organizationId } = await req.json();

    if (!subscriptionId || !organizationId) {
      return NextResponse.json(
        { error: "Missing subscriptionId or organizationId" },
        { status: 400 }
      );
    }

    console.log("🔗 Linking subscription to organization:", {
      subscriptionId,
      organizationId,
      userId,
    });

    // Find the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Verify the subscription belongs to the user
    if (subscription.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - subscription does not belong to user" },
        { status: 403 }
      );
    }

    // Check if subscription is already linked to another organization
    if (subscription.orgId && subscription.orgId !== organizationId) {
      return NextResponse.json(
        { error: "Subscription is already linked to another organization" },
        { status: 409 }
      );
    }

    // Get plan configuration
    const planConfig = PLAN_CONFIGS[subscription.planType];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // Update subscription with organization ID
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        orgId: organizationId,
      },
    });

    // Create payment transaction from pending payment data if exists and subscription is ACTIVE
    if (updatedSubscription.status === "ACTIVE") {
      const existingTransaction = await prisma.paymentTransaction.findFirst({
        where: {
          subscriptionId: updatedSubscription.id,
        },
      });

      if (!existingTransaction && updatedSubscription.metadata) {
        const metadata = updatedSubscription.metadata as any;
        const pendingPayment = metadata.pendingPayment;

        if (pendingPayment) {
          console.log("💾 Creating payment transaction from stored pending payment data");
          
          try {
            await prisma.paymentTransaction.create({
              data: {
                orgId: organizationId,
                subscriptionId: updatedSubscription.id,
                userId: userId,
                amount: Number(pendingPayment.amount),
                currency: pendingPayment.currency,
                status: pendingPayment.status,
                providerTransactionId: pendingPayment.paymentId,
                gateway: "REBILL",
                // No metadata field in PaymentTransaction schema
              },
            });

            // Remove pending payment from metadata since it's now recorded
            await prisma.subscription.update({
              where: { id: updatedSubscription.id },
              data: {
                metadata: {
                  ...metadata,
                  pendingPayment: undefined, // Remove pending payment
                  paymentProcessed: true,
                  transactionCreatedAt: new Date().toISOString(),
                },
              },
            });

            console.log("✅ Payment transaction created from pending payment data");
          } catch (error) {
            console.error("❌ Failed to create payment transaction during linking:", error);
          }
        }
      }
    }

    // Update organization with plan features
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        currentPlan: subscription.planType,
        hasActivePlan: subscription.status === "ACTIVE",
        isEmailChannelActive: subscription.hasEmailChannel,
        isAiProcessingActive: subscription.hasAiProcessing,
        isChatbotActive: subscription.hasChatbotChannel,
        isPhoneChannelActive: subscription.hasPhoneChannel,
        currentUsers: subscription.maxUsers,
        currentInvestigators: subscription.maxInvestigators,
        subscriptionSetupCompleted: true,
      },
    });

    // Create organization settings if they don't exist
    const existingSettings = await prisma.organizationSettings.findUnique({
      where: { organizationId },
    });

    if (!existingSettings) {
      await prisma.organizationSettings.create({
        data: {
          organizationId,
          theme: "default",
          primaryColor: "#0066CC",
          secondaryColor: "#4A90E2",
          accentColor: "#E3F2FD",
          backgroundColor: "#F8FAFC",
          isActive: true,
        },
      });
    }

    console.log("✅ Subscription linked successfully:", {
      subscriptionId,
      organizationId,
      planType: subscription.planType,
      status: subscription.status,
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      planName: planConfig.displayName,
      message: `Successfully activated ${planConfig.displayName} for your organization`,
    });
  } catch (error) {
    console.error("❌ Error linking subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
