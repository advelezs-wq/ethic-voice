import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserPermissions } from "@/modules/core/utils/permissions";
import { SystemSettingsContent } from "@/modules/app/components/settings/SystemSettingsContent";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 mt-2">
            Personaliza la apariencia y configuración de tu dashboard
            organizacional
          </p>
        </div>

        <SystemSettingsContent organizationId={orgId} />
      </div>
    </div>
  );
}
