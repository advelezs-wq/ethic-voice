/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button, Switch, Chip, Card, CardBody } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
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
    id: "weekly-trend",
    name: "Tendencia Semanal",
    description: "Gráfico de reportes por semana",
    icon: "icon-[lucide--trending-up]",
    isVisible: true,
    position: 3,
    size: "medium",
  },
  {
    id: "statistics-chart",
    name: "Gráfico de Estadísticas",
    description: "Distribución de reportes por categoría",
    icon: "icon-[lucide--pie-chart]",
    isVisible: true,
    position: 4,
    size: "medium",
  },
  {
    id: "department-analysis",
    name: "Análisis por Departamento",
    description: "Estadísticas agrupadas por departamento",
    icon: "icon-[lucide--users]",
    isVisible: true,
    position: 5,
    size: "large",
  },
  {
    id: "severity-indicator",
    name: "Indicador de Severidad",
    description: "Distribución de reportes por nivel de severidad",
    icon: "icon-[lucide--alert-triangle]",
    isVisible: true,
    position: 6,
    size: "small",
  },
  {
    id: "category-distribution",
    name: "Distribución por Categoría",
    description: "Reportes organizados por tipo de incidencia",
    icon: "icon-[lucide--tag]",
    isVisible: true,
    position: 7,
    size: "small",
  },
];

export function EnhancedDashboardLayoutSection({
  organizationId,
}: DashboardLayoutSectionProps) {
  const [elements, setElements] =
    useState<DashboardElement[]>(DEFAULT_ELEMENTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOverElement, setDragOverElement] = useState<string | null>(null);

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

    // Add visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedElement(null);
    setDragOverElement(null);

    // Reset visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent, elementId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverElement(elementId);
  };

  const handleDragLeave = () => {
    setDragOverElement(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverElement(null);

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
      title: "Layout restablecido",
      description:
        "El diseño del dashboard ha sido restablecido al diseño por defecto",
      color: "success",
    });
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case "small":
        return "primary";
      case "medium":
        return "secondary";
      case "large":
        return "success";
      default:
        return "default";
    }
  };

  const getSizeIcon = (size: string) => {
    switch (size) {
      case "small":
        return "icon-[lucide--minimize-2]";
      case "medium":
        return "icon-[lucide--square]";
      case "large":
        return "icon-[lucide--maximize-2]";
      default:
        return "icon-[lucide--square]";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const visibleElements = elements.filter((el) => el.isVisible);
  const hiddenElements = elements.filter((el) => !el.isVisible);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Personalización del Dashboard
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Arrastra y suelta los elementos para cambiar su orden. Usa los
            controles para ajustar tamaño y visibilidad.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="bordered"
            onPress={handleResetLayout}
            className="font-medium"
          >
            <i className="icon-[lucide--rotate-ccw] size-4 mr-2" />
            Restablecer al Diseño Base
          </Button>
          <Button
            color="primary"
            onPress={handleSaveLayout}
            isLoading={saving}
            className="font-medium text-secondary"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      {/* Visible Elements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <i className="icon-[lucide--eye] size-5 text-green-600" />
          <h4 className="font-medium text-gray-900">
            Elementos Visibles ({visibleElements.length})
          </h4>
        </div>

        <AnimatePresence>
          <div className="space-y-3">
            {elements
              .filter((el) => el.isVisible)
              .sort((a, b) => a.position - b.position)
              .map((element, index) => (
                <motion.div
                  key={element.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    relative transition-all duration-200 transform
                    ${draggedElement === element.id ? "scale-105 z-10" : ""}
                    ${dragOverElement === element.id ? "scale-102" : ""}
                  `}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, element.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, element.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, element.id)}
                  >
                    <Card
                      className={`
                        cursor-move hover:shadow-md transition-all duration-200
                        ${dragOverElement === element.id ? "bg-blue-50 border-blue-300 border-dashed" : ""}
                        ${draggedElement === element.id ? "bg-gray-50" : ""}
                      `}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Drag Handle */}
                            <div className="flex flex-col gap-0.5 text-gray-400 hover:text-gray-600 transition-colors">
                              <div className="w-1 h-1 bg-current rounded-full" />
                              <div className="w-1 h-1 bg-current rounded-full" />
                              <div className="w-1 h-1 bg-current rounded-full" />
                              <div className="w-1 h-1 bg-current rounded-full" />
                              <div className="w-1 h-1 bg-current rounded-full" />
                              <div className="w-1 h-1 bg-current rounded-full" />
                            </div>

                            {/* Position Badge */}
                            <div className="flex items-center justify-center w-8 h-8 bg-primary text-background rounded-full text-sm font-medium">
                              {index + 1}
                            </div>

                            {/* Element Info */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 bg-secondary rounded-lg">
                                <i
                                  className={`${element.icon} size-5 text-gray-600`}
                                />
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {element.name}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {element.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-4">
                            {/* Size Controls */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 font-medium">
                                Tamaño:
                              </span>
                              <div className="flex gap-1">
                                {["small", "medium", "large"].map((size) => (
                                  <Button
                                    key={size}
                                    size="sm"
                                    variant={
                                      element.size === size
                                        ? "solid"
                                        : "bordered"
                                    }
                                    color={
                                      element.size === size
                                        ? (getSizeColor(size) as any)
                                        : "default"
                                    }
                                    onPress={() =>
                                      handleSizeChange(element.id, size as any)
                                    }
                                    className="min-w-unit-8 px-2"
                                  >
                                    <i
                                      className={`${getSizeIcon(size)} size-3`}
                                    />
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Size Label */}
                            <Chip
                              size="sm"
                              color={getSizeColor(element.size) as any}
                              variant="flat"
                              className="capitalize"
                            >
                              {element.size === "small"
                                ? "Pequeño"
                                : element.size === "medium"
                                  ? "Mediano"
                                  : "Grande"}
                            </Chip>

                            {/* Visibility Toggle */}
                            <Switch
                              isSelected={element.isVisible}
                              onValueChange={() =>
                                handleVisibilityToggle(element.id)
                              }
                              color="success"
                              size="sm"
                            />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </motion.div>
              ))}
          </div>
        </AnimatePresence>
      </div>

      {/* Hidden Elements */}
      {hiddenElements.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <i className="icon-[lucide--eye-off] size-5 text-gray-400" />
            <h4 className="font-medium text-gray-600">
              Elementos Ocultos ({hiddenElements.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {hiddenElements.map((element) => (
                <motion.div
                  key={element.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="opacity-60 hover:opacity-80 transition-opacity">
                    <CardBody className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary rounded-lg flex items-center justify-center">
                            <i
                              className={`${element.icon} size-4 text-accent`}
                            />
                          </div>
                          <div>
                            <h6 className="font-medium text-gray-700 text-sm">
                              {element.name}
                            </h6>
                            <p className="text-xs text-gray-500">
                              {element.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          isSelected={element.isVisible}
                          onValueChange={() =>
                            handleVisibilityToggle(element.id)
                          }
                          color="success"
                          size="sm"
                        />
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-accent to-secondary border-blue-200">
        <CardBody>
          <div className="flex items-center gap-8">
            <div className="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="icon-[lucide--info] size-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Guía de Personalización
              </h4>
              <ul className="text-primary text-sm space-y-1">
                <li>
                  • <strong>Arrastra</strong> los elementos para cambiar su
                  orden en el dashboard
                </li>
                <li>
                  • <strong>Ajusta el tamaño</strong> usando los botones de
                  tamaño (pequeño, mediano, grande)
                </li>
                <li>
                  • <strong>Oculta elementos</strong> usando el interruptor de
                  visibilidad
                </li>
                <li>
                  • <strong>Guarda los cambios</strong> para aplicar tu
                  configuración personalizada
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
