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
import { getDeadlineInfo } from "../../utils/dashboard.utils";
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
  superAdminScope?: "all" | "org";
  selectedOrganizationName?: string;
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
  superAdminScope = "org",
  selectedOrganizationName,
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

  useEffect(() => {
    const handleManualReportCreated = async () => {
      await refreshReportsStats();
      router.refresh();
    };
    window.addEventListener("manual-report-created", handleManualReportCreated);
    return () => {
      window.removeEventListener(
        "manual-report-created",
        handleManualReportCreated
      );
    };
  }, [refreshReportsStats, router]);

  // El plazo se calcula por tipología y fecha (getDeadlineInfo), así que el
  // filtro "Plazo de respuesta" se aplica aquí, sobre la página cargada.
  const slaFilter = searchParams.get("sla");
  const visibleReports =
    slaFilter && slaFilter !== "all"
      ? initialReports.filter(
          (r) =>
            getDeadlineInfo(r.priority, r.submittedAt, r.type).semaphore === slaFilter &&
            r.status !== "CLOSED" &&
            r.status !== "ARCHIVED",
        )
      : initialReports;

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
      showError("Selecciona al menos una denuncia");
      return;
    }

    startTransition(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await bulkUpdateReports(selectedReports, action as any, value);
        setSelectedReports([]);

        const actionMessages = {
          assign: "Responsable asignado",
          status: "Estado actualizado correctamente",
          priority: "Prioridad actualizada correctamente",
          archive: "Denuncias archivadas",
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

  const getPageDescription = () => {
    if (isSuperAdmin) {
      return superAdminScope === "all"
        ? "Administra reportes de todas las organizaciones"
        : `Vista filtrada por organización${selectedOrganizationName ? `: ${selectedOrganizationName}` : ""}`;
    } else if (userRole === "ORG_ADMIN") {
      return "Todas las denuncias de tu organización: revisa, asigna y da seguimiento hasta el cierre.";
    } else {
      return "Revisa y gestiona únicamente las denuncias que tienes asignadas";
    }
  };

  return (
    <div className="space-y-6">
      {/* La descripción de la vista ya está en el encabezado de la página; aquí solo la acción. */}
      <div className="-mt-2 flex justify-end">
        <Button
          size="sm"
          variant="light"
          onPress={handleRefreshStats}
          isDisabled={reportsStatsLoading}
          className="text-ev-mute"
          startContent={<i className="icon-[lucide--refresh-ccw] size-3.5" aria-hidden />}
        >
          {reportsStatsLoading ? "Actualizando…" : "Actualizar estadísticas"}
        </Button>
      </div>

      <ReportsHeader
        selectedCount={selectedReports.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onBulkAction={handleBulkAction}
      />

      {!isSuperAdmin && userRole !== "ORG_ADMIN" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          Estás en vista de investigador: solo ves casos asignados a ti para mantener foco operativo y cumplimiento de SLA.
        </div>
      )}

      {/* Show stats only if available. Detailed stats are per-organization
          (loadReportsStats is only called when organizationId is set, just
          below) — the superadmin's global "all organizations" scope has no
          single orgId to fetch them for, which isn't a failure and
          shouldn't read as one. */}
      {reportsStats ? (
        <ReportsStats stats={reportsStats} />
      ) : (
        <div className="text-center py-8">
          {reportsStatsLoading ? (
            <p className="text-slate-400">Cargando estadísticas...</p>
          ) : !organizationId ? (
            <p className="text-slate-400">
              Selecciona una organización específica para ver sus estadísticas detalladas.
            </p>
          ) : (
            <p className="text-slate-400">
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
          reports={visibleReports}
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
