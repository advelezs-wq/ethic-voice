import React from "react";
import { RoleBasedOrganizationView } from "@/modules/app/components/organization/RoleBasedOrganizationView";
import { auth } from "@clerk/nextjs/server";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

const OrganizationPage = async () => {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  if (!userId) {
    return (
      <section className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-emerald-100 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">Sesión no válida</p>
        </div>
      </section>
    );
  }

  if (!orgId) {
    return (
      <section className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-center">
          <p className="text-sm font-medium text-amber-900">
            No hay organización seleccionada.
          </p>
        </div>
      </section>
    );
  }

  return <RoleBasedOrganizationView />;
};

export default OrganizationPage;
