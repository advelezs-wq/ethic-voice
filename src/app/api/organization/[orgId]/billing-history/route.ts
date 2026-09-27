import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

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

    // Without this, any signed-in user could read any org's payment
    // transaction history (amounts, dates) by orgId alone. Superadmin
    // bypass: this is also called from the superadmin org-detail panel.
    const [requesterMembership, requesterClerkUser] = await Promise.all([
      prisma.organizationMembership.findUnique({
        where: { userId_orgId: { userId, orgId } },
      }),
      currentUser(),
    ]);
    const requesterEmail = requesterClerkUser?.primaryEmailAddress?.emailAddress;
    const requesterIsSuperAdmin = Boolean(requesterEmail && isSuperAdmin(requesterEmail));
    if (!requesterMembership && !requesterIsSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Historial = cobros registrados (Wompi y manuales).
    const payments = await prisma.paymentTransaction.findMany({
      where: { orgId },
      orderBy: { transactionDate: "desc" },
      take: 50,
      include: { subscription: { select: { planName: true, billingCycle: true } } },
    });
    const STATUS: Record<string, string> = { SUCCEEDED: "paid", PENDING: "pending", FAILED: "failed", REFUNDED: "refunded" };
    const invoices = payments.map((p) => ({
      id: p.id,
      createdAt: p.transactionDate,
      description: p.subscription
        ? `${p.subscription.planName} · ${p.subscription.billingCycle === "YEARLY" ? "anual" : "mensual"}`
        : "Pago",
      amount: Number(p.amount),
      currency: p.currency,
      status: STATUS[p.status] ?? p.status.toLowerCase(),
      gateway: p.gateway,
      reference: p.providerTransactionId,
    }));

    return NextResponse.json({ invoices, total: invoices.length });
  } catch (error) {
    console.error("❌ [BILLING-HISTORY] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatAmount(amount: number, currency: string): string {
  if (currency === "COP") {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  } else {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }
}
