import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient, createClerkClient } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

// ✅ Helper function to get Clerk client safely
async function getClerkClient() {
  try {
    // Try default clerkClient first (supports function form in newer Clerk)
    if (typeof clerkClient === "function") {
      const client = await clerkClient();
      if (client && typeof (client as any).organizations?.getOrganization === "function") {
        return client as any;
      }
    } else if (clerkClient && typeof (clerkClient as any).organizations?.getOrganization === "function") {
      return clerkClient as any;
    }

    // Fallback: create new client instance
    console.log("🔄 Creating new Clerk client instance...");
    const client = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    });

    return client;
  } catch (error) {
    console.error("❌ Failed to get Clerk client:", error);
    return null;
  }
}

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
    const { memberId } = await req.json();

    if (!orgId || !memberId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🗑️ [REMOVE-MEMBER] Starting member removal:", {
      orgId,
      memberId,
      removedBy: userId,
    });

    // Get the membership to remove
    const membership = await prisma.organizationMembership.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Prevent removal of super admin
    if (isSuperAdmin(membership.user.email)) {
      return NextResponse.json(
        { error: "Cannot remove super administrator" },
        { status: 403 }
      );
    }

    // Prevent users from removing themselves
    if (membership.userId === userId) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the organization" },
        { status: 403 }
      );
    }

    // Verify the membership belongs to the specified organization
    if (membership.orgId !== orgId) {
      return NextResponse.json(
        { error: "Membership does not belong to this organization" },
        { status: 403 }
      );
    }

    console.log("👤 [REMOVE-MEMBER] Removing member:", {
      memberEmail: membership.user.email,
      memberRole: membership.role,
    });

    const body = await req.json().catch(() => ({}));
    const hardDelete = Boolean(body?.hardDelete);

    try {
      // First, try to remove from Clerk (best-effort)
      console.log("🔄 [REMOVE-MEMBER] Removing from Clerk...");

      // Get Clerk client instance safely
    const clerk = await getClerkClient();
      
      if (!clerk) {
        console.error("❌ [REMOVE-MEMBER] Clerk client not available");
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again." },
          { status: 503 }
        );
      }
      
      // Get Clerk memberships to find the correct one
      const clerkMemberships = await clerk.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 100,
      });

    const clerkMembership = clerkMemberships.data?.find(
        (m: { publicUserData?: { userId?: string } }) =>
          m.publicUserData?.userId === membership.userId
      );

      if (clerkMembership) {
        await clerk.organizations.deleteOrganizationMembership({
          organizationId: orgId,
          userId: membership.userId,
        });
        console.log("✅ [REMOVE-MEMBER] Removed from Clerk successfully");
      } else {
        console.log(
          "⚠️ [REMOVE-MEMBER] Member not found in Clerk, proceeding with database removal"
        );
      }
    } catch (clerkError: unknown) {
      console.error("❌ [REMOVE-MEMBER] Clerk removal failed:", clerkError);
      // Continue with database removal even if Clerk fails
      console.log(
        "⚠️ [REMOVE-MEMBER] Continuing with database removal despite Clerk error"
      );
    }

    // Remove from database and unassign from cases
    console.log("🗄️ [REMOVE-MEMBER] Removing from database...");

    await prisma.$transaction(async (tx) => {
      await tx.reportAssignment.deleteMany({ where: { userId: membership.userId } });
      await tx.reportUpdate.updateMany({ where: { assignedTo: membership.userId }, data: { assignedTo: null } });
      await tx.organizationMembership.delete({ where: { id: memberId } });
      if (hardDelete) {
        const other = await tx.organizationMembership.findFirst({ where: { userId: membership.userId } });
        if (!other) {
          await tx.user.delete({ where: { id: membership.userId } });
        }
      }
    });

    // Update organization counters
    const _updateData: Record<string, unknown> = {};

    if (membership.role === "ADMIN") {
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          currentUsers: {
            decrement: 1,
          },
        },
      });
    } else {
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          currentInvestigators: {
            decrement: 1,
          },
        },
      });
    }

    console.log("🎉 [REMOVE-MEMBER] Member removed successfully");

    return NextResponse.json({
      success: true,
      message: `${membership.user.email} has been removed from the organization`,
      removedMember: {
        id: membership.id,
        email: membership.user.email,
        role: membership.role,
        name: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
      },
    });
  } catch (error) {
    console.error("❌ [REMOVE-MEMBER] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
