"use client";

import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { Spinner } from "@heroui/react";
import { ReportsDashboard } from "@/modules/app/components/dashboard/ReportsDashboard";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { SuperAdminDashboard } from "@/modules/app/components/dashboard/super-admin/SuperAdminDashboard";

export default function AppDashboard() {
  const { isLoaded, user } = useUser();
  const { organizationId: storeOrgId } = useOrganization();
  const { isLoading: roleLoading, isSuperAdmin } = useUserRole();

  // Show loading while auth or role is loading
  if (!isLoaded || !user || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Super admin sees global dashboard even without selecting an organization
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  // Get organization ID from store (DB organizations only)
  const organizationId = storeOrgId || null;

  // If user has an organization, show the proper dashboard
  if (organizationId) {
    return <ReportsDashboard organizationId={organizationId} />;
  }

  // Fallback for non-superadmin without org
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" color="primary" className="mb-4" />
        <p className="text-gray-600">
          Aún no tienes una organización configurada.
        </p>
      </div>
    </div>
  );
}
