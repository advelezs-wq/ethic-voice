import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { getAvailableMembersForAssignment } from "@/actions/report-assignments.actions";

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

    // Get organization members from database
    const memberships = await prisma.organizationMembership.findMany({
      where: {
        orgId: orgId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform to match OrganizationMember interface and filter out super admins
    const members = memberships
      .filter((membership) => {
        // Filter out super admin from visible members
        return !isSuperAdmin(membership.user.email);
      })
      .map((membership) => ({
        id: membership.id,
        userId: membership.userId,
        orgId: membership.orgId,
        role: membership.role,
        isBlocked: membership.isBlocked || false,
        department: membership.department?.name || null,
        user: {
          id: membership.user.id,
          email: membership.user.email,
          firstName: membership.user.firstName,
          lastName: membership.user.lastName,
        },
      }));

    return NextResponse.json({
      members,
      total: members.length,
    });
  } catch (error) {
    console.error("Error getting organization members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// New endpoint: /api/organization/[orgId]/available-investigators
// Moved GET_availableInvestigators to its own route at
// /api/organization/[orgId]/available-investigators
