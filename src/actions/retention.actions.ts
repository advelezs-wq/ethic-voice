"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { revalidatePath } from "next/cache";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { userHasPermission } from "@/modules/core/utils/permissions";

export interface CaseRetentionPolicy {
  caseRetentionDays: number | null;
  autoDeleteOnRetentionExpiry: boolean;
}

export async function getCaseRetentionPolicy(): Promise<CaseRetentionPolicy> {
  const orgId = await resolveOrgId();
  if (!orgId) throw new Error("No autorizado");

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { caseRetentionDays: true, autoDeleteOnRetentionExpiry: true },
  });
  if (!org) throw new Error("Organización no encontrada");

  return {
    caseRetentionDays: org.caseRetentionDays,
    autoDeleteOnRetentionExpiry: org.autoDeleteOnRetentionExpiry,
  };
}

/**
 * caseRetentionDays: null keeps closed cases indefinitely (safe default).
 * autoDeleteOnRetentionExpiry defaulting to false means expired cases
 * queue for admin review instead of being deleted automatically — orgs
 * opt into full automation explicitly.
 */
export async function updateCaseRetentionPolicy(
  policy: CaseRetentionPolicy
): Promise<void> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  const user = await currentUser();
  if (!userId || !orgId || !user) throw new Error("No autorizado");

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = await userHasPermission(
    userId,
    orgId,
    "canManageOrganization",
    userEmail
  );
  if (!isAdmin) {
    throw new Error("Solo un administrador puede configurar la política de retención");
  }

  if (
    policy.caseRetentionDays !== null &&
    (!Number.isInteger(policy.caseRetentionDays) || policy.caseRetentionDays <= 0)
  ) {
    throw new Error("Los días de retención deben ser un número entero positivo, o vacío para retención indefinida");
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      caseRetentionDays: policy.caseRetentionDays,
      autoDeleteOnRetentionExpiry:
        policy.caseRetentionDays === null ? false : policy.autoDeleteOnRetentionExpiry,
    },
  });

  revalidatePath("/app/settings");
}

export interface RetentionPendingCase {
  id: number;
  trackingToken: string;
  type: string | null;
  closureApprovedAt: string | null;
  retentionExpiresAt: string | null;
}

// Closed cases whose retention window has passed, aren't under legal hold,
// and belong to orgs that haven't opted into automatic deletion — these
// need a human to look at them.
export async function getCasesPendingRetentionReview(): Promise<
  RetentionPendingCase[]
> {
  const orgId = await resolveOrgId();
  if (!orgId) throw new Error("No autorizado");

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { autoDeleteOnRetentionExpiry: true },
  });
  if (!org || org.autoDeleteOnRetentionExpiry) return [];

  const cases = await prisma.formSubmission.findMany({
    where: {
      orgId,
      status: "CLOSED",
      legalHold: false,
      retentionExpiresAt: { lte: new Date() },
    },
    select: {
      id: true,
      trackingToken: true,
      type: true,
      closureApprovedAt: true,
      retentionExpiresAt: true,
    },
    orderBy: { retentionExpiresAt: "asc" },
    take: 200,
  });

  return cases.map((c) => ({
    id: c.id,
    trackingToken: c.trackingToken,
    type: c.type,
    closureApprovedAt: c.closureApprovedAt?.toISOString() || null,
    retentionExpiresAt: c.retentionExpiresAt?.toISOString() || null,
  }));
}
