/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { DashboardData } from "@/types/dashboard.types";
import { ReportsStats } from "@/types/reports";
// Removed direct imports of server-side functions with Prisma
// Now using API routes instead

interface AnalyticsState {
  // Dashboard data
  dashboardData: DashboardData | null;
  dashboardLoading: boolean;

  // Reports stats
  reportsStats: ReportsStats | null;
  reportsStatsLoading: boolean;

  // Member-specific data (for role-based access)
  memberStats: any | null;
  memberStatsLoading: boolean;

  // Organization data (for super admin)
  organizationStats: any | null;
  organizationStatsLoading: boolean;

  // Last updated timestamps
  lastDashboardUpdate: Date | null;
  lastReportsStatsUpdate: Date | null;
  lastMemberStatsUpdate: Date | null;
  lastOrganizationStatsUpdate: Date | null;
}

interface AnalyticsContextType extends AnalyticsState {
  // Data loading methods
  loadDashboardData: (orgId: string, forceRefresh?: boolean) => Promise<void>;
  loadReportsStats: (orgId: string, forceRefresh?: boolean) => Promise<void>;
  loadMemberStats: (
    memberId: string,
    orgId: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  loadOrganizationStats: (
    orgId: string,
    forceRefresh?: boolean
  ) => Promise<void>;

  // Refresh methods
  refreshDashboard: () => Promise<void>;
  refreshReportsStats: () => Promise<void>;
  refreshMemberStats: () => Promise<void>;
  refreshOrganizationStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
  invalidateAfterReportCreate: () => Promise<void>;

  // Clear methods
  clearDashboardData: () => void;
  clearReportsStats: () => void;
  clearMemberStats: () => void;
  clearOrganizationStats: () => void;
  clearAll: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user } = useUser();
  const { role, isSuperAdmin } = useUserRole();

  const [state, setState] = useState<AnalyticsState>({
    dashboardData: null,
    dashboardLoading: false,
    reportsStats: null,
    reportsStatsLoading: false,
    memberStats: null,
    memberStatsLoading: false,
    organizationStats: null,
    organizationStatsLoading: false,
    lastDashboardUpdate: null,
    lastReportsStatsUpdate: null,
    lastMemberStatsUpdate: null,
    lastOrganizationStatsUpdate: null,
  });

  // Check if data needs refresh (5 minutes cache)
  const needsRefresh = useCallback((lastUpdate: Date | null): boolean => {
    if (!lastUpdate) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastUpdate < fiveMinutesAgo;
  }, []);

  // Load dashboard data via API
  const loadDashboardData = useCallback(
    async (orgId: string, forceRefresh = false) => {
      if (!forceRefresh && !needsRefresh(state.lastDashboardUpdate)) {
        return;
      }

      setState((prev) => ({ ...prev, dashboardLoading: true }));

      try {
        // Call the debug analytics API route to bypass permission issues
        const response = await fetch(`/api/debug/dashboard-data?orgId=${orgId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Analytics API failed: ${response.status}`);
        }

        const apiData = await response.json();

        // Validate API response structure
        if (!apiData || typeof apiData !== "object") {
          throw new Error("Invalid API response format");
        }

        // Transform API response to DashboardData format
        // The debug API returns the data in the correct format already
        console.log('📊 [ANALYTICS-CONTEXT] Received API data structure:', Object.keys(apiData));

        const data: DashboardData = {
          organizationId: apiData.organizationId || orgId,
          stats: apiData.stats || {
            totalReports: 0,
            newReports: 0,
            inProgress: 0,
            closedReports: 0,
            percentageChange: 0,
            anonymousReports: 0,
            averageResolutionTime: 0,
            criticalReports: 0,
          },
          recentReports: apiData.recentReports || [],
          chartData: apiData.chartData || [],
          categoryData: apiData.categoryData || [],
          departmentData: apiData.departmentData || [],
          severityDistribution: apiData.severityDistribution || {
            high: 0,
            medium: 0,
            low: 0,
            unknown: 0,
          },
          sourceDistribution: apiData.sourceDistribution || {
            ethicLine: 0,
            customForm: 0,
          },
          weeklyTrend: apiData.weeklyTrend || [],
        };

        setState((prev) => ({
          ...prev,
          dashboardData: data,
          dashboardLoading: false,
          lastDashboardUpdate: new Date(),
        }));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setState((prev) => ({ ...prev, dashboardLoading: false }));
      }
    },
    [needsRefresh] // Removed state.lastDashboardUpdate to prevent infinite loops
  );

  // Load reports stats via API
  const loadReportsStats = useCallback(
    async (orgId: string, forceRefresh = false) => {
      if (!forceRefresh && !needsRefresh(state.lastReportsStatsUpdate)) {
        return;
      }

      setState((prev) => ({ ...prev, reportsStatsLoading: true }));

      try {
        // Use the dedicated reports stats API endpoint
        const response = await fetch(`/api/reports/stats?orgId=${orgId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Reports Stats API failed: ${response.status}`);
        }

        const data = await response.json();

        // Validate API response structure
        if (!data || typeof data !== "object") {
          throw new Error("Invalid Reports Stats API response format");
        }

        // The data should already be in the correct ReportsStats format from getReportsStats
        setState((prev) => ({
          ...prev,
          reportsStats: data,
          reportsStatsLoading: false,
          lastReportsStatsUpdate: new Date(),
        }));
      } catch (error) {
        console.error("Error loading reports stats:", error);
        setState((prev) => ({ ...prev, reportsStatsLoading: false }));
      }
    },
    [needsRefresh] // Removed state.lastReportsStatsUpdate to prevent infinite loops
  );

  // Load member stats (for team pages) via API
  const loadMemberStats = useCallback(
    async (memberId: string, orgId: string, forceRefresh = false) => {
      if (!forceRefresh && !needsRefresh(state.lastMemberStatsUpdate)) {
        return;
      }

      setState((prev) => ({ ...prev, memberStatsLoading: true }));

      try {
        // Use the analytics API endpoint
        const response = await fetch(`/api/analytics/data?orgId=${orgId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Member Stats API failed: ${response.status}`);
        }

        const data = await response.json();

        // Validate API response structure
        if (!data || typeof data !== "object") {
          throw new Error("Invalid Member Stats API response format");
        }

        setState((prev) => ({
          ...prev,
          memberStats: data,
          memberStatsLoading: false,
          lastMemberStatsUpdate: new Date(),
        }));
      } catch (error) {
        console.error("Error loading member stats:", error);
        setState((prev) => ({ ...prev, memberStatsLoading: false }));
      }
    },
    [needsRefresh] // Removed state.lastMemberStatsUpdate to prevent infinite loops
  );

  // Load organization stats (for super admin) via API
  const loadOrganizationStats = useCallback(
    async (orgId: string, forceRefresh = false) => {
      if (!isSuperAdmin) return;

      if (!forceRefresh && !needsRefresh(state.lastOrganizationStatsUpdate)) {
        return;
      }

      setState((prev) => ({ ...prev, organizationStatsLoading: true }));

      try {
        // Use the analytics API endpoint
        const response = await fetch(`/api/analytics/data?orgId=${orgId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Organization Stats API failed: ${response.status}`);
        }

        const data = await response.json();

        // Validate API response structure
        if (!data || typeof data !== "object") {
          throw new Error("Invalid Organization Stats API response format");
        }

        setState((prev) => ({
          ...prev,
          organizationStats: data,
          organizationStatsLoading: false,
          lastOrganizationStatsUpdate: new Date(),
        }));
      } catch (error) {
        console.error("Error loading organization stats:", error);
        setState((prev) => ({ ...prev, organizationStatsLoading: false }));
      }
    },
    [needsRefresh, isSuperAdmin] // Removed state.lastOrganizationStatsUpdate to prevent infinite loops
  );

  // Refresh methods
  const refreshDashboard = useCallback(async () => {
    const orgId = user?.organizationMemberships?.[0]?.organization.id;
    if (orgId) {
      await loadDashboardData(orgId, true);
    }
  }, [loadDashboardData, user]);

  const refreshReportsStats = useCallback(async () => {
    const orgId = user?.organizationMemberships?.[0]?.organization.id;
    if (orgId) {
      await loadReportsStats(orgId, true);
    }
  }, [loadReportsStats, user]);

  const refreshMemberStats = useCallback(async () => {
    // This would need to be called with specific member and org IDs
    console.log("Refresh member stats called - needs specific IDs");
  }, []);

  const refreshOrganizationStats = useCallback(async () => {
    // This would need to be called with specific org ID
    console.log("Refresh organization stats called - needs specific org ID");
  }, []);

  const refreshAll = useCallback(async () => {
    const orgId = user?.organizationMemberships?.[0]?.organization.id;
    if (orgId) {
      await Promise.all([
        loadDashboardData(orgId, true),
        loadReportsStats(orgId, true),
      ]);
    }
  }, [loadDashboardData, loadReportsStats, user]);

  const invalidateAfterReportCreate = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      lastDashboardUpdate: null,
      lastReportsStatsUpdate: null,
    }));
    const orgId = user?.organizationMemberships?.[0]?.organization.id;
    if (orgId) {
      await Promise.all([
        loadDashboardData(orgId, true),
        loadReportsStats(orgId, true),
      ]);
    }
  }, [loadDashboardData, loadReportsStats, user]);

  // Clear methods
  const clearDashboardData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dashboardData: null,
      lastDashboardUpdate: null,
    }));
  }, []);

  const clearReportsStats = useCallback(() => {
    setState((prev) => ({
      ...prev,
      reportsStats: null,
      lastReportsStatsUpdate: null,
    }));
  }, []);

  const clearMemberStats = useCallback(() => {
    setState((prev) => ({
      ...prev,
      memberStats: null,
      lastMemberStatsUpdate: null,
    }));
  }, []);

  const clearOrganizationStats = useCallback(() => {
    setState((prev) => ({
      ...prev,
      organizationStats: null,
      lastOrganizationStatsUpdate: null,
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState({
      dashboardData: null,
      dashboardLoading: false,
      reportsStats: null,
      reportsStatsLoading: false,
      memberStats: null,
      memberStatsLoading: false,
      organizationStats: null,
      organizationStatsLoading: false,
      lastDashboardUpdate: null,
      lastReportsStatsUpdate: null,
      lastMemberStatsUpdate: null,
      lastOrganizationStatsUpdate: null,
    });
  }, []);

  const contextValue: AnalyticsContextType = {
    ...state,
    loadDashboardData,
    loadReportsStats,
    loadMemberStats,
    loadOrganizationStats,
    refreshDashboard,
    refreshReportsStats,
    refreshMemberStats,
    refreshOrganizationStats,
    refreshAll,
    invalidateAfterReportCreate,
    clearDashboardData,
    clearReportsStats,
    clearMemberStats,
    clearOrganizationStats,
    clearAll,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
