import { cookies } from "next/headers";
import prisma from "@/modules/prisma/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Resolve active organization id for the authenticated user.
 * Priority:
 * 1) Cookie 'ev_org'
 * 2) First organization membership in DB (ascending by createdAt)
 */
export async function resolveOrgId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const jar = await cookies();
    const fromCookie = jar.get("ev_org")?.value || null;
    if (fromCookie) return fromCookie;

    const membership = await prisma.organizationMembership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { orgId: true },
    });
    return membership?.orgId ?? null;
  } catch {
    return null;
  }
}


