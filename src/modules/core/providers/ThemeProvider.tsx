"use client";

// Organization color/CSS theming was retired — EthicVoice now uses one fixed brand palette
// (see tailwind.config.ts's heroui() light/dark themes and src/styles/variables.css) across
// the whole app. This provider now only carries the organization's uploaded logo, which is a
// distinct branding feature (not color theming) still worth keeping.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useOrganization } from "@/modules/app/hooks/useOrganization";

interface OrganizationBranding {
  logoUrl?: string;
}

interface ThemeContextType {
  settings: OrganizationBranding | null;
  isLoading: boolean;
  updateSettings: (settings: Partial<OrganizationBranding>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization();
  const [settings, setSettings] = useState<OrganizationBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganizationSettings = useCallback(async (orgId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/organization/settings?orgId=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings({ logoUrl: data.logoUrl });
      }
    } catch (error) {
      console.error("Error loading organization settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Avoid fetching settings with legacy Clerk org ids
    if (currentOrganization?.id && !String(currentOrganization.id).startsWith("org_")) {
      loadOrganizationSettings(currentOrganization.id);
    }
  }, [currentOrganization?.id, loadOrganizationSettings]);

  const updateSettings = async (newSettings: Partial<OrganizationBranding>) => {
    if (!currentOrganization?.id) return;

    try {
      const response = await fetch("/api/organization/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          settings: newSettings,
        }),
      });

      if (response.ok) {
        setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const contextValue: ThemeContextType = {
    settings,
    isLoading,
    updateSettings,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
