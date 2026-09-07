"use client";

import { useState } from "react";
import { OrganizationSelector } from "./OrganizationSelector";
import { EthicLineForm } from "./EthicLineForm";
import { Organization } from "@prisma/client";

interface SubmitPageWrapperProps {
  // Cuando se llega por el link único de una organización (item 3, /submit/[orgSlug]),
  // la organización ya viene resuelta y se salta el paso de búsqueda.
  initialOrganization?: Organization | null;
}

export function SubmitPageWrapper({
  initialOrganization = null,
}: SubmitPageWrapperProps) {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(
    initialOrganization
  );

  if (!selectedOrg) {
    return <OrganizationSelector onSelect={setSelectedOrg} />;
  }

  return (
    <EthicLineForm
      organization={selectedOrg}
      onBack={initialOrganization ? undefined : () => setSelectedOrg(null)}
    />
  );
}
