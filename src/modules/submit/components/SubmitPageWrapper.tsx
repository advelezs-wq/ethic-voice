"use client";

import { useState } from "react";
import { OrganizationSelector } from "./OrganizationSelector";
import { EthicLineForm } from "./EthicLineForm";
import { Organization } from "@prisma/client";

interface SubmitPageWrapperProps {
  organizations: Organization[];
}

export function SubmitPageWrapper({ organizations }: SubmitPageWrapperProps) {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  if (!selectedOrg) {
    return (
      <OrganizationSelector
        organizations={organizations}
        onSelect={setSelectedOrg}
      />
    );
  }

  return (
    <EthicLineForm
      organization={selectedOrg}
      onBack={() => setSelectedOrg(null)}
    />
  );
}
