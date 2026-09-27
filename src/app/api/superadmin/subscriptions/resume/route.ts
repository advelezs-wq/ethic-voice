import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/modules/core/utils/superadmin-guard";
import { ClientAdminError } from "@/modules/app/services/client-admin.service";
import { runSubscriptionAction } from "@/modules/app/services/subscription-admin.service";

export async function POST(req: NextRequest) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;
  const { subscriptionId } = await req.json().catch(() => ({}));
  try {
    const subscription = await runSubscriptionAction(subscriptionId, "resume");
    return NextResponse.json({ success: true, subscription });
  } catch (e) {
    const status = e instanceof ClientAdminError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status });
  }
}
