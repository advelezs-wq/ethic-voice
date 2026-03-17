/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { ReportFilters } from "@/types/reports";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Select,
  SelectItem,
  DatePicker,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";

interface ReportsFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  isArchivedView?: boolean; // New prop for archived view
}

export function ReportsFilters({
  filters,
  onFiltersChange,
  isArchivedView = false,
}: ReportsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });

  // Debounced search to avoid lag while typing
  const updateFilter = (key: keyof ReportFilters, value: string) => {
    if (key === "search") {
      // Debounce: update URL only after user stops typing for 400ms
      window.clearTimeout((updateFilter as any)._t);
      (updateFilter as any)._t = window.setTimeout(() => {
        onFiltersChange({ ...filters, [key]: value });
      }, 400);
      return;
    }
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      severity: "all",
      source: "all",
      dateRange: "all",
      assignee: "all",
      priority: "all",
      departmentId: "all",
      reportType: "all",
      anonymous: "all",
    });
    setCustomDateRange({ start: null, end: null });
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(
      ([key, value]) =>
        key !== "search" &&
        value !== "all" &&
        value !== "" &&
        value !== undefined
    ).length;
  };

  const handleDateRangeChange = (preset: string) => {
    updateFilter("dateRange", preset);
    if (preset !== "custom") {
      setCustomDateRange({ start: null, end: null });
    }
  };

  const statusOptions = [
    { key: "all", label: "Todos los estados" },
    { key: "pending", label: "Pendiente", color: "warning" },
    { key: "in_progress", label: "En progreso", color: "primary" },
    { key: "resolved", label: "Resuelto", color: "success" },
    { key: "closed", label: "Cerrado", color: "default" },
    { key: "archived", label: "Archivado", color: "default" },
  ];

  const severityOptions = [
    { key: "all", label: "Todas las severidades" },
    { key: "HIGH", label: "Alta", color: "danger" },
    { key: "MEDIUM", label: "Media", color: "warning" },
    { key: "LOW", label: "Baja", color: "success" },
    { key: "UNKNOWN", label: "Sin evaluar", color: "default" },
  ];

  const sourceOptions = [
    { key: "all", label: "Todas las fuentes" },
    { key: "ETHIC_LINE", label: "Línea Ética", icon: "icon-[lucide--shield]" },
    {
      key: "CUSTOM_FORM",
      label: "Formulario personalizado",
      icon: "icon-[lucide--file-text]",
    },
  ];

  const dateRangeOptions = [
    { key: "all", label: "Todas las fechas" },
    { key: "today", label: "Hoy" },
    { key: "yesterday", label: "Ayer" },
    { key: "week", label: "Esta semana" },
    { key: "month", label: "Este mes" },
    { key: "quarter", label: "Este trimestre" },
    { key: "year", label: "Este año" },
    { key: "custom", label: "Rango personalizado" },
  ];

  const assigneeOptions = [
    { key: "all", label: "Todos los asignados" },
    { key: "unassigned", label: "Sin asignar" },
    { key: "me", label: "Asignados a mí" },
    { key: "others", label: "Asignados a otros" },
  ];

  const slaOptions = [
    { key: "all", label: "Todos SLA" },
    { key: "green", label: "SLA Verde (≤60%)" },
    { key: "yellow", label: "SLA Amarillo (61–85%)" },
    { key: "orange", label: "SLA Naranja (86–100%)" },
    { key: "red", label: "SLA Rojo (>100%)" },
  ];

  return (
    <Card>
      <CardBody className="p-6">
        <div className="space-y-4">
          {/* Main filters row */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por ID, contenido, denunciante, departamento..."
                value={filters.search}
                onValueChange={(value) => updateFilter("search", value)}
                startContent={
                  <i
                    className="icon-[lucide--search] size-4 text-gray-400"
                    role="img"
                    aria-hidden="true"
                  />
                }
                endContent={
                  filters.search && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => updateFilter("search", "")}
                    >
                      <i
                        className="icon-[lucide--x] size-4"
                        role="img"
                        aria-hidden="true"
                      />
                    </Button>
                  )
                }
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Status Filter - Hidden in archived view */}
              {!isArchivedView && (
                <Select
                  label="Estado"
                  placeholder="Filtrar por estado"
                  selectedKeys={
                    filters.status === "all" ? [] : [filters.status]
                  }
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    updateFilter("status", value || "all");
                  }}
                  className="w-40"
                  size="sm"
                >
                  {statusOptions.map((option) => (
                    <SelectItem key={option.key}>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {/* dynamic counts can be shown here when provided */}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              )}

              {/* Archived view indicator */}
              {isArchivedView && (
                <div className="flex items-center px-3 py-2 bg-gray-100 rounded-lg">
                  <span className="text-sm text-gray-600">
                    📁 Solo reportes archivados
                  </span>
                </div>
              )}

              <Select
                value={filters.severity}
                onSelectionChange={(keys) =>
                  updateFilter("severity", Array.from(keys)[0] as string)
                }
                className="w-[160px]"
                placeholder="Severidad"
              >
                {severityOptions.map((option) => (
                  <SelectItem key={option.key} textValue={option.label}>
                    <div className="flex items-center gap-2">
                      {option.color && (
                        <Chip
                          color={option.color as any}
                          size="sm"
                          variant="flat"
                        >
                          {option.label}
                        </Chip>
                      )}
                      {!option.color && <span>{option.label}</span>}
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <Select
                value={filters.source}
                onSelectionChange={(keys) =>
                  updateFilter("source", Array.from(keys)[0] as string)
                }
                className="w-[180px]"
                placeholder="Fuente"
              >
                {sourceOptions.map((option) => (
                  <SelectItem key={option.key} textValue={option.label}>
                    <div className="flex items-center gap-2">
                      {option.icon && (
                        <i
                          className={`${option.icon} size-4`}
                          role="img"
                          aria-hidden="true"
                        />
                      )}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <Select
                value={filters.dateRange}
                onSelectionChange={(keys) =>
                  handleDateRangeChange(Array.from(keys)[0] as string)
                }
                className="w-[160px]"
                placeholder="Fecha"
              >
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <Select
                value={filters.assignee}
                onSelectionChange={(keys) =>
                  updateFilter("assignee", Array.from(keys)[0] as string)
                }
                className="w-[180px]"
                placeholder="Asignado"
              >
                {assigneeOptions.map((option) => (
                  <SelectItem key={option.key} textValue={option.label}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <Select
                placeholder="SLA"
                className="w-[180px]"
                selectedKeys={filters.sla ? [filters.sla as any] : []}
                onSelectionChange={(keys) =>
                  updateFilter(
                    "sla" as any,
                    (Array.from(keys)[0] as string) || "all"
                  )
                }
              >
                {slaOptions.map((o) => (
                  <SelectItem key={o.key}>{o.label}</SelectItem>
                ))}
              </Select>

              <Button
                variant="bordered"
                onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                startContent={
                  <i
                    className="icon-[lucide--sliders-horizontal] size-4"
                    role="img"
                    aria-hidden="true"
                  />
                }
              >
                Más filtros
              </Button>

              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="bordered"
                  onPress={clearFilters}
                  startContent={
                    <i
                      className="icon-[lucide--x] size-4"
                      role="img"
                      aria-hidden="true"
                    />
                  }
                  endContent={
                    <Chip size="sm" variant="flat">
                      {getActiveFiltersCount()}
                    </Chip>
                  }
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Advanced filters section */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  label="Prioridad"
                  placeholder="Todas las prioridades"
                  className="w-full"
                  selectedKeys={
                    filters.priority && filters.priority !== "all"
                      ? [filters.priority]
                      : []
                  }
                  onSelectionChange={(keys) =>
                    updateFilter(
                      "priority",
                      (Array.from(keys)[0] as string) || "all"
                    )
                  }
                >
                  <SelectItem key="all">Todas</SelectItem>
                  <SelectItem key="URGENT">
                    <div className="flex items-center gap-2">
                      <i className="icon-[lucide--zap] size-4 text-red-500" />
                      <span>Urgente</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="HIGH">
                    <div className="flex items-center gap-2">
                      <i className="icon-[lucide--chevrons-up] size-4 text-orange-500" />
                      <span>Alta</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="NORMAL">Normal</SelectItem>
                  <SelectItem key="LOW">Baja</SelectItem>
                </Select>

                <Select
                  label="Departamento"
                  placeholder="Todos los departamentos"
                  className="w-full"
                  selectedKeys={
                    filters.departmentId && filters.departmentId !== "all"
                      ? [filters.departmentId]
                      : []
                  }
                  onSelectionChange={(keys) =>
                    updateFilter(
                      "departmentId",
                      (Array.from(keys)[0] as string) || "all"
                    )
                  }
                >
                  <SelectItem key="all">Todos</SelectItem>
                  {/* Department options should be fetched; keeping generic for now */}
                </Select>

                <Select
                  label="Tipo de reporte"
                  placeholder="Todos los tipos"
                  className="w-full"
                  selectedKeys={
                    filters.reportType && filters.reportType !== "all"
                      ? [filters.reportType]
                      : []
                  }
                  onSelectionChange={(keys) =>
                    updateFilter(
                      "reportType",
                      (Array.from(keys)[0] as string) || "all"
                    )
                  }
                >
                  <SelectItem key="all">Todos</SelectItem>
                </Select>

                <Select
                  label="Anonimato"
                  placeholder="Todos"
                  className="w-full"
                  selectedKeys={
                    filters.anonymous && filters.anonymous !== "all"
                      ? [filters.anonymous]
                      : []
                  }
                  onSelectionChange={(keys) =>
                    updateFilter(
                      "anonymous",
                      (Array.from(keys)[0] as string) || "all"
                    )
                  }
                >
                  <SelectItem key="all">Todos</SelectItem>
                  <SelectItem key="anonymous">
                    <div className="flex items-center gap-2">
                      <i className="icon-[lucide--user-round-x] size-4" />
                      <span>Anónimos</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="identified">
                    <div className="flex items-center gap-2">
                      <i className="icon-[lucide--user-round-check] size-4" />
                      <span>Identificados</span>
                    </div>
                  </SelectItem>
                </Select>
              </div>

              {filters.dateRange === "custom" && (
                <div className="mt-4 flex gap-4 items-end">
                  <DatePicker
                    label="Fecha inicial"
                    value={
                      customDateRange.start
                        ? (parseDate(customDateRange.start) as any)
                        : null
                    }
                    onChange={(date) =>
                      setCustomDateRange({
                        ...customDateRange,
                        start: date?.toString() || null,
                      })
                    }
                    className="w-[200px]"
                  />
                  <DatePicker
                    label="Fecha final"
                    value={
                      customDateRange.end
                        ? (parseDate(customDateRange.end) as any)
                        : null
                    }
                    onChange={(date) =>
                      setCustomDateRange({
                        ...customDateRange,
                        end: date?.toString() || null,
                      })
                    }
                    className="w-[200px]"
                  />
                  <Button
                    color="primary"
                    isDisabled={!customDateRange.start || !customDateRange.end}
                  >
                    Aplicar rango
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Active filters display */}
          {(filters.search || getActiveFiltersCount() > 0) && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              {filters.search && (
                <Chip
                  variant="flat"
                  onClose={() => updateFilter("search", "")}
                  classNames={{
                    base: "bg-primary-100",
                    closeButton: "text-primary-600",
                  }}
                >
                  <div className="flex items-center gap-1">
                    <i className="icon-[lucide--search] size-3" />
                    <span>Búsqueda: &quot;{filters.search}&quot;</span>
                  </div>
                </Chip>
              )}
              {filters.status !== "all" && (
                <Chip
                  variant="flat"
                  onClose={() => updateFilter("status", "all")}
                  classNames={{
                    base: "bg-blue-100",
                    closeButton: "text-blue-600",
                  }}
                >
                  Estado:{" "}
                  {
                    statusOptions.find((opt) => opt.key === filters.status)
                      ?.label
                  }
                </Chip>
              )}
              {filters.severity !== "all" && (
                <Chip
                  variant="flat"
                  onClose={() => updateFilter("severity", "all")}
                  classNames={{
                    base: "bg-orange-100",
                    closeButton: "text-orange-600",
                  }}
                >
                  Severidad:{" "}
                  {
                    severityOptions.find((opt) => opt.key === filters.severity)
                      ?.label
                  }
                </Chip>
              )}
              {filters.source !== "all" && (
                <Chip
                  variant="flat"
                  onClose={() => updateFilter("source", "all")}
                  classNames={{
                    base: "bg-purple-100",
                    closeButton: "text-purple-600",
                  }}
                >
                  Fuente:{" "}
                  {
                    sourceOptions.find((opt) => opt.key === filters.source)
                      ?.label
                  }
                </Chip>
              )}
              {filters.dateRange !== "all" && (
                <Chip
                  variant="flat"
                  onClose={() => updateFilter("dateRange", "all")}
                  classNames={{
                    base: "bg-green-100",
                    closeButton: "text-green-600",
                  }}
                >
                  Fecha:{" "}
                  {
                    dateRangeOptions.find(
                      (opt) => opt.key === filters.dateRange
                    )?.label
                  }
                </Chip>
              )}
              {filters.assignee !== "all" && (
                <Chip
                  variant="flat"
                  onClose={() => updateFilter("assignee", "all")}
                  classNames={{
                    base: "bg-indigo-100",
                    closeButton: "text-indigo-600",
                  }}
                >
                  Asignación:{" "}
                  {
                    assigneeOptions.find((opt) => opt.key === filters.assignee)
                      ?.label
                  }
                </Chip>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
