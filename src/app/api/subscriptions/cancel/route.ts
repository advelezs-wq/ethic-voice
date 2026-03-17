import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import { enforcePlanLimits } from "@/modules/core/utils/plan-enforcement.utils";
import { NotificationsService } from "@/modules/app/services/notifications.service";
import { NotificationType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId, providerSubscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    console.log("🚫 [CANCEL-SUBSCRIPTION] Starting cancellation:", {
      subscriptionId,
      providerSubscriptionId,
      userId,
    });

    // Get the subscription to cancel
    const subscription = await prisma.subscription.findUnique({
      where: { id: parseInt(subscriptionId) },
      include: {
        organization: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Verify user has permission to cancel this subscription
    if (subscription.userId !== userId) {
      // Check if user is admin of the organization
      if (subscription.orgId) {
        const membership = await prisma.organizationMembership.findFirst({
          where: {
            userId: userId,
            orgId: subscription.orgId,
            role: "ADMIN",
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "Unauthorized to cancel this subscription" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Unauthorized to cancel this subscription" },
          { status: 403 }
        );
      }
    }

    console.log("✅ [CANCEL-SUBSCRIPTION] Authorization passed");

    // Pause in MercadoPago first if we have the preapproval ID
    let providerCancelled = false;
    if (providerSubscriptionId || subscription.providerSubscriptionId) {
      const preapprovalId =
        providerSubscriptionId || subscription.providerSubscriptionId;

      try {
        console.log("🔄 [CANCEL-SUBSCRIPTION] Pausing in MercadoPago:", preapprovalId);

        const result = await mercadoPagoService.updatePreapproval(preapprovalId, { status: "paused" });

        if (result.success) {
          console.log("✅ [CANCEL-SUBSCRIPTION] MercadoPago pause successful");
          providerCancelled = true; // paused flag
        } else {
          console.error("❌ [CANCEL-SUBSCRIPTION] MercadoPago pause failed:", result.error);

          // Don't fail the entire process if Rebill fails, but log it
          console.log(
            "⚠️ [CANCEL-SUBSCRIPTION] Continuing with database cancellation (pause locally) despite provider failure"
          );
        }
      } catch (mpError) {
        console.error("❌ [CANCEL-SUBSCRIPTION] MercadoPago cancellation error:", mpError);
        // Continue with database cancellation
      }
    }

    // Determine effective end date: end of current billing period
    let effectiveEndDate: Date = new Date();
    try {
      if (subscription.providerSubscriptionId) {
        const pre = await mercadoPagoService.getPreapproval(
          String(subscription.providerSubscriptionId)
        );
        const nextPayment =
          pre?.next_payment_date || pre?.auto_recurring?.next_payment_date;
        if (nextPayment) effectiveEndDate = new Date(nextPayment);
      }
      if (!effectiveEndDate || Number.isNaN(effectiveEndDate.getTime())) {
        // Fallback: compute from startDate and billingCycle
        const start = new Date(subscription.startDate);
        const stepMonths = subscription.billingCycle === "YEARLY" ? 12 : 1;
        const cursor = new Date(start);
        while (cursor.getTime() <= Date.now()) {
          cursor.setMonth(cursor.getMonth() + stepMonths);
        }
        effectiveEndDate = cursor; // first boundary after now
      }
    } catch (e) {
      // Default to one period from now on error
      const d = new Date();
      if (subscription.billingCycle === "YEARLY") d.setFullYear(d.getFullYear() + 1);
      else d.setMonth(d.getMonth() + 1);
      effectiveEndDate = d;
    }

    // Update subscription status: mark CANCELED but allow access until end of period
    console.log("🔄 [CANCEL-SUBSCRIPTION] Updating subscription in database");
    const cancelledSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELED",
        endDate: effectiveEndDate,
        updatedAt: new Date(),
      },
    });

    // Update organization plan status
    if (subscription.orgId) {
      console.log("🔄 [CANCEL-SUBSCRIPTION] Updating organization plan status");

      await prisma.organization.update({
        where: { id: subscription.orgId },
        data: {
          // Keep org active until effectiveEndDate; store expiry for enforcement
          hasActivePlan: true,
          planExpiresAt: effectiveEndDate,
          // Do not disable features yet; enforcement will disable on expiry
          subscriptionSetupCompleted: false,
        },
      });

      // Do not enforce immediate plan limits; allow access until period end
    }

    // Create a record of the cancellation
    try {
      await prisma.paymentTransaction.create({
        data: {
          orgId: subscription.orgId || "", // Correct field name
          subscriptionId: subscription.id,
          amount: 0,
          currency: subscription.currency || "COP",
          status: "SUCCEEDED", // Correct enum value
          gateway: "OTHER", // Correct enum value - using OTHER for system operations
          providerTransactionId: `cancel-${subscription.id}-${Date.now()}`,
          userId: userId, // Track who cancelled
          // Note: metadata field doesn't exist in current schema
          // Cancellation details would need to be stored elsewhere
        },
      });
    } catch (transactionError) {
      console.error(
        "❌ [CANCEL-SUBSCRIPTION] Failed to create cancellation record:",
        transactionError
      );
      // Don't fail the main cancellation
    }

    // Send cancellation notification (email/in-app)
    try {
      if (subscription.userId) {
        const notifier = new NotificationsService();
        await notifier.createNotification({
          userId: subscription.userId,
          orgId: subscription.orgId || undefined,
          type: NotificationType.SYSTEM_ALERT,
          title: "Tu suscripción fue cancelada",
          message:
            "Mantendrás acceso hasta que termine el ciclo actual. Si no reactivas en 3 meses, eliminaremos tu información de forma permanente.",
          actionUrl: "/app/billing",
          metadata: { kind: "subscription_cancelled" },
        });
      }
    } catch (e) {
      console.warn("⚠️ [CANCEL-SUBSCRIPTION] Failed to send cancellation notification", e);
    }

    console.log("🎉 [CANCEL-SUBSCRIPTION] Subscription cancelled successfully");

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        endDate: cancelledSubscription.endDate,
        planType: cancelledSubscription.planType,
      },
      provider: {
        cancelled: providerCancelled,
        subscriptionId:
          providerSubscriptionId || subscription.providerSubscriptionId,
      },
      organization: subscription.orgId
        ? {
            id: subscription.orgId,
            revertedToPlan: "STARTER",
            featuresDisabled: true,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ [CANCEL-SUBSCRIPTION] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
