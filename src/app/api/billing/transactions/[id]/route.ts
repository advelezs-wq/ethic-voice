import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { refreshTransaction } from "@/modules/app/services/billing.service";
import { billingError, billingUser } from "@/modules/app/services/billing-auth";

/** Estado de un cobro (el checkout lo consulta hasta que Wompi responde). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await billingUser();
  if (!user) return NextResponse.json({ error: "Sesión no iniciada" }, { status: 401 });
  const { id } = await params;
  const pt = await prisma.paymentTransaction.findFirst({ where: { providerTransactionId: id, gateway: "WOMPI" } });
  if (!pt) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  const member = await prisma.organizationMembership.findUnique({ where: { userId_orgId: { userId: user.userId, orgId: pt.orgId } } });
  if (!member) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  try {
    if (pt.status === "PENDING") await refreshTransaction(id);
    const fresh = await prisma.paymentTransaction.findUniqueOrThrow({ where: { id: pt.id }, include: { subscription: { select: { status: true, metadata: true } } } });
    const meta = (fresh.subscription?.metadata as Record<string, unknown> | null) ?? {};
    return NextResponse.json({
      status: fresh.status === "SUCCEEDED" ? "APPROVED" : fresh.status === "FAILED" ? "DECLINED" : "PENDING",
      subscriptionStatus: fresh.subscription?.status ?? null,
      reason: fresh.status === "FAILED" ? (meta.lastError as string) || "El pago no fue aprobado." : null,
      organizationId: fresh.orgId,
    });
  } catch (e) {
    return billingError(e);
  }
}
