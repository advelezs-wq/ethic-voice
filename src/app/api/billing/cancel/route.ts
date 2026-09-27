import { NextResponse } from "next/server";
import { cancelAtPeriodEnd } from "@/modules/app/services/billing.service";
import { billingContext, billingError } from "@/modules/app/services/billing-auth";

export async function POST() {
  const ctx = await billingContext();
  if ("error" in ctx) return ctx.error;
  if (!ctx.orgId || !ctx.isAdmin) {
    return NextResponse.json({ error: "Solo el administrador de la organización puede hacer esto." }, { status: 403 });
  }
  try {
    const result = await cancelAtPeriodEnd(ctx.orgId);
    return NextResponse.json({ success: true, ...(result ?? {}) });
  } catch (e) {
    return billingError(e);
  }
}
