import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Organization } from "@prisma/client";

interface OrganizationState {
  // State
  isLoading: boolean;
  hasCompletedSetup: boolean;
  showCreationModal: boolean;
  currentOrganization: Organization | null;
  organizations: Organization[];

  // Actions
  setIsLoading: (loading: boolean) => void;
  setHasCompletedSetup: (completed: boolean) => void;
  setShowCreationModal: (show: boolean) => void;
  setCurrentOrganization: (org: Organization | null) => void;
  setOrganizations: (orgs: Organization[]) => void;

  // Async Actions
  checkOrganizationStatus: (userId: string) => Promise<void>;
  createOrganization: (data: {
    clerkOrgId: string;
    name: string;
    slug: string;
    logoUrl?: string;
    brandColor?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  switchOrganization: (orgId: string) => Promise<void>;

  // Utilities
  reset: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        isLoading: true,
        hasCompletedSetup: false,
        showCreationModal: false,
        currentOrganization: null,
        organizations: [],

        // Basic Actions
        setIsLoading: (loading) => set({ isLoading: loading }),
        setHasCompletedSetup: (completed) =>
          set({ hasCompletedSetup: completed }),
        setShowCreationModal: (show) => set({ showCreationModal: show }),
        setCurrentOrganization: (org) => set({ currentOrganization: org }),
        setOrganizations: (orgs) => set({ organizations: orgs }),

        // Check Organization Status
        checkOrganizationStatus: async () => {
          set({ isLoading: true });

          try {
            const response = await fetch("/api/users/org-status");
            const data = await response.json();

            if (data.hasCompletedSetup) {
              set({ hasCompletedSetup: true });

              // Fetch user's organizations
              const orgsResponse = await fetch("/api/organizations");
              const orgsData = await orgsResponse.json();

              if (orgsData.organizations && orgsData.organizations.length > 0) {
                set({
                  organizations: orgsData.organizations,
                  currentOrganization: orgsData.organizations[0],
                });
              }
            } else {
              set({ showCreationModal: true });
            }
          } catch (error) {
            console.error("Error checking organization status:", error);
          } finally {
            set({ isLoading: false });
          }
        },

        // Create Organization
        createOrganization: async (data) => {
          try {
            const response = await fetch("/api/organizations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              const error = await response.json();
              return {
                success: false,
                error: error.message || "Failed to create organization",
              };
            }

            const { organization } = await response.json();

            set({
              hasCompletedSetup: true,
              showCreationModal: false,
              currentOrganization: organization,
              organizations: [...get().organizations, organization],
            });

            return { success: true };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error ? error.message : "Something went wrong",
            };
          }
        },

        // Switch Organization
        switchOrganization: async (orgId) => {
          const organization = get().organizations.find(
            (org) => org.id === orgId
          );
          if (organization) {
            set({ currentOrganization: organization });
          }
        },

        // Reset Store
        reset: () => {
          set({
            isLoading: true,
            hasCompletedSetup: false,
            showCreationModal: false,
            currentOrganization: null,
            organizations: [],
          });
        },
      }),
      {
        name: "organization-storage",
        partialize: (state) => ({
          currentOrganization: state.currentOrganization,
          hasCompletedSetup: state.hasCompletedSetup,
        }),
      }
    )
  )
);
