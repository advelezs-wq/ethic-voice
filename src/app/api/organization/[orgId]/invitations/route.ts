import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await context.params;

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

  const invitations = await prisma.organizationInvitation.findMany({
    where: { orgId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  return NextResponse.json({
    invitations: invitations.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      isExpired: Boolean(invite.expiresAt && invite.expiresAt < now),
    })),
  });
}
