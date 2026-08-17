"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { Spinner } from "@heroui/react";
import { ReportsDashboard } from "@/modules/app/components/dashboard/ReportsDashboard";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { SuperAdminDashboard } from "@/modules/app/components/dashboard/super-admin/SuperAdminDashboard";
import { useSafeToast } from "@/modules/app/hooks/useSafeToast";

const INVITE_ERROR_MESSAGES: Record<string, string> = {
  invalid: "Esa invitación ya no es válida o ya expiró.",
  email_mismatch:
    "Esa invitación fue enviada a otro correo. Inicia sesión con la cuenta que la recibió.",
};

export default function AppDashboard() {
  const { isLoaded, user } = useUser();
  const { organizationId: storeOrgId } = useOrganization();
  const { isLoading: roleLoading, isSuperAdmin } = useUserRole();
  const { showError } = useSafeToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const invite = searchParams.get("invite");
    if (!invite) return;
    showError(INVITE_ERROR_MESSAGES[invite] || "No se pudo procesar la invitación.");
    router.replace("/app");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center rounded-2xl border border-amber-200 bg-amber-50 px-8 py-7">
        <Spinner size="lg" color="primary" className="mb-4" />
        <p className="text-amber-900">
          Aún no tienes una organización configurada.
        </p>
      </div>
    </div>
  );
}
