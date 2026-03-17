import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { SubscriptionStatus, BillingCycle } from "@prisma/client";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await currentUser();
  const email = me?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subscriptionId } = await req.json();
  if (!subscriptionId) return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });

  const sub = await prisma.subscription.findUnique({ where: { id: Number(subscriptionId) } });
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  // Cancel in provider (Mercado Pago)
  if (sub.providerSubscriptionId && mercadoPagoService.isConfigured()) {
    try {
      await mercadoPagoService.updatePreapproval(String(sub.providerSubscriptionId), { status: "cancelled" });
    } catch (e) {
      console.warn("⚠️ [SUPERADMIN] Failed to cancel MP preapproval", e);
    }
  }

  // Compute end-of-period date
  let endDate = new Date();
  try {
    if (sub.providerSubscriptionId) {
      const pre = await mercadoPagoService.getPreapproval(String(sub.providerSubscriptionId));
      const next = pre?.next_payment_date || pre?.auto_recurring?.next_payment_date;
      if (next) endDate = new Date(next);
    }
    if (!endDate || Number.isNaN(endDate.getTime())) {
      const start = new Date(sub.startDate);
      const stepMonths = sub.billingCycle === ("YEARLY" as BillingCycle) ? 12 : 1;
      const cursor = new Date(start);
      while (cursor.getTime() <= Date.now()) cursor.setMonth(cursor.getMonth() + stepMonths);
      endDate = cursor;
    }
  } catch {
    const d = new Date();
    if (sub.billingCycle === ("YEARLY" as BillingCycle)) d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    endDate = d;
  }

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: SubscriptionStatus.CANCELED,
      endDate,
      updatedAt: new Date(),
    },
  });

  if (sub.orgId) {
    await prisma.organization.update({
      where: { id: sub.orgId },
      data: {
        hasActivePlan: true,
        planExpiresAt: endDate,
        subscriptionSetupCompleted: false,
      },
    });
  }

  return NextResponse.json({ success: true, subscription: updated });
}


