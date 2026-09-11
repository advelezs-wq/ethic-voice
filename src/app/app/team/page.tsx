import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/modules/prisma/lib/prisma";
import { TeamMembersView } from "@/modules/app/components/dashboard/admin/TeamMembersView";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export default async function TeamPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  // resolveOrgId() reads the ev_org cookie (trusting it directly for
  // superadmins, who have no OrganizationMembership row of their own) and
  // otherwise falls back to the user's first real membership — the same
  // resolution every other org-scoped page in the app relies on. This page
  // used to hand-roll that logic without the superadmin case, which meant
  // a superadmin browsing "por org" silently fell through to their own
  // unrelated org instead of the one selected in the header.
  const orgId = await resolveOrgId();

  // If the user has no organizations, send to onboarding
  if (!orgId) {
    redirect("/app/onboarding");
  }

  const userEmail = (await currentUser())?.primaryEmailAddress?.emailAddress;
  if (userEmail && isSuperAdmin(userEmail)) {
    return <TeamMembersView organizationId={orgId} />;
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
