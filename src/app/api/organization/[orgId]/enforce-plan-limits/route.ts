import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { enforcePlanLimits } from "@/modules/core/utils/plan-enforcement.utils";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export async function POST(
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

    // This can block/unblock member seats — without an admin check, any
    // signed-in user could trigger it against any org by orgId alone.
    const requesterMembership = await prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (requesterMembership?.role !== "ADMIN") {
      const requesterEmail = (await currentUser())?.primaryEmailAddress?.emailAddress;
      if (!requesterEmail || !isSuperAdmin(requesterEmail)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    console.log("🛡️ [ENFORCE-PLAN-LIMITS] Manual enforcement requested:", {
      orgId,
      requestedBy: userId,
    });

    // Enforce plan limits
    const result = await enforcePlanLimits(orgId, userId);

    if (result.success) {
      console.log("✅ [ENFORCE-PLAN-LIMITS] Plan limits enforced successfully");

      return NextResponse.json({
        success: true,
        message: result.message,
        enforcement: {
          blockedUsers: result.blockedUsers,
          unblockedUsers: result.unblockedUsers,
          currentLimits: result.currentLimits,
        },
        summary: {
          totalBlocked: result.blockedUsers.length,
          totalUnblocked: result.unblockedUsers.length,
          activeAdmins: result.currentLimits.activeAdmins,
          activeMembers: result.currentLimits.activeMembers,
          maxAdmins: result.currentLimits.maxUsers,
          maxMembers: result.currentLimits.maxInvestigators,
        },
      });
    } else {
      console.log("❌ [ENFORCE-PLAN-LIMITS] Plan enforcement failed");

      return NextResponse.json(
        {
          error: result.message,
          currentLimits: result.currentLimits,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ [ENFORCE-PLAN-LIMITS] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
