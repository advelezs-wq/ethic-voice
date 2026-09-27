import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/modules/core/utils/superadmin-guard";
import { applyPlan, ClientAdminError } from "@/modules/app/services/client-admin.service";
import { BillingCycle } from "@/types/subscription.types";

/**
 * Asigna un plan al cliente sin pasar por pago (contrato gestionado por el
 * equipo comercial). Si el cliente paga con tarjeta (Wompi), sus próximos
 * cobros usan el precio del nuevo plan.
 */
export async function POST(req: NextRequest, context: { params: Promise<{ orgId: string }> }) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;
  const { orgId } = await context.params;
  const body = await req.json().catch(() => ({}));
  try {
    const result = await applyPlan(orgId, body.planType, {
      actorUserId: guard.userId,
      billingCycle: body.billingCycle === "YEARLY" ? BillingCycle.YEARLY : BillingCycle.MONTHLY,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const status = e instanceof ClientAdminError ? e.status : 500;
    const message = e instanceof Error ? e.message : "No se pudo asignar el plan";
    return NextResponse.json({ error: message }, { status });
  }
}
