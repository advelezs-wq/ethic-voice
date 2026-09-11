import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMemberDetails } from "@/actions/team.actions";
import { MemberDetailsView } from "@/modules/app/components/dashboard/admin/MemberDetailsView";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import prisma from "@/modules/prisma/lib/prisma";

interface MemberDetailsPageProps {
  params: Promise<{
    memberId: string;
  }>;
}

export default async function MemberDetailsPage({
  params,
}: MemberDetailsPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const orgId = await resolveOrgId();
  if (!orgId) {
    redirect("/app/onboarding");
  }

  // Enforce that only org admins can view member details — a superadmin
  // browsing "por org" has no membership row for that org (resolveOrgId()
  // already trusts the ev_org cookie for them), so this needs the same
  // bypass or the page always redirects them away.
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });

  if (membership?.role !== "ADMIN") {
    const userEmail = (await currentUser())?.primaryEmailAddress?.emailAddress;
    if (!userEmail || !isSuperAdmin(userEmail)) {
      redirect("/app");
    }
  }

  try {
    const memberData = await getMemberDetails((await params).memberId, orgId);
    return <MemberDetailsView data={memberData} />;
  } catch {
    redirect("/app/team");
  }
}
