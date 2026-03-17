"use client";

import React, { useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { useUser } from "@clerk/nextjs";
import { UserRole } from "@/types/auth.types";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { SuperAdminDashboard } from "./super-admin/SuperAdminDashboard";
import { MemberDashboard } from "./member/MemberDashboard";
import { AdminDashboard } from "./admin/AdminDashboard";
import { useAnalytics } from "../../context/AnalyticsContext";

interface ReportsDashboardProps {
  organizationId: string;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  organizationId,
}) => {
  const { role, isSuperAdmin, isLoading: roleLoading } = useUserRole();
  const { user } = useUser();

  // Use analytics context
  const {
    dashboardData,
    dashboardLoading,
    loadDashboardData,
    refreshDashboard,
  } = useAnalytics();

  // Load dashboard data when component mounts or org changes
  useEffect(() => {
    if (organizationId) {
      loadDashboardData(organizationId);
    }
  }, [organizationId, loadDashboardData]);

  useEffect(() => {
    const handleManualReportCreated = async () => {
      await refreshDashboard(organizationId);
    };
    window.addEventListener("manual-report-created", handleManualReportCreated);
    return () => {
      window.removeEventListener(
        "manual-report-created",
        handleManualReportCreated
      );
    };
  }, [refreshDashboard, organizationId]);

  const handleRefresh = async () => {
    try {
      await refreshDashboard(organizationId);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    }
  };

  if (dashboardLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Super Admin gets a different dashboard
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">No hay datos disponibles</p>
        <Button
          color="primary"
          onPress={handleRefresh}
          isLoading={dashboardLoading}
        >
          Cargar Datos
        </Button>
      </div>
    );
  }

  // Add organizationId to data for child components
  const enrichedData = { ...dashboardData, organizationId };

  // Render dashboard based on user role
  if (role === UserRole.ORG_MEMBER) {
    return (
      <MemberDashboard
        data={enrichedData}
        userId={user?.id || ""}
        onRefresh={handleRefresh}
        refreshing={dashboardLoading}
      />
    );
  }

  // Organization Admin
  return (
    <AdminDashboard
      data={enrichedData}
      onRefresh={handleRefresh}
      refreshing={dashboardLoading}
      isSuperAdmin={false}
    />
  );
};
