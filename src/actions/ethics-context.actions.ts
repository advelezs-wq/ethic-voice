"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import {
  EthicalContextInput,
  ethicalContextSchema,
} from "@/modules/app/lib/schemas/ethics-context";

// This module is Premium-only. Every action re-verifies both org membership
// (ADMIN role) and plan gating server-side — the API/UI gating in
// plan-restrictions.middleware.ts and usePlanPermissions is not trusted
// alone, since a Server Action can be invoked directly.
async function assertPremiumAdmin(orgId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const [membership, user, planInfo] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    }),
    currentUser(),
    getOrganizationPlanInfo(orgId),
  ]);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isSuper = Boolean(userEmail && isSuperAdmin(userEmail));

  if (!isSuper) {
    if (!membership || membership.role !== "ADMIN") {
      throw new Error("No tienes permisos para gestionar el contexto ético");
    }
    if (!planInfo || planInfo.planType !== "PREMIUM") {
      throw new Error(
        "El Contexto Ético Organizacional es exclusivo del Plan Premium"
      );
    }
  }

  return userId;
}

export async function getEthicalContext(orgId: string) {
  await assertPremiumAdmin(orgId);

  const context = await prisma.organizationEthicalContext.findUnique({
    where: { organizationId: orgId },
  });

  return context;
}

export async function upsertEthicalContext(
  orgId: string,
  input: EthicalContextInput
) {
  const userId = await assertPremiumAdmin(orgId);

  const data = ethicalContextSchema.parse(input);

  const context = await prisma.organizationEthicalContext.upsert({
    where: { organizationId: orgId },
    update: {
      businessContext: data.businessContext,
      governanceStructure: data.governanceStructure,
      specialCriteria: data.specialCriteria,
      updatedById: userId,
    },
    create: {
      organizationId: orgId,
      businessContext: data.businessContext,
      governanceStructure: data.governanceStructure,
      specialCriteria: data.specialCriteria,
      updatedById: userId,
    },
  });

  revalidatePath("/app/settings");

  return context;
}

export async function listEthicalDocuments(orgId: string) {
  await assertPremiumAdmin(orgId);

  return prisma.ethicalContextDocument.findMany({
    where: { organizationId: orgId },
    orderBy: [{ isActive: "desc" }, { uploadedAt: "desc" }],
  });
}

export async function setEthicalDocumentActive(
  orgId: string,
  documentId: number,
  isActive: boolean
) {
  await assertPremiumAdmin(orgId);

  // documentId alone isn't proof of ownership — scope by orgId too, same
  // reasoning as department.actions.ts's cross-tenant-id guard.
  const owned = await prisma.ethicalContextDocument.findFirst({
    where: { id: documentId, organizationId: orgId },
    select: { id: true },
  });
  if (!owned) throw new Error("Documento no encontrado");

  const document = await prisma.ethicalContextDocument.update({
    where: { id: documentId },
    data: { isActive },
  });

  revalidatePath("/app/settings");

  return document;
}

export async function deleteEthicalDocument(
  orgId: string,
  documentId: number
) {
  await assertPremiumAdmin(orgId);

  const owned = await prisma.ethicalContextDocument.findFirst({
    where: { id: documentId, organizationId: orgId },
    select: { id: true },
  });
  if (!owned) throw new Error("Documento no encontrado");

  await prisma.ethicalContextDocument.delete({ where: { id: documentId } });

  revalidatePath("/app/settings");
}
