"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  // addToast, // Now using safe-toast
} from "@heroui/react";
import { TotalReportsChart } from "./TotalReportsChart";
import { StatusDistributionChart } from "./StatusDistributionChart";
import { DepartmentReportsChart } from "./DepartmentReportsChart";
import { TeamPerformanceMetrics } from "./TeamPerformanceMetrics";
import { ResolutionTimeMetrics } from "./ResolutionTimeMetrics";
import { ReportTypesChart } from "./ReportTypesChart";
import { DownloadReportModal } from "./DownloadReportModal";
import { addToast } from "@/modules/core/utils/safe-toast";

interface AnalyticsContentProps {
  organizationId: string;
}

interface AnalyticsData {
  totalReports: {
    current: number;
    trend: Array<{ date: string; count: number }>;
    change: number;
  };
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  departmentReports: Array<{
    department: string;
    count: number;
  }>;
  teamPerformance: {
    activeInvestigators: number;
    averageResolutionTime: number;
    productivityScore: number;
    assignments: Array<{
      investigator: string;
      email: string;
      role: string;
      assignedCount: number;
      resolvedCount: number;
      avgTime: number;
      productivityScore: number;
    }>;
  };
  reportTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  memberPerformance: Array<{
    investigator: string;
    email: string;
    role: string;
    assignedCount: number;
    resolvedCount: number;
    avgTime: number;
    productivityScore: number;
  }>;
  organizationMetrics: {
    totalMembers: number;
    activeMembersWithReports: number;
    averageReportsPerMember: number;
    topPerformer: {
      investigator: string;
      email: string;
      role: string;
      assignedCount: number;
      resolvedCount: number;
      avgTime: number;
      productivityScore: number;
    } | null;
  };
  slaOrangeCount?: number;
  slaRedCount?: number;
}

export function AnalyticsContent({ organizationId }: AnalyticsContentProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadModal, setDownloadModal] = useState<{
    isOpen: boolean;
    reportType: string;
    title: string;
  }>({
    isOpen: false,
    reportType: "",
    title: "",
  });
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const setDownloadingKey = (key: string, value: boolean) =>
    setDownloading((prev) => ({ ...prev, [key]: value }));
  const isDownloading = (format: "pdf" | "xlsx", reportType: string) =>
    !!downloading[`${format}:${reportType}`];

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/data?orgId=${organizationId}`
      );

      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handleDownloadReport = async (
    format: "pdf" | "xlsx",
    reportType: string
  ) => {
    const key = `${format}:${reportType}`;
    try {
      setDownloadingKey(key, true);
      const response = await fetch("/api/analytics/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId: organizationId,
          format,
          reportType,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar la descarga");
      }

      // Check if response is HTML (fallback) or actual binary content
      const contentType = response.headers.get("content-type");
      const blob = await response.blob();

      if (contentType?.includes("text/html")) {
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");

        addToast({
          title: "Reporte generado",
          description:
            "El reporte se abrió en una nueva pestaña. Puedes guardarlo como PDF usando Ctrl+P",
          color: "success",
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;

        const fileExtension = format === "pdf" ? "pdf" : "xlsx";
        a.download = `ethicvoice-analytics-${reportType}-${
          new Date().toISOString().split("T")[0]
        }.${fileExtension}`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        addToast({
          title: "Descarga exitosa",
          description: `El reporte ha sido descargado en formato ${format.toUpperCase()}`,
          color: "success",
        });
      }
    } catch {
      addToast({
        title: "Error en la descarga",
        description: "No se pudo generar el reporte. Intenta nuevamente",
        color: "danger",
      });
    } finally {
      setDownloadingKey(key, false);
    }
  };

  const closeDownloadModal = () => {
    setDownloadModal({
      isOpen: false,
      reportType: "",
      title: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" color="primary" />
        <span className="ml-3 text-gray-600">Cargando analíticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <i className="icon-[lucide--alert-circle] size-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error al cargar datos
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button color="primary" onPress={fetchAnalyticsData}>
          <i className="icon-[lucide--refresh-cw] size-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* SLA Alert Banner */}
      {data && (data.slaOrangeCount || data.slaRedCount) && (
        <div className="border rounded-md p-3 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3 text-sm">
            <i className="icon-[lucide--traffic-cone] size-4 text-yellow-600" />
            <span className="text-gray-800">
              {data.slaRedCount ? `${data.slaRedCount} caso(s) vencidos` : ""}
              {data.slaRedCount && data.slaOrangeCount ? " • " : ""}
              {data.slaOrangeCount
                ? `${data.slaOrangeCount} próximo(s) a vencer`
                : ""}
            </span>
          </div>
        </div>
      )}
      {/* Organization Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Resumen Organizacional
            </h3>
            <p className="text-gray-600 text-sm">
              Métricas clave de la organización y equipo de trabajo
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="flat"
              color="primary"
              size="sm"
              isLoading={isDownloading("xlsx", "total-reports")}
              isDisabled={isDownloading("pdf", "total-reports")}
              onPress={() => handleDownloadReport("xlsx", "total-reports")}
            >
              <i className="icon-[lucide--download] size-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="flat"
              color="primary"
              size="sm"
              isLoading={isDownloading("pdf", "organization-overview")}
              isDisabled={isDownloading("xlsx", "organization-overview")}
              onPress={() =>
                handleDownloadReport("pdf", "organization-overview")
              }
            >
              <i className="icon-[lucide--download] size-4 mr-2" />
              Descargar Resumen
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-900">
                {data.organizationMetrics.totalMembers}
              </div>
              <div className="text-sm text-blue-600">Total Miembros</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-900">
                {data.organizationMetrics.activeMembersWithReports}
              </div>
              <div className="text-sm text-green-600">Miembros Activos</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-900">
                {data.organizationMetrics.averageReportsPerMember}
              </div>
              <div className="text-sm text-purple-600">Reportes/Miembro</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-900">
                {data.organizationMetrics.topPerformer?.productivityScore || 0}%
              </div>
              <div className="text-sm text-orange-600">Top Performance</div>
            </div>
          </div>

          {data.organizationMetrics.topPerformer && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <i className="icon-[lucide--award] size-5 text-blue-600" />
                <div>
                  <h5 className="font-medium text-blue-800">Top Performer</h5>
                  <p className="text-sm text-blue-700">
                    {data.organizationMetrics.topPerformer.investigator} lidera
                    con{" "}
                    {data.organizationMetrics.topPerformer.productivityScore}%
                    de productividad (
                    {data.organizationMetrics.topPerformer.resolvedCount} casos
                    resueltos de{" "}
                    {data.organizationMetrics.topPerformer.assignedCount}{" "}
                    asignados)
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Total Reports Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Total de Denuncias Recibidas
            </h3>
            <p className="text-gray-600 text-sm">
              Tendencia de denuncias recibidas en el tiempo
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="flat"
              color="primary"
              size="sm"
              isLoading={isDownloading("xlsx", "total-reports")}
              isDisabled={isDownloading("pdf", "total-reports")}
              onPress={() => handleDownloadReport("xlsx", "total-reports")}
            >
              <i className="icon-[lucide--download] size-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="flat"
              color="primary"
              size="sm"
              isLoading={isDownloading("pdf", "total-reports")}
              isDisabled={isDownloading("xlsx", "total-reports")}
              onPress={() => handleDownloadReport("pdf", "total-reports")}
            >
              <i className="icon-[lucide--download] size-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <TotalReportsChart data={data.totalReports} />
        </CardBody>
      </Card>

      {/* Status Distribution and Department Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Estado de las Denuncias
              </h3>
              <p className="text-gray-600 text-sm">
                Distribución por estado actual
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                color="primary"
                size="sm"
                isLoading={isDownloading("xlsx", "status-distribution")}
                isDisabled={isDownloading("pdf", "status-distribution")}
                onPress={() =>
                  handleDownloadReport("xlsx", "status-distribution")
                }
              >
                <i className="icon-[lucide--download] size-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="flat"
                color="primary"
                size="sm"
                isLoading={isDownloading("pdf", "status-distribution")}
                isDisabled={isDownloading("xlsx", "status-distribution")}
                onPress={() =>
                  handleDownloadReport("pdf", "status-distribution")
                }
              >
                <i className="icon-[lucide--download] size-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <StatusDistributionChart data={data.statusDistribution} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Denuncias por Departamento
              </h3>
              <p className="text-gray-600 text-sm">
                Distribución por área organizacional
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                color="primary"
                size="sm"
                isLoading={isDownloading("xlsx", "department-reports")}
                isDisabled={isDownloading("pdf", "department-reports")}
                onPress={() =>
                  handleDownloadReport("xlsx", "department-reports")
                }
              >
                <i className="icon-[lucide--download] size-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="flat"
                color="primary"
                size="sm"
                isLoading={isDownloading("pdf", "department-reports")}
                isDisabled={isDownloading("xlsx", "department-reports")}
                onPress={() =>
                  handleDownloadReport("pdf", "department-reports")
                }
              >
                <i className="icon-[lucide--download] size-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <DepartmentReportsChart data={data.departmentReports} />
          </CardBody>
        </Card>
      </div>

      {/* Team Performance Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Rendimiento del Equipo de Resolución
            </h3>
            <p className="text-gray-600 text-sm">
              Métricas de productividad y eficiencia del equipo (excluye super
              admin)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="flat"
              color="primary"
              size="sm"
              isLoading={isDownloading("xlsx", "team-performance")}
              isDisabled={isDownloading("pdf", "team-performance")}
              onPress={() => handleDownloadReport("xlsx", "team-performance")}
            >
              <i className="icon-[lucide--download] size-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="flat"
              color="primary"
              size="sm"
              isLoading={isDownloading("pdf", "team-performance")}
              isDisabled={isDownloading("xlsx", "team-performance")}
              onPress={() => handleDownloadReport("pdf", "team-performance")}
            >
              <i className="icon-[lucide--download] size-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <TeamPerformanceMetrics data={data.teamPerformance} />
        </CardBody>
      </Card>

      {/* Resolution Time and Report Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Tiempo Promedio de Resolución
              </h3>
              <p className="text-gray-600 text-sm">
                Análisis de tiempos de respuesta
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                color="primary"
                size="sm"
                isLoading={isDownloading("xlsx", "resolution-time")}
                isDisabled={isDownloading("pdf", "resolution-time")}
                onPress={() => handleDownloadReport("xlsx", "resolution-time")}
              >
                <i className="icon-[lucide--download] size-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="flat"
                color="primary"
                size="sm"
                isLoading={isDownloading("pdf", "resolution-time")}
                isDisabled={isDownloading("xlsx", "resolution-time")}
                onPress={() => handleDownloadReport("pdf", "resolution-time")}
              >
                <i className="icon-[lucide--download] size-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <ResolutionTimeMetrics organizationId={organizationId} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Tipos de Denuncias Más Comunes
              </h3>
              <p className="text-gray-600 text-sm">
                Categorización por tipo de irregularidad
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                color="primary"
                size="sm"
                isLoading={isDownloading("xlsx", "report-types")}
                isDisabled={isDownloading("pdf", "report-types")}
                onPress={() => handleDownloadReport("xlsx", "report-types")}
              >
                <i className="icon-[lucide--download] size-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="flat"
                color="primary"
                size="sm"
                isLoading={isDownloading("pdf", "report-types")}
                isDisabled={isDownloading("xlsx", "report-types")}
                onPress={() => handleDownloadReport("pdf", "report-types")}
              >
                <i className="icon-[lucide--download] size-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <ReportTypesChart data={data.reportTypes} />
          </CardBody>
        </Card>
      </div>

      {/* Download Modal */}
      <DownloadReportModal
        isOpen={downloadModal.isOpen}
        onClose={closeDownloadModal}
        reportType={downloadModal.reportType}
        reportTitle={downloadModal.title}
        organizationId={organizationId}
      />
    </div>
  );
}
