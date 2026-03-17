import React from "react";
import { RoleBasedOrganizationView } from "@/modules/app/components/organization/RoleBasedOrganizationView";
import { auth } from "@clerk/nextjs/server";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

const OrganizationPage = async () => {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  if (!userId) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <p>Not authenticated</p>
      </section>
    );
  }

  if (!orgId) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <p>No organization selected</p>
      </section>
    );
  }

  return <RoleBasedOrganizationView />;
};

export default OrganizationPage;
