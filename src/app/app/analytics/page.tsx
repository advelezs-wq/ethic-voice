import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserPermissions } from "@/modules/core/utils/permissions";
import { AnalyticsContent } from "@/modules/app/components/analytics/AnalyticsContent";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const orgId = await resolveOrgId();
  if (!orgId) {
    redirect("/app/onboarding");
  }

  // Check if user has permission to view analytics
  const permissions = await getUserPermissions(
    userId,
    orgId,
    user?.primaryEmailAddress?.emailAddress
  );

  if (!permissions.canViewAllReports) {
    redirect("/app");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Analíticas e Informes
          </h1>
          <p className="text-gray-600 mt-2">
            Visualiza métricas detalladas y descarga reportes personalizados
            sobre las denuncias de tu organización
          </p>
        </div>

        <AnalyticsContent organizationId={orgId} />
      </div>
    </div>
  );
}
