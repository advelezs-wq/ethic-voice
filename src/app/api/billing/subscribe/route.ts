import { NextRequest, NextResponse } from "next/server";
import { startSubscription } from "@/modules/app/services/billing.service";
import { billingError, billingUser } from "@/modules/app/services/billing-auth";

/** Checkout: guarda la tarjeta en Wompi y hace el primer cobro del plan. */
export async function POST(req: NextRequest) {
  const user = await billingUser();
  if (!user) return NextResponse.json({ error: "Sesión no iniciada" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const result = await startSubscription({ ...user, ...body });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return billingError(e);
  }
}
