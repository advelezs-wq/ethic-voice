import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { organizationId } = await req.json();
    if (!organizationId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

    // Check permission (or a superadmin browsing "por org", who has no
    // membership row of their own)
    const membership = await prisma.organizationMembership.findUnique({ where: { userId_orgId: { userId, orgId: organizationId } } });
    if (membership?.role !== "ADMIN") {
      const requesterEmail = (await currentUser())?.primaryEmailAddress?.emailAddress;
      if (!requesterEmail || !isSuperAdmin(requesterEmail)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.organizationSettings.upsert({
      where: { organizationId },
      update: { logoUrl: null },
      create: { organizationId, logoUrl: null },
    });
    await prisma.organization.update({ where: { id: organizationId }, data: { logoUrl: null } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("/api/organization/logo/remove error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// (duplicate handler removed)
