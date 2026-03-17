import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
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

  // Fetch subscription to get provider id
  const sub = await prisma.subscription.findUnique({ where: { id: Number(subscriptionId) } });
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  // Pause at provider (Mercado Pago) if configured and we have a preapproval id
  if (sub.providerSubscriptionId && mercadoPagoService.isConfigured()) {
    try {
      await mercadoPagoService.updatePreapproval(String(sub.providerSubscriptionId), { status: "paused" });
    } catch (e) {
      // Log and continue; we still pause locally
      console.warn("⚠️ [SUPERADMIN] Failed to pause MP preapproval", e);
    }
  }

  const updated = await prisma.subscription.update({
    where: { id: Number(subscriptionId) },
    data: { status: SubscriptionStatus.INACTIVE },
  });
  return NextResponse.json({ success: true, subscription: updated });
}


