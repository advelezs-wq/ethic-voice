import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { getAvailableMembersForAssignment } from "@/actions/report-assignments.actions";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { recalculateOrganizationSeatUsage } from "@/modules/core/utils/subscription.utils";

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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const body = await req.json();
    const memberId = String(body?.memberId || "").trim();
    const role = body?.role === "ADMIN" ? "ADMIN" : body?.role === "MEMBER" ? "MEMBER" : null;

    if (!orgId || !memberId || !role) {
      return NextResponse.json(
        { error: "orgId, memberId y role son requeridos" },
        { status: 400 }
      );
    }

    const requesterMembership = await prisma.organizationMembership.findUnique({
      where: {
        userId_orgId: { userId, orgId },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    const requesterIsSuperAdmin = Boolean(
      requesterMembership?.user?.email &&
        isSuperAdmin(requesterMembership.user.email)
    );

    if (!requesterMembership || (!requesterIsSuperAdmin && requesterMembership.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const targetMembership = await prisma.organizationMembership.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!targetMembership || targetMembership.orgId !== orgId) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    if (isSuperAdmin(targetMembership.user.email)) {
      return NextResponse.json(
        { error: "No se puede cambiar el rol de un super admin" },
        { status: 403 }
      );
    }

    if (targetMembership.role === role) {
      return NextResponse.json({
        success: true,
        membership: targetMembership,
      });
    }

    if (targetMembership.userId === userId && targetMembership.role === "ADMIN" && role === "MEMBER") {
      const adminCount = await prisma.organizationMembership.count({
        where: { orgId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No puedes quitarte el rol admin si eres el unico administrador" },
          { status: 400 }
        );
      }
    }

    if (targetMembership.role === "ADMIN" && role === "MEMBER") {
      const adminCount = await prisma.organizationMembership.count({
        where: { orgId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "La organizacion debe mantener al menos un administrador" },
          { status: 400 }
        );
      }
    }

    try {
      const planInfo = await getOrganizationPlanInfo(orgId);
      const planType = (planInfo?.planType || "STARTER") as PlanType;
      const config = PLAN_CONFIGS[planType];

      if (role === "ADMIN") {
        const adminCount = await prisma.organizationMembership.count({
          where: { orgId, role: "ADMIN" },
        });
        if (config.features.maxUsers >= 0 && adminCount >= config.features.maxUsers) {
          return NextResponse.json(
            { error: `Límite de administradores alcanzado (${config.features.maxUsers})` },
            { status: 403 }
          );
        }
      } else {
        const memberCount = await prisma.organizationMembership.count({
          where: { orgId, role: "MEMBER" },
        });
        if (
          config.features.maxInvestigators >= 0 &&
          memberCount >= config.features.maxInvestigators
        ) {
          return NextResponse.json(
            {
              error: `Límite de investigadores alcanzado (${config.features.maxInvestigators})`,
            },
            { status: 403 }
          );
        }
      }
    } catch {
      // If plan lookup fails, do not block role update unexpectedly.
    }

    const previousRole = targetMembership.role;

    const updatedMembership = await prisma.$transaction(async (tx) => {
      const updated = await tx.organizationMembership.update({
        where: { id: memberId },
        data: {
          role,
          departmentId: role === "ADMIN" ? null : targetMembership.departmentId,
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
      });

      return updated;
    });

    if (previousRole !== role) {
      await recalculateOrganizationSeatUsage(orgId);
    }

    return NextResponse.json({
      success: true,
      membership: {
        id: updatedMembership.id,
        userId: updatedMembership.userId,
        orgId: updatedMembership.orgId,
        role: updatedMembership.role,
        isBlocked: updatedMembership.isBlocked || false,
        department: updatedMembership.department?.name || null,
        user: {
          id: updatedMembership.user.id,
          email: updatedMembership.user.email,
          firstName: updatedMembership.user.firstName,
          lastName: updatedMembership.user.lastName,
        },
      },
    });
  } catch (error) {
    console.error("Error updating organization member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// New endpoint: /api/organization/[orgId]/available-investigators
// Moved GET_availableInvestigators to its own route at
// /api/organization/[orgId]/available-investigators
