import { cookies } from "next/headers";
import prisma from "@/modules/prisma/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { FormSubmission } from "@prisma/client";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

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
    if (fromCookie) {
      const looksLikeUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          fromCookie
        );

      if (looksLikeUuid) {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress || "";
        if (email && isSuperAdmin(email)) {
          return fromCookie;
        }

        const hasMembership = await prisma.organizationMembership.findUnique({
          where: {
            userId_orgId: {
              userId,
              orgId: fromCookie,
            },
          },
          select: { orgId: true },
        });
        if (hasMembership) return fromCookie;
      }
    }

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
// Confidential cases are hidden from ordinary MEMBER accounts that aren't
// assigned to them — ADMIN and VIEWER (oversight) still see everything, as
// does an assigned investigator. Shared by both assert functions below so
// chat, edits, and reads all respect the same restriction.
async function assertConfidentialityAllows(
  reportId: number,
  userId: string,
  role: string
): Promise<void> {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: reportId },
    select: {
      isConfidential: true,
      assignments: { select: { userId: true } },
    },
  });
  if (!submission?.isConfidential) return;
  if (role === "ADMIN" || role === "VIEWER") return;

  const isAssigned = submission.assignments.some((a) => a.userId === userId);
  if (!isAssigned) {
    const userEmail = (await currentUser())?.primaryEmailAddress?.emailAddress;
    if (userEmail && isSuperAdmin(userEmail)) return;
    throw new Error(
      "Este caso es confidencial — solo los investigadores asignados y administradores pueden verlo"
    );
  }
}

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

  await assertConfidentialityAllows(reportId, userId, membership.role);

  return submission;
}

/**
 * Same access check as assertUserCanAccessReport, plus a block on the
 * VIEWER role — for any action that writes into a case's investigation
 * record (chat messages, attachments, tasks, notes). A read-only oversight
 * account shouldn't be able to insert itself into the record it's meant to
 * be auditing.
 */
export async function assertUserCanWriteToReport(
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

  if (membership.role === "VIEWER") {
    throw new Error(
      "Tu rol es de solo lectura — no puedes escribir en este caso"
    );
  }

  await assertConfidentialityAllows(reportId, userId, membership.role);

  return submission;
}
