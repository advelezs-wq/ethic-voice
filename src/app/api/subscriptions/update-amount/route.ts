import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      subscriptionId,
      providerSubscriptionId,
    }: {
      subscriptionId?: number | string;
      providerSubscriptionId?: string;
    } = body || {};

    // Resolve subscription
    let sub = null as any;
    if (subscriptionId) {
      sub = await prisma.subscription.findUnique({
        where: { id: Number(subscriptionId) },
      });
    } else if (providerSubscriptionId) {
      sub = await prisma.subscription.findFirst({
        where: { providerSubscriptionId },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

    // Verify permissions: owner or org admin
    if (sub.userId !== userId) {
      if (sub.orgId) {
        const membership = await prisma.organizationMembership.findFirst({
          where: { userId, orgId: sub.orgId, role: "ADMIN" },
        });
        if (!membership)
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!sub.providerSubscriptionId) {
      return NextResponse.json(
        { error: "No provider subscription linked" },
        { status: 400 }
      );
    }

    // SECURITY: the recurring amount is ALWAYS resolved server-side from PLAN_CONFIGS for the
    // subscription's own planType/billingCycle — never from the client. Trusting a client-supplied
    // amount let the subscription owner drop their own recurring charge to any value (e.g. 1 COP)
    // while keeping full access to their plan's features, since feature gating is keyed on
    // planType, not on what MercadoPago is actually charging.
    const planConfig = PLAN_CONFIGS[sub.planType as PlanType];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }
    const currency = planConfig.price.currency;
    const amount =
      sub.billingCycle === "YEARLY"
        ? planConfig.price.yearly
        : planConfig.price.monthly;
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Price not available for this plan/billing cycle" },
        { status: 400 }
      );
    }

    // Update amount in Mercado Pago preapproval (no-plan flow)
    const updated = await mercadoPagoService.updatePreapproval(
      sub.providerSubscriptionId,
      {
        auto_recurring: {
          transaction_amount: Number(amount),
          currency_id: currency,
        },
      }
    );

    if (!updated.success) {
      return NextResponse.json(
        { error: "Failed to update provider subscription" },
        { status: 502 }
      );
    }

    // Sync local price to keep UI consistent
    const data: any = {};
    if (sub.billingCycle === "YEARLY") data.yearlyPrice = Number(amount);
    else data.monthlyPrice = Number(amount);
    const saved = await prisma.subscription.update({
      where: { id: sub.id },
      data,
    });

    return NextResponse.json({ success: true, subscription: saved });
  } catch (err) {
    console.error("❌ update-amount error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}


