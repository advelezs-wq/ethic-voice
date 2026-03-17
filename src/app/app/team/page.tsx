import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/modules/prisma/lib/prisma";
import { TeamMembersView } from "@/modules/app/components/dashboard/admin/TeamMembersView";
import { cookies } from "next/headers";

export default async function TeamPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Resolve current organization from cookie or first membership in DB
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("ev_org")?.value;

  let orgId: string | null = null;

  if (cookieOrgId) {
    // Verify the user belongs to this org
    const existingMembership = await prisma.organizationMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId: cookieOrgId,
        },
      },
    });
    if (existingMembership) {
      orgId = cookieOrgId;
    }
  }

  // Fallback: pick the oldest organization the user belongs to
  if (!orgId) {
    const firstMembership = await prisma.organizationMembership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (firstMembership) {
      orgId = firstMembership.orgId;
    }
  }

  // If the user has no organizations, send to onboarding
  if (!orgId) {
    redirect("/app/onboarding");
  }

  // Ensure membership exists; if not, create MEMBER in default department
  let membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });

  if (!membership) {
    // Find or create default department
    let defaultDepartment = await prisma.department.findFirst({
      where: { orgId, isDefault: true },
    });

    if (!defaultDepartment) {
      defaultDepartment = await prisma.department.create({
        data: {
          name: "General",
          slug: "general",
          orgId,
          isDefault: true,
        },
      });
    }

    membership = await prisma.organizationMembership.create({
      data: {
        userId,
        orgId,
        role: "MEMBER",
        departmentId: defaultDepartment.id,
      },
    });

    // After creating membership, go to app home
    redirect("/app");
  }

  // Only admins can view team page
  if (membership.role !== "ADMIN") {
    redirect("/app");
  }

  return <TeamMembersView organizationId={orgId} />;
}
