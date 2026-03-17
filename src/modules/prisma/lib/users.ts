import { Organization, User } from "@prisma/client";
import prisma from "./prisma";

export async function getUsers(limit?: number) {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        lastName: "asc",
      },
      ...(limit ? { take: limit } : {}),
    });
    return { users };
  } catch (error) {
    return { error };
  }
}

export async function createUser(data: User) {
  try {
    const user = await prisma.user.create({ data });
    return { user };
  } catch (error) {
    return { error };
  }
}

export async function hasCompletedOrgSetup(
  clerkUserId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { hasCompletedOrgSetup: true },
  });
  return user?.hasCompletedOrgSetup || false;
}

export async function updateOrgSetupStatus(
  clerkUserId: string,
  completed: boolean
): Promise<void> {
  await prisma.user.update({
    where: { id: clerkUserId },
    data: { hasCompletedOrgSetup: completed },
  });
}

export async function getUserOrganizations(
  clerkUserId: string
): Promise<Organization[]> {
  const user = await prisma.user.findUnique({
    where: { id: clerkUserId },
    include: { organizations: true },
  });

  return user?.organizations || [];
}

export async function checkOrganizationSlugAvailability(
  slug: string
): Promise<boolean> {
  const existing = await prisma.organization.findUnique({
    where: { slug },
  });
  return !existing;
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      organizations: {
        orderBy: {
          createdAt: "asc",
        },
      },
      Subscription: true,
      PaymentTransaction: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      organizations: {
        orderBy: {
          createdAt: "asc",
        },
      },
      Subscription: true,
      PaymentTransaction: true,
    },
  });
}

export async function updateUser(id: string, data: Partial<User>) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return { user };
  } catch (error) {
    return { error };
  }
}

export async function deleteUser(id: string) {
  try {
    const user = await prisma.user.delete({ where: { id } });
    return { user };
  } catch (error) {
    return { error };
  }
}

export async function combineName(user: User) {
  const { firstName, lastName } = user;
  return `${firstName} ${lastName}`;
}
