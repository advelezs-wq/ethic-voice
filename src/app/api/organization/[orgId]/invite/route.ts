import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { sendOrganizationInvitationEmail } from "@/modules/app/services/invitation-email.service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await context.params;
  const { email, role } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  // Check permission: requester must be ADMIN of org
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Enforce plan limits robustly (including pending invitations)
  try {
    const planInfo = await getOrganizationPlanInfo(orgId);
    const planType = (planInfo?.planType || "STARTER") as PlanType;
    const config = PLAN_CONFIGS[planType];
    const memberships = await prisma.organizationMembership.findMany({
      where: { orgId },
      include: { user: { select: { email: true } } },
    });
    const visibleMemberships = memberships.filter(
      (membership) => !isSuperAdmin(membership.user.email)
    );

    const activeAdminCount = visibleMemberships.filter(
      (membership) => membership.role === "ADMIN"
    ).length;
    // VIEWER seats count against the same maxInvestigators bucket as
    // MEMBER — a read-only role is still a seat, and counting it separately
    // (or not at all) would let orgs invite unlimited "viewers" to sidestep
    // seat limits for what's effectively free collaborative access.
    const activeMemberCount = visibleMemberships.filter(
      (membership) => membership.role === "MEMBER" || membership.role === "VIEWER"
    ).length;

    const now = new Date();
    const pendingAdminInvites = await prisma.organizationInvitation.count({
      where: {
        orgId,
        role: "ADMIN",
        status: "pending",
        expiresAt: { gt: now },
      },
    });
    const pendingMemberInvites = await prisma.organizationInvitation.count({
      where: {
        orgId,
        role: { in: ["MEMBER", "VIEWER"] },
        status: "pending",
        expiresAt: { gt: now },
      },
    });

    if (
      role === "ADMIN" &&
      config.features.maxUsers >= 0 &&
      activeAdminCount + pendingAdminInvites >= config.features.maxUsers
    ) {
      return NextResponse.json(
        {
          error: `Límite de administradores alcanzado (${activeAdminCount + pendingAdminInvites}/${config.features.maxUsers} considerando invitaciones pendientes)`,
        },
        { status: 403 }
      );
    }
    if (
      role !== "ADMIN" &&
      config.features.maxInvestigators >= 0 &&
      activeMemberCount + pendingMemberInvites >= config.features.maxInvestigators
    ) {
      return NextResponse.json(
        {
          error: `Límite de investigadores alcanzado (${activeMemberCount + pendingMemberInvites}/${config.features.maxInvestigators} considerando invitaciones pendientes)`,
        },
        { status: 403 }
      );
    }
  } catch {
    // If plan lookup fails, continue but do not block unexpectedly
  }

  // Create invitation
  const invitedRole =
    role === "ADMIN" ? "ADMIN" : role === "VIEWER" ? "VIEWER" : "MEMBER";
  const token = crypto.randomUUID();
  const invitation = await prisma.organizationInvitation.create({
    data: {
      orgId,
      email,
      invitedById: userId,
      role: invitedRole,
      token,
      status: "pending",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
  });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });

  await sendOrganizationInvitationEmail(invitation, org?.name ?? null);

  return NextResponse.json({ success: true, invitationId: invitation.id });
}


