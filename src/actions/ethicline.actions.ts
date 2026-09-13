"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export async function getActiveOrganizations() {
  try {
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        brandColor: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
    return organizations;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

// Búsqueda pública de organizaciones para el formulario de denuncias.
// A diferencia de getActiveOrganizations, NUNCA devuelve el listado completo:
// solo organizaciones que coincidan con una búsqueda de al menos 3
// caracteres, para no exponer la lista de clientes de EthicVoice a
// cualquier visitante anónimo.
export async function searchOrganizationsPublic(query: string) {
  const trimmed = (query || "").trim();
  if (trimmed.length < 3) return [];

  try {
    const organizations = await prisma.organization.findMany({
      where: {
        isActive: true,
        name: { contains: trimmed, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        brandColor: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
      take: 8,
    });
    return organizations;
  } catch (error) {
    console.error("Error searching organizations:", error);
    return [];
  }
}

// Currently unreachable as a client-invocable Server Action (no client
// component imports it) — hardened anyway since it accepts an arbitrary
// caller-supplied orgId and returns per-org submission counts/recent
// report metadata, matching the org-scoped auth pattern used everywhere
// else in this file's siblings.
export async function getOrganizationAnalytics(orgId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const [membership, user] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    }),
    currentUser(),
  ]);
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isSuper = Boolean(userEmail && isSuperAdmin(userEmail));
  if (!membership && !isSuper) {
    throw new Error("No autorizado");
  }

  try {
    const [organization, recentSubmissions, submissionsByType] =
      await Promise.all([
        prisma.organization.findUnique({
          where: { id: orgId },
          select: {
            totalSubmissions: true,
            customFormSubmissions: true,
            ethicLineSubmissions: true,
          },
        }),

        prisma.formSubmission.findMany({
          where: { orgId },
          orderBy: { submittedAt: "desc" },
          take: 10,
          select: {
            id: true,
            source: true,
            submittedAt: true,
            aiSeverity: true,
          },
        }),

        prisma.formSubmission.groupBy({
          by: ["source"],
          where: { orgId },
          _count: true,
        }),
      ]);

    const total = organization?.totalSubmissions || 0;
    const customFormPercentage =
      total > 0
        ? ((organization?.customFormSubmissions || 0) / total) * 100
        : 0;
    const ethicLinePercentage =
      total > 0 ? ((organization?.ethicLineSubmissions || 0) / total) * 100 : 0;

    return {
      totals: {
        all: total,
        customForms: organization?.customFormSubmissions || 0,
        ethicLine: organization?.ethicLineSubmissions || 0,
      },
      percentages: {
        customForms: customFormPercentage,
        ethicLine: ethicLinePercentage,
      },
      recentSubmissions,
      byType: submissionsByType,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw new Error("Failed to fetch analytics");
  }
}
