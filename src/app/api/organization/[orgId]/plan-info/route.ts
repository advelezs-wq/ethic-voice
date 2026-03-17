import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";

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

    // Get plan information for the organization
    // ✅ Pass userId to enable auto-linking of unlinked subscriptions
    const planInfo = await getOrganizationPlanInfo(orgId, userId);

    if (!planInfo) {
      return NextResponse.json(
        { error: "Organization not found or no plan information available" },
        { status: 404 }
      );
    }

    return NextResponse.json(planInfo);
  } catch (error) {
    console.error("Error getting organization plan info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
