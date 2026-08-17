import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import prisma from "@/modules/prisma/lib/prisma";

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

    // getOrganizationPlanInfo can auto-link the caller's own unlinked
    // subscription to `orgId` if that org has none active yet — without a
    // membership check, any signed-in user with an active subscription
    // could silently link it (and its plan/features) onto an org they have
    // no relationship with, just by requesting this with that org's id.
    const requesterMembership = await prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!requesterMembership) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
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
