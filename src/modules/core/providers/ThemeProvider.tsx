"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useOrganization } from "@/modules/app/hooks/useOrganization";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface OrganizationSettings {
  theme: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  customCSS?: string;
  dashboardLayout?: Record<string, unknown>;
  featureFlags?: Record<string, boolean>;
}

interface ThemeContextType {
  settings: OrganizationSettings | null;
  isLoading: boolean;
  updateTheme: (theme: string) => Promise<void>;
  updateSettings: (settings: Partial<OrganizationSettings>) => Promise<void>;
  applyCustomCSS: (css: string) => void;
  removeCustomCSS: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEMES: Record<string, ThemeColors> = {
  default: {
    primary: "#0066CC",
    secondary: "#4A90E2",
    accent: "#E8F4FD",
    background: "#FAFBFC",
  },
  green: {
    primary: "#059669",
    secondary: "#10B981",
    accent: "#D1FAE5",
    background: "#F0FDF4",
  },
  purple: {
    primary: "#7C3AED",
    secondary: "#8B5CF6",
    accent: "#EDE9FE",
    background: "#FDFCFF",
  },
  orange: {
    primary: "#EA580C",
    secondary: "#F97316",
    accent: "#FED7AA",
    background: "#FFFBF5",
  },
  dark: {
    primary: "#3B82F6",
    secondary: "#60A5FA",
    accent: "#1E293B",
    background: "#0F172A",
  },
  "dark-green": {
    primary: "#22C55E",
    secondary: "#4ADE80",
    accent: "#1F2937",
    background: "#111827",
  },
  "dark-purple": {
    primary: "#A855F7",
    secondary: "#C084FC",
    accent: "#1F2937",
    background: "#111827",
  },
  "dark-orange": {
    primary: "#F59E0B",
    secondary: "#FBBF24",
    accent: "#1F2937",
    background: "#111827",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization();
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyCustomCSS = useCallback((css: string) => {
    removeCustomCSS(); // Remove existing custom CSS

    const style = document.createElement("style");
    style.id = "organization-custom-css";
    style.textContent = css;
    document.head.appendChild(style);
  }, []);

  const removeCustomCSS = useCallback(() => {
    const existingStyle = document.getElementById("organization-custom-css");
    if (existingStyle) {
      existingStyle.remove();
    }
  }, []);

  const applyThemeToDOM = useCallback(
    (settings: OrganizationSettings) => {
      const root = document.documentElement;

      // Apply color variables
      root.style.setProperty("--primary-color", settings.primaryColor);
      root.style.setProperty("--secondary-color", settings.secondaryColor);
      root.style.setProperty("--accent-color", settings.accentColor);
      root.style.setProperty("--background-color", settings.backgroundColor);

      // Calculate and apply hover colors for better contrast
      const primaryRgb = hexToRgb(settings.primaryColor);
      const secondaryRgb = hexToRgb(settings.secondaryColor);
      const isDarkTheme = settings.theme.startsWith("dark");

      if (primaryRgb) {
        const primaryHover = isDarkTheme
          ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`
          : `rgba(${Math.max(0, primaryRgb.r - 20)}, ${Math.max(0, primaryRgb.g - 20)}, ${Math.max(0, primaryRgb.b - 20)}, 1)`;
        root.style.setProperty("--button-primary-hover", primaryHover);
      }

      if (secondaryRgb) {
        const secondaryHover = isDarkTheme
          ? `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.8)`
          : `rgba(${Math.max(0, secondaryRgb.r - 20)}, ${Math.max(0, secondaryRgb.g - 20)}, ${Math.max(0, secondaryRgb.b - 20)}, 1)`;
        root.style.setProperty("--button-secondary-hover", secondaryHover);
      }

      // Set text color for hover states
      root.style.setProperty(
        "--button-text-hover",
        isDarkTheme ? "#000000" : "#ffffff"
      );

      // Apply theme class for CSS variables
      root.setAttribute("data-theme", settings.theme);

      // Handle HeroUI theme switching
      // Remove existing theme classes
      root.classList.remove("light", "dark");

      // Add appropriate theme class for HeroUI
      if (isDarkTheme) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }

      // Apply custom CSS if provided
      if (settings.customCSS) {
        applyCustomCSS(settings.customCSS);
      }
    },
    [applyCustomCSS]
  );

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  useEffect(() => {
    // Avoid fetching settings with legacy Clerk org ids
    if (currentOrganization?.id && !String(currentOrganization.id).startsWith("org_")) {
      loadOrganizationSettings(currentOrganization.id);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (settings) {
      applyThemeToDOM(settings);
    }
  }, [settings, applyThemeToDOM]);

  const loadOrganizationSettings = async (orgId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/organization/settings?orgId=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          theme: data.theme || "default",
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor || "#0066CC",
          secondaryColor: data.secondaryColor || "#4A90E2",
          accentColor: data.accentColor || "#E3F2FD",
          backgroundColor: data.backgroundColor || "#F8FAFC",
          customCSS: data.customCSS,
          dashboardLayout: data.dashboardLayout,
          featureFlags: data.featureFlags,
        });
      }
    } catch (error) {
      console.error("Error loading organization settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (theme: string) => {
    if (!currentOrganization?.id) return;

    const themeColors = DEFAULT_THEMES[theme];
    if (!themeColors) return;

    const newSettings = {
      theme,
      primaryColor: themeColors.primary,
      secondaryColor: themeColors.secondary,
      accentColor: themeColors.accent,
      backgroundColor: themeColors.background,
    };

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
      console.error("Error updating theme:", error);
    }
  };

  const updateSettings = async (newSettings: Partial<OrganizationSettings>) => {
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
    updateTheme,
    updateSettings,
    applyCustomCSS,
    removeCustomCSS,
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
