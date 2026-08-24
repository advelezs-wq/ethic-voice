import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { sendOrganizationInvitationEmail } from "@/modules/app/services/invitation-email.service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string; invitationId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, invitationId } = await context.params;

  const [requesterMembership, requesterClerkUser] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    }),
    currentUser(),
  ]);
  const requesterEmail = requesterClerkUser?.primaryEmailAddress?.emailAddress;
  const requesterIsSuperAdmin = Boolean(
    requesterEmail && isSuperAdmin(requesterEmail)
  );
  if (
    !requesterIsSuperAdmin &&
    (!requesterMembership || requesterMembership.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation || invitation.orgId !== orgId) {
    return NextResponse.json(
      { error: "Invitación no encontrada" },
      { status: 404 }
    );
  }
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "Esta invitación ya fue aceptada o revocada" },
      { status: 400 }
    );
  }

  // Reuse the same row: fresh token + expiry so the old (possibly expired)
  // link stops working and the new email is the only valid one.
  const updated = await prisma.organizationInvitation.update({
    where: { id: invitationId },
    data: {
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  await sendOrganizationInvitationEmail(updated, org?.name ?? null);

  return NextResponse.json({
    success: true,
    invitation: {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      createdAt: updated.createdAt,
      expiresAt: updated.expiresAt,
      isExpired: false,
    },
  });
}
