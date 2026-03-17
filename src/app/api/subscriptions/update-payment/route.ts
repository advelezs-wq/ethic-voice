import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";

interface UpdatePaymentRequest {
  subscriptionId?: number;
  paymentData?: any;
  status?: "ACTIVE" | "CANCELED" | "PAST_DUE";
  action?: "reactivate";
  organizationId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId: bodySubscriptionId, paymentData, status, action, organizationId }: UpdatePaymentRequest =
      await req.json();

    const { userId } = await auth();

    console.log("🔄 Updating subscription payment status:", {
      subscriptionId: bodySubscriptionId,
      status,
      paymentId: paymentData?.id,
      action,
      organizationId,
    });

    // Handle reactivation flow (no immediate charge)
    if (action === "reactivate") {
      // Resolve target subscription
      let target = null as any;
      if (bodySubscriptionId) {
        target = await prisma.subscription.findUnique({ where: { id: bodySubscriptionId } });
      } else if (organizationId) {
        target = await prisma.subscription.findFirst({
          where: { orgId: organizationId },
          orderBy: { updatedAt: "desc" },
        });
      } else if (userId) {
        target = await prisma.subscription.findFirst({
          where: { userId },
          orderBy: { updatedAt: "desc" },
        });
      }

      if (!target) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }

      let requiresAuthorization = false;
      let initPoint: string | undefined;

      // If we have a provider subscription, check its status
      if (target.providerSubscriptionId) {
        try {
          const pre = await mercadoPagoService.getPreapproval(String(target.providerSubscriptionId));
          const providerStatus = pre?.status as string | undefined;
          if (providerStatus === "paused") {
            await mercadoPagoService.updatePreapproval(String(target.providerSubscriptionId), { status: "authorized" });
          } else if (providerStatus === "cancelled") {
            // Need to create a new preapproval and send the user to authorize
            requiresAuthorization = true;
          }
        } catch (e) {
          console.warn("⚠️ Unable to read provider preapproval; proceeding to attempt reauthorization", e);
        }
      } else {
        // No provider subscription yet; need to authorize
        requiresAuthorization = true;
      }

      if (requiresAuthorization) {
        // Create a new preapproval for the same plan/cycle and return the init_point
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://www.ethicvoice.co";
        const usePlans = true; // default to plan-based reactivation when mapping exists
        try {
          if (usePlans) {
            const planId = mercadoPagoService.getPlanId(String(target.planType), String(target.billingCycle) as any);
            const payerEmail = String(
              (target as any)?.payerEmail ||
                (
                  await prisma.user.findUnique({
                    where: { id: target.userId || "" },
                    select: { email: true },
                  })
                )?.email ||
                ""
            );
            const created = await mercadoPagoService.createPreapproval({
              preapprovalPlanId: planId,
              payerEmail,
              backUrl: `${appUrl}/app/onboarding/payment-success`,
              externalReference: String(target.id),
              status: "pending",
            });
            if (created.success && created.id) {
              initPoint = created.initPoint;
              await prisma.subscription.update({
                where: { id: target.id },
                data: { providerSubscriptionId: created.id },
              });
            } else {
              // Fallback: build public subscription checkout URL without requiring card token
              const directUrl = `https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id=${encodeURIComponent(
                planId
              )}&back_url=${encodeURIComponent(`${appUrl}/app/onboarding/payment-success`)}&external_reference=${encodeURIComponent(
                String(target.id)
              )}&auto_return=approved`;
              initPoint = directUrl;
            }
          }
        } catch (e: any) {
          console.warn("⚠️ Reactivation authorization via API failed, using public checkout URL fallback", e?.message || e);
          try {
            const planId = mercadoPagoService.getPlanId(String(target.planType), String(target.billingCycle) as any);
            initPoint = `https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id=${encodeURIComponent(
              planId
            )}&back_url=${encodeURIComponent(`${appUrl}/app/onboarding/payment-success`)}&external_reference=${encodeURIComponent(
              String(target.id)
            )}&auto_return=approved`;
          } catch (e2) {
            console.error("❌ Reactivation fallback URL build failed", e2);
            return NextResponse.json({ error: "Failed to initiate reactivation authorization" }, { status: 500 });
          }
        }
      }

      const updated = await prisma.subscription.update({
        where: { id: target.id },
        data: {
          status: "ACTIVE",
          metadata: {
            ...(target.metadata as Record<string, unknown>),
            reactivatedAt: new Date().toISOString(),
            reactivation: {
              requiresAuthorization,
            },
          },
        },
      });

      if (updated.orgId) {
        await prisma.organization.update({
          where: { id: updated.orgId },
          data: { planExpiresAt: null },
        });
      }

      return NextResponse.json({ success: true, subscription: updated, requiresAuthorization, url: initPoint });
    }

    // Update subscription with payment information
    if (!bodySubscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required when not using action=reactivate" },
        { status: 400 }
      );
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: bodySubscriptionId },
      data: {
        status: status || "ACTIVE",
        providerSubscriptionId: paymentData?.id || paymentData?.subscription_id,
        metadata: {
          ...((
            (await prisma.subscription.findUnique({
              where: { id: bodySubscriptionId },
            }))?.metadata as Record<string, unknown> | null
          ) ?? {}),
          paymentData,
          paidAt: new Date().toISOString(),
          rebillPaymentId: paymentData?.id,
        },
      },
    });

    console.log("✅ Subscription updated successfully:", {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      providerSubscriptionId: updatedSubscription.providerSubscriptionId,
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: "Payment status updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating subscription payment:", error);
    return NextResponse.json(
      {
        error: "Failed to update payment status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
