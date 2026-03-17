import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await currentUser();
  const email = me?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      memberships: { select: { id: true } },
      _count: { select: { memberships: true, forms: true, complaints: true } },
    },
  });

  const data = organizations.map((org) => {
    const sub = org.subscriptions?.[0] || null;
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      plan: sub?.planType || null,
      status: sub?.status || null,
      subscriptionId: sub?.id || null,
      members: org._count.memberships,
      reports: org._count.complaints,
    };
  });

  return NextResponse.json({ organizations: data });
}


