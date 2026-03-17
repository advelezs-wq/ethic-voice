import { useState, useEffect } from "react";

interface DashboardElement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isVisible: boolean;
  position: number;
  size: "small" | "medium" | "large";
}

interface DashboardLayoutHook {
  elements: DashboardElement[];
  loading: boolean;
  error: string | null;
  refreshLayout: () => Promise<void>;
}

export function useDashboardLayout(
  organizationId: string
): DashboardLayoutHook {
  const [elements, setElements] = useState<DashboardElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLayout = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/organization/settings?orgId=${organizationId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load dashboard layout");
      }

      const settings = await response.json();

      if (settings.dashboardLayout && Array.isArray(settings.dashboardLayout)) {
        setElements(settings.dashboardLayout);
      } else {
        // Use default layout if none exists
        setElements(getDefaultElements());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setElements(getDefaultElements());
    } finally {
      setLoading(false);
    }
  };

  const refreshLayout = async () => {
    await loadLayout();
  };

  useEffect(() => {
    loadLayout();
  }, [organizationId]);

  return {
    elements,
    loading,
    error,
    refreshLayout,
  };
}

function getDefaultElements(): DashboardElement[] {
  return [
    {
      id: "stats-cards",
      name: "Tarjetas de Estadísticas",
      description:
        "Resumen de métricas principales (total reportes, pendientes, etc.)",
      icon: "icon-[lucide--bar-chart-3]",
      isVisible: true,
      position: 1,
      size: "large",
    },
    {
      id: "secondary-metrics",
      name: "Métricas Secundarias",
      description: "Denuncias anónimas, tiempo de resolución y reportes críticos",
      icon: "icon-[lucide--activity]",
      isVisible: true,
      position: 2,
      size: "large",
    },
    {
      id: "recent-reports",
      name: "Reportes Recientes",
      description: "Lista de los últimos reportes recibidos",
      icon: "icon-[lucide--file-text]",
      isVisible: true,
      position: 3,
      size: "large",
    },
    {
      id: "weekly-trend",
      name: "Tendencia Semanal",
      description: "Gráfico de reportes por semana",
      icon: "icon-[lucide--trending-up]",
      isVisible: true,
      position: 4,
      size: "medium",
    },
    {
      id: "statistics-chart",
      name: "Gráfico de Estadísticas",
      description: "Distribución de reportes por categoría",
      icon: "icon-[lucide--pie-chart]",
      isVisible: true,
      position: 5,
      size: "medium",
    },
    {
      id: "department-analysis",
      name: "Análisis por Departamento",
      description: "Estadísticas agrupadas por departamento",
      icon: "icon-[lucide--users]",
      isVisible: true,
      position: 6,
      size: "large",
    },
    {
      id: "severity-indicator",
      name: "Indicador de Severidad",
      description: "Distribución de reportes por nivel de severidad",
      icon: "icon-[lucide--alert-triangle]",
      isVisible: true,
      position: 7,
      size: "small",
    },
    {
      id: "category-distribution",
      name: "Distribución por Categoría",
      description: "Reportes organizados por tipo de incidencia",
      icon: "icon-[lucide--tag]",
      isVisible: true,
      position: 8,
      size: "small",
    },
  ];
}
