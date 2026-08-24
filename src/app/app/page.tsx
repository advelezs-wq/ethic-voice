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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center rounded-2xl border border-emerald-100 bg-white px-8 py-7 shadow-sm">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-slate-500">Preparando tu workspace...</p>
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
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md rounded-2xl border border-amber-200 bg-amber-50 px-8 py-7">
        <p className="text-amber-900 font-medium">
          Aún no tienes una organización configurada.
        </p>
        <p className="mt-2 text-sm text-amber-800">
          Si te invitaron a un equipo, pide a tu administrador que te reenvíe
          la invitación desde Organización → Invitaciones Pendientes. Si
          quieres crear tu propia organización, continúa con el registro.
        </p>
        <a
          href="/app/onboarding"
          className="mt-4 inline-block rounded-full bg-[#0d212c] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0d212c]/90"
        >
          Crear mi organización
        </a>
      </div>
    </div>
  );
}
