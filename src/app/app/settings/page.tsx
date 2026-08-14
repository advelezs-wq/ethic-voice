import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserPermissions } from "@/modules/core/utils/permissions";
import { SystemSettingsContent } from "@/modules/app/components/settings/SystemSettingsContent";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { PageHero } from "@/modules/app/components/ui";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const orgId = await resolveOrgId();
  if (!orgId) {
    redirect("/app/onboarding");
  }

  // Check if user has permission to manage organization
  const permissions = await getUserPermissions(
    userId,
    orgId,
    user?.primaryEmailAddress?.emailAddress
  );

  if (!permissions.canManageOrganization) {
    redirect("/app");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHero
        kicker="Organización"
        title="Configuración del Sistema"
        description="Personaliza la apariencia y configuración de tu dashboard organizacional"
      />

      <SystemSettingsContent organizationId={orgId} />
    </div>
  );
}
