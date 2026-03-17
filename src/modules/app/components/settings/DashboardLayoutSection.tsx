"use client";

import { useState, useEffect } from "react";
import { Button, Switch, Chip } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";

interface DashboardLayoutSectionProps {
  organizationId: string;
}

interface DashboardElement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isVisible: boolean;
  position: number;
  size: "small" | "medium" | "large";
}

const DEFAULT_ELEMENTS: DashboardElement[] = [
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
    id: "recent-reports",
    name: "Reportes Recientes",
    description: "Lista de los últimos reportes recibidos",
    icon: "icon-[lucide--file-text]",
    isVisible: true,
    position: 2,
    size: "medium",
  },
  {
    id: "assigned-reports",
    name: "Reportes Asignados",
    description: "Reportes asignados al usuario actual",
    icon: "icon-[lucide--user-check]",
    isVisible: true,
    position: 3,
    size: "medium",
  },
  {
    id: "department-analysis",
    name: "Análisis por Departamento",
    description: "Distribución de reportes por departamento",
    icon: "icon-[lucide--building]",
    isVisible: true,
    position: 4,
    size: "large",
  },
  {
    id: "severity-chart",
    name: "Gráfico de Severidad",
    description: "Distribución de reportes por nivel de severidad",
    icon: "icon-[lucide--alert-triangle]",
    isVisible: true,
    position: 5,
    size: "medium",
  },
  {
    id: "timeline-activity",
    name: "Línea de Tiempo",
    description: "Actividad reciente en la plataforma",
    icon: "icon-[lucide--clock]",
    isVisible: false,
    position: 6,
    size: "large",
  },
];

export function DashboardLayoutSection({
  organizationId,
}: DashboardLayoutSectionProps) {
  const [elements, setElements] =
    useState<DashboardElement[]>(DEFAULT_ELEMENTS);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);

  // Load current dashboard layout on component mount
  useEffect(() => {
    const loadCurrentLayout = async () => {
      try {
        const response = await fetch(
          `/api/organization/settings?orgId=${organizationId}`
        );
        if (response.ok) {
          const settings = await response.json();
          if (
            settings.dashboardLayout &&
            Array.isArray(settings.dashboardLayout)
          ) {
            setElements(settings.dashboardLayout);
          }
        }
      } catch (error) {
        console.error("Error loading current layout:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentLayout();
  }, [organizationId]);

  const handleVisibilityToggle = (elementId: string) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId ? { ...el, isVisible: !el.isVisible } : el
      )
    );
  };

  const handleSizeChange = (
    elementId: string,
    newSize: "small" | "medium" | "large"
  ) => {
    setElements((prev) =>
      prev.map((el) => (el.id === elementId ? { ...el, size: newSize } : el))
    );
  };

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();

    if (!draggedElement || draggedElement === targetId) return;

    setElements((prev) => {
      const draggedIndex = prev.findIndex((el) => el.id === draggedElement);
      const targetIndex = prev.findIndex((el) => el.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newElements = [...prev];
      const [draggedItem] = newElements.splice(draggedIndex, 1);
      newElements.splice(targetIndex, 0, draggedItem);

      // Update positions
      return newElements.map((el, index) => ({
        ...el,
        position: index + 1,
      }));
    });

    setDraggedElement(null);
  };

  const handleSaveLayout = async () => {
    setSaving(true);

    try {
      const response = await fetch(
        "/api/organization/dashboard-layout/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationId,
            layout: elements,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al guardar la configuración");
      }

      addToast({
        title: "Configuración guardada",
        description: "El diseño del dashboard ha sido actualizado exitosamente",
        color: "success",
      });
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo guardar la configuración. Intenta nuevamente",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetLayout = () => {
    setElements(DEFAULT_ELEMENTS);
    addToast({
      title: "Configuración restablecida",
      description:
        "El diseño ha sido restablecido a la configuración predeterminada",
      color: "success",
    });
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case "small":
        return "secondary";
      case "medium":
        return "primary";
      case "large":
        return "success";
      default:
        return "default";
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case "small":
        return "Pequeño";
      case "medium":
        return "Mediano";
      case "large":
        return "Grande";
      default:
        return size;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <i className="icon-[lucide--info] size-5 text-blue-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-800">
              Personalización del Dashboard
            </h5>
            <p className="text-sm text-blue-700 mt-1">
              Arrastra y suelta los elementos para reordenarlos. Usa los
              switches para mostrar/ocultar elementos y cambia el tamaño según
              tus necesidades.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-900">
            Elementos del Dashboard
          </h4>
          <div className="flex gap-2">
            <Button
              variant="flat"
              color="secondary"
              size="sm"
              onPress={handleResetLayout}
            >
              <i className="icon-[lucide--rotate-ccw] size-4 mr-2" />
              Restablecer
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {elements.map((element) => (
            <div
              key={element.id}
              draggable
              onDragStart={(e) => handleDragStart(e, element.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, element.id)}
              className={`border rounded-lg p-4 bg-white cursor-move transition-all hover:shadow-md ${
                draggedElement === element.id
                  ? "opacity-50 transform rotate-2"
                  : ""
              } ${!element.isVisible ? "opacity-60 bg-gray-50" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                    <i className={`${element.icon} size-4 text-gray-600`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900">
                        {element.name}
                      </h5>
                      <Chip
                        size="sm"
                        color={getSizeColor(element.size)}
                        variant="flat"
                      >
                        {getSizeLabel(element.size)}
                      </Chip>
                    </div>
                    <p className="text-sm text-gray-600">
                      {element.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {["small", "medium", "large"].map((size) => (
                      <Button
                        key={size}
                        size="sm"
                        variant={element.size === size ? "solid" : "flat"}
                        color={
                          element.size === size ? getSizeColor(size) : "default"
                        }
                        onPress={() =>
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          handleSizeChange(element.id, size as any)
                        }
                        className="min-w-0 px-2"
                      >
                        {size === "small" && (
                          <i className="icon-[lucide--minus] size-3" />
                        )}
                        {size === "medium" && (
                          <i className="icon-[lucide--equal] size-3" />
                        )}
                        {size === "large" && (
                          <i className="icon-[lucide--plus] size-3" />
                        )}
                      </Button>
                    ))}
                  </div>

                  <Switch
                    isSelected={element.isVisible}
                    onValueChange={() => handleVisibilityToggle(element.id)}
                    size="sm"
                  />

                  <div className="flex items-center gap-1 text-gray-400">
                    <i className="icon-[lucide--grip-vertical] size-4" />
                    <i className="icon-[lucide--grip-vertical] size-4 -ml-2" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-medium text-gray-900">Guardar Configuración</h5>
            <p className="text-sm text-gray-600">
              Los cambios se aplicarán a tu dashboard inmediatamente
            </p>
          </div>

          <Button
            color="primary"
            onPress={handleSaveLayout}
            isLoading={saving}
            isDisabled={saving}
          >
            <i className="icon-[lucide--save] size-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
