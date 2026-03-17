import { useOrganizationStore } from "@/modules/store/organization.store";

export function useOrganization() {
  const {
    currentOrganization,
    organizations,
    isLoading,
    hasCompletedSetup,
    switchOrganization,
    setCurrentOrganization,
  } = useOrganizationStore();

  return {
    currentOrganization,
    organizations,
    isLoading,
    hasCompletedSetup,
    switchOrganization,
    setCurrentOrganization,
    // Add computed values
    hasOrganization: !!currentOrganization,
    organizationId: currentOrganization?.id,
    organizationSlug: currentOrganization?.slug,
  };
}
