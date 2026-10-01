import { NextRequest, NextResponse } from "next/server";
import { updateCard } from "@/modules/app/services/billing.service";
import { billingContext, billingError } from "@/modules/app/services/billing-auth";

/** Cambia la tarjeta de la suscripción (y reintenta el cobro si estaba suspendida). */
export async function POST(req: NextRequest) {
  const ctx = await billingContext();
  if ("error" in ctx) return ctx.error;
  if (!ctx.orgId || !ctx.isAdmin) {
    return NextResponse.json({ error: "Solo el administrador de la organización puede hacer esto." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const result = await updateCard({ orgId: ctx.orgId, email: ctx.email, ...body });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return billingError(e);
  }
}
