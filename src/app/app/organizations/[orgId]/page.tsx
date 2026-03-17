import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrganizationDetails } from "@/actions/superadmin.actions";
import { currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { OrganizationDetailsView } from "@/modules/app/components/dashboard/OrganizationDetailsView";

interface OrganizationDetailsPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function OrganizationDetailsPage({
  params,
}: OrganizationDetailsPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Check if user is super admin
  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

  if (!userEmail || !isSuperAdmin(userEmail)) {
    redirect("/app");
  }

  try {
    const organizationData = await getOrganizationDetails((await params).orgId);
    return <OrganizationDetailsView data={organizationData} />;
  } catch (error) {
    console.error("Error loading organization details:", error);
    redirect("/app/organizations");
  }
}
