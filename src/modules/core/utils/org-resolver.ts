import { cookies } from "next/headers";
import prisma from "@/modules/prisma/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { FormSubmission } from "@prisma/client";

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

/**
 * Use for report-scoped server actions (chat, etc.). Resolves org from the
 * submission row and checks membership, so a mismatched `ev_org` cookie cannot
 * make the action think the report does not exist while the user is viewing it.
 */
export async function assertUserCanAccessReport(
  reportId: number
): Promise<Pick<FormSubmission, "orgId" | "status">> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("No autorizado");
  }

  const submission = await prisma.formSubmission.findUnique({
    where: { id: reportId },
    select: { orgId: true, status: true },
  });

  if (!submission) {
    throw new Error("Report not found");
  }

  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: { userId, orgId: submission.orgId },
    },
  });

  if (!membership) {
    throw new Error("No autorizado");
  }

  return submission;
}
