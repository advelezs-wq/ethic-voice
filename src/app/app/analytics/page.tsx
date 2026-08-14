import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserPermissions } from "@/modules/core/utils/permissions";
import { AnalyticsContent } from "@/modules/app/components/analytics/AnalyticsContent";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { PageHero } from "@/modules/app/components/ui";

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
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHero
        kicker="Reportes"
        title="Analíticas e Informes"
        description="Visualiza métricas detalladas y descarga reportes personalizados sobre las denuncias de tu organización"
      />

      <AnalyticsContent organizationId={orgId} />
    </div>
  );
}
