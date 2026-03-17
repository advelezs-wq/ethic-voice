import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      subscriptionId,
      providerSubscriptionId,
      amount,
      currency = "COP",
    }: {
      subscriptionId?: number | string;
      providerSubscriptionId?: string;
      amount: number;
      currency?: string;
    } = body || {};

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

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


