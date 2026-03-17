"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportFilters, ReportItem } from "@/types/reports";
import { Button } from "@heroui/react";
import { bulkUpdateReports } from "@/actions/reports.actions";
import { ReportsHeader } from "./ReportsHeader";
import { ReportsStats } from "./ReportsStats";
import { ReportsFilters } from "./ReportsFilters";
import { ReportsTable } from "./ReportsTable";
import { useAnalytics } from "../../context/AnalyticsContext";
import { useSafeToast } from "../../hooks/useSafeToast";

interface ReportsContentProps {
  initialReports: ReportItem[];
  initialFilters: ReportFilters;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  userRole: string;
  isSuperAdmin: boolean;
  userId: string;
  organizationId?: string;
  isArchivedView?: boolean; // New prop for archived reports view
}

export function ReportsContent({
  initialReports,
  initialFilters,
  totalCount,
  currentPage,
  pageSize,
  userRole,
  isSuperAdmin,
  organizationId,
  isArchivedView = false, // Default to false
}: ReportsContentProps) {
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">(
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(max-width: 767px)").matches
        ? "cards"
        : "table"
      : "table"
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useSafeToast();

  // Use analytics context
  const {
    reportsStats,
    reportsStatsLoading,
    loadReportsStats,
    refreshReportsStats,
  } = useAnalytics();

  // Load reports stats when component mounts or organization changes
  useEffect(() => {
    if (organizationId) {
      loadReportsStats(organizationId, true); // Force refresh on mount
    }
  }, [loadReportsStats, organizationId, searchParams]); // Fixed: Now loadReportsStats has stable reference

  const handleFiltersChange = (filters: ReportFilters) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete("page"); // Reset to first page when filters change

    // Set appropriate tab parameter based on view
    if (isArchivedView) {
      params.set("tab", "archived");
    } else {
      params.set("tab", "active");
    }

    // Navigate to reports page with updated parameters
    router.push(`/app/reports?${params.toString()}`);
  };

  const handleBulkAction = async (action: string, value?: string) => {
    if (action === "clear") {
      setSelectedReports([]);
      return;
    }

    if (selectedReports.length === 0) {
      showError("Selecciona al menos un reporte");
      return;
    }

    startTransition(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await bulkUpdateReports(selectedReports, action as any, value);
        setSelectedReports([]);

        const actionMessages = {
          assign: "Reportes asignados correctamente",
          status: "Estado actualizado correctamente",
          priority: "Prioridad actualizada correctamente",
          archive: "Reportes archivados correctamente",
        };

        showSuccess(
          actionMessages[action as keyof typeof actionMessages] ||
            "Acción completada"
        );

        // Refresh analytics data after bulk action
        await refreshReportsStats();
        router.refresh();
      } catch (error) {
        console.error("Error applying bulk action:", error);
        showError("Error al aplicar la acción", "Por favor intenta nuevamente");
      }
    });
  };

  const handleRefreshStats = async () => {
    try {
      await refreshReportsStats();
      showSuccess("Estadísticas actualizadas");
    } catch {
      showError("Error al actualizar estadísticas");
    }
  };

  // Show different header based on user role
  const getPageTitle = () => {
    if (isSuperAdmin) {
      return "Gestión Global de Reportes";
    } else if (userRole === "ADMIN") {
      return "Gestión de Reportes";
    } else {
      return "Mis Reportes Asignados";
    }
  };

  const getPageDescription = () => {
    if (isSuperAdmin) {
      return "Administra reportes de todas las organizaciones";
    } else if (userRole === "ADMIN") {
      return "Administra y da seguimiento a todas las denuncias de tu organización";
    } else {
      return "Revisa y gestiona únicamente los reportes que tienes asignados";
    }
  };

  return (
    <div className="space-y-6">
      {/* Custom header for role-based content */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {getPageDescription()}
          </p>
        </div>

        {/* Refresh button for stats */}
        <Button
          onPress={handleRefreshStats}
          disabled={reportsStatsLoading}
          className="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          {reportsStatsLoading ? "Actualizando..." : "Actualizar Estadísticas"}
        </Button>
      </div>

      <ReportsHeader
        selectedCount={selectedReports.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onBulkAction={handleBulkAction}
      />

      {/* Show stats only if available */}
      {reportsStats ? (
        <ReportsStats stats={reportsStats} />
      ) : (
        <div className="text-center py-8">
          {reportsStatsLoading ? (
            <p className="text-gray-500">Cargando estadísticas...</p>
          ) : (
            <p className="text-gray-500">
              No se pudieron cargar las estadísticas
            </p>
          )}
        </div>
      )}

      {/* Filter component with role-based restrictions */}
      <ReportsFilters
        filters={initialFilters}
        onFiltersChange={handleFiltersChange}
        isArchivedView={isArchivedView}
      />

      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <ReportsTable
          reports={initialReports}
          filters={initialFilters}
          selectedReports={selectedReports}
          onSelectionChange={setSelectedReports}
          viewMode={viewMode}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
