import { Organization } from "@prisma/client";
import prisma from "./prisma";

export async function getOrganizations(limit?: number) {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: {
        createdAt: "asc",
      },
      ...(limit ? { take: limit } : {}),
    });
    return { organizations };
  } catch (error) {
    return { error };
  }
}

export async function createOrganization(data: {
  clerkOrgId: string;
  clerkUserId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor?: string;
}): Promise<{ organization?: Organization; error?: Error }> {
  try {
    const organization = await prisma.organization.create({
      data: {
        id: data.clerkOrgId,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        brandColor: data.brandColor,
      },
    });

    await prisma.user.update({
      where: { id: data.clerkUserId },
      data: { hasCompletedOrgSetup: true },
    });

    return { organization };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function getOrganizationByClerkId(id: string) {
  return await prisma.organization.findUnique({
    where: {
      id: id,
    },
    include: {
      subscriptions: {
        orderBy: {
          createdAt: "asc",
        },
      },
      paymentTransactions: {
        orderBy: {
          createdAt: "asc",
        },
      },
      forms: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}
export async function getOrganizationById(id: string) {
  return await prisma.organization.findUnique({
    where: {
      id,
    },
    include: {
      subscriptions: {
        orderBy: {
          createdAt: "asc",
        },
      },
      paymentTransactions: {
        orderBy: {
          createdAt: "asc",
        },
      },
      forms: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export async function updateOrganization(
  id: string,
  data: Partial<Organization>
) {
  try {
    const organization = await prisma.organization.update({
      where: { id: id },
      data,
    });
    return { organization };
  } catch (error) {
    return { error };
  }
}

export async function deleteOrganization(id: string) {
  try {
    const organization = await prisma.organization.delete({
      where: { id: id },
    });
    return { organization };
  } catch (error) {
    return { error };
  }
}
