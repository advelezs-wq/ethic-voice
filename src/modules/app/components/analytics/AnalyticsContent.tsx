"use client";

import Link from "next/link";
import { MetricStrip } from "@/modules/app/components/ui";

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
import {
  TypologyIntelligenceSection,
  type TypologyIntelligenceData,
} from "./TypologyIntelligenceSection";
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
  typologyIntelligence?: TypologyIntelligenceData;
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
    // Abrimos la pestaña de forma síncrona, dentro del gesto del clic — si se
    // abre después de un await, algunos navegadores la bloquean como popup.
    const pendingTab = format === "pdf" ? window.open("", "_blank") : null;
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
        if (pendingTab) {
          pendingTab.location.href = url;
        } else {
          window.open(url, "_blank");
        }

        addToast({
          title: "Informe generado",
          description:
            "El informe se abrió en una nueva pestaña. Puedes guardarlo como PDF con Ctrl+P",
          color: "success",
        });
      } else {
        pendingTab?.close();
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
          description: `El informe se descargó en formato ${format.toUpperCase()}`,
          color: "success",
        });
      }
    } catch {
      pendingTab?.close();
      addToast({
        title: "Error en la descarga",
        description: "No se pudo generar el informe. Intenta nuevamente",
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
        <span className="ml-3 text-slate-500">Cargando analíticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <i className="icon-[lucide--alert-circle] size-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-ev-night mb-2">
          Error al cargar datos
        </h3>
        <p className="text-slate-500 mb-4">{error}</p>
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
      {/* Aviso de plazos: frase completa y enlace a la lista filtrada */}
      {data && (data.slaOrangeCount || data.slaRedCount) ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F4D49D] bg-[#FDF6EA] px-4 py-3 text-sm">
          <span className="flex items-center gap-2.5 text-ev-night">
            <i className="icon-[lucide--clock-alert] size-4 text-[#8C5C15]" aria-hidden />
            {data.slaRedCount
              ? `${data.slaRedCount} ${data.slaRedCount === 1 ? "denuncia tiene" : "denuncias tienen"} el plazo de respuesta vencido`
              : ""}
            {data.slaRedCount && data.slaOrangeCount ? " y " : ""}
            {data.slaOrangeCount
              ? `${data.slaOrangeCount} ${data.slaOrangeCount === 1 ? "está por vencer" : "están por vencer"}`
              : ""}
            .
          </span>
          <Link href="/app/reports?sla=red" className="font-medium text-ev-night underline decoration-[#E09A2B] underline-offset-4">
            Ver denuncias vencidas
          </Link>
        </div>
      ) : null}
      {/* Organization Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
              Tu equipo
            </h3>
            <p className="text-sm text-ev-mute">
              Cuántas personas participan y cómo se reparte el trabajo
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
              Descargar resumen PDF
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <MetricStrip
            size="md"
            metrics={[
              { key: "members", label: "Personas en el equipo", value: data.organizationMetrics.totalMembers, tone: "slate" },
              {
                key: "active",
                label: "Con denuncias asignadas",
                value: data.organizationMetrics.activeMembersWithReports,
                tone: "signal",
                caption: "Personas trabajando casos ahora",
              },
              {
                key: "avg",
                label: "Denuncias por persona",
                value: data.organizationMetrics.averageReportsPerMember,
                tone: "haze",
                caption: "Carga promedio del equipo",
              },
            ]}
          />
        </CardBody>
      </Card>

      {/* Total Reports Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
              Denuncias recibidas
            </h3>
            <p className="text-sm text-ev-mute">
              Cuántas llegan cada mes y si van en aumento
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
              <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                En qué etapa están
              </h3>
              <p className="text-sm text-ev-mute">
                Cuántas están pendientes, en investigación o cerradas
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
              <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                Por departamento
              </h3>
              <p className="text-sm text-ev-mute">
                Áreas de la organización donde se concentran los casos
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
            <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
              Avance del equipo
            </h3>
            <p className="text-sm text-ev-mute">
              Denuncias asignadas y resueltas por cada investigador
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
              <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                Tiempo de resolución
              </h3>
              <p className="text-sm text-ev-mute">
                Cuánto tardan en cerrarse los casos, de la recepción al cierre
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
              <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                Tipos de denuncia más comunes
              </h3>
              <p className="text-sm text-ev-mute">
                Las conductas más reportadas
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

      {/* Inteligencia de Tipologías */}
      {data.typologyIntelligence && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-base font-semibold tracking-[-0.015em] text-ev-night">
                Tipologías detectadas por la IA
              </h3>
              <p className="text-sm text-ev-mute">
                Cómo cambia cada tipo de conducta mes a mes
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <TypologyIntelligenceSection data={data.typologyIntelligence} />
          </CardBody>
        </Card>
      )}

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
