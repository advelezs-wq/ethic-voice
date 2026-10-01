import { NextResponse } from "next/server";
import { billingSummary } from "@/modules/app/services/billing.service";
import { billingContext, billingError } from "@/modules/app/services/billing-auth";

export async function GET() {
  const ctx = await billingContext();
  if ("error" in ctx) return ctx.error;
  if (!ctx.orgId) return NextResponse.json({ error: "No perteneces a esta organización" }, { status: 403 });
  try {
    return NextResponse.json({ ...(await billingSummary(ctx.orgId)), canManage: ctx.isAdmin });
  } catch (e) {
    return billingError(e);
  }
}
