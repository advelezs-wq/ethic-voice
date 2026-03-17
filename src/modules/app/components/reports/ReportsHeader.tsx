"use client";

import React, { useState } from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  useDisclosure,
  Chip,
  Tooltip,
} from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { useAiQueue } from "../../hooks/useAiQueue";

interface ReportsHeaderProps {
  selectedCount: number;
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  onBulkAction: (action: string, value?: string) => void;
}

export function ReportsHeader({
  selectedCount,
  viewMode,
  onViewModeChange,
  onBulkAction,
}: ReportsHeaderProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [bulkActionType, setBulkActionType] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");

  const searchParams = useSearchParams();
  const { processingCount, pendingCount } = useAiQueue(8000);

  const handleBulkActionClick = (action: string) => {
    setBulkActionType(action);
    onOpen();
  };

  const handleBulkActionConfirm = () => {
    let value: string | undefined;

    switch (bulkActionType) {
      case "assign":
        value = selectedAssignee;
        break;
      case "status":
        value = selectedStatus;
        break;
      case "priority":
        value = selectedPriority;
        break;
    }

    onBulkAction(bulkActionType, value);
    onOpenChange();
    // Reset selections
    setSelectedAssignee("");
    setSelectedStatus("");
    setSelectedPriority("");
  };

  const downloadPDF = async () => {
    const filters: Record<string, string> = {};
    [
      "status",
      "severity",
      "source",
      "dateRange",
      "assignee",
      "departmentId",
      "reportType",
      "anonymous",
      "search",
    ].forEach((k) => {
      const v = searchParams.get(k);
      if (v && v !== "all") filters[k] = v;
    });

    const res = await fetch("/api/reports/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportType: "reports_list",
        filename: "reporte-de-denuncias",
        filters,
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-de-denuncias.pdf`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const downloadFile = async (format: "csv" | "xlsx") => {
    const filters: Record<string, string> = {};
    [
      "status",
      "severity",
      "source",
      "dateRange",
      "assignee",
      "departmentId",
      "reportType",
      "anonymous",
      "search",
    ].forEach((k) => {
      const v = searchParams.get(k);
      if (v && v !== "all") filters[k] = v;
    });

    const res = await fetch("/api/reports/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format,
        filename: "reporte-de-denuncias",
        filters,
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-de-denuncias.${format === "xlsx" ? "xlsx" : "csv"}`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const getBulkActionModalContent = () => {
    switch (bulkActionType) {
      case "assign":
        return (
          <>
            <ModalHeader>Asignar reportes seleccionados</ModalHeader>
            <ModalBody>
              <p className="mb-4">
                Selecciona un investigador para asignar los {selectedCount}{" "}
                reportes seleccionados:
              </p>
              <Select
                label="Investigador"
                placeholder="Selecciona un investigador"
                value={selectedAssignee}
                onSelectionChange={(keys) =>
                  setSelectedAssignee(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="user1">
                  Ana García - 12 casos activos
                </SelectItem>
                <SelectItem key="user2">
                  Carlos López - 8 casos activos
                </SelectItem>
                <SelectItem key="user3">
                  María Rodríguez - 15 casos activos
                </SelectItem>
                <SelectItem key="user4">
                  Juan Martínez - 5 casos activos
                </SelectItem>
              </Select>
            </ModalBody>
          </>
        );
      case "status":
        return (
          <>
            <ModalHeader>Cambiar estado de reportes</ModalHeader>
            <ModalBody>
              <p className="mb-4">
                Cambiar el estado de los {selectedCount} reportes seleccionados
                a:
              </p>
              <Select
                label="Nuevo estado"
                placeholder="Selecciona un estado"
                value={selectedStatus}
                onSelectionChange={(keys) =>
                  setSelectedStatus(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="pending">Pendiente</SelectItem>
                <SelectItem key="in_progress">En progreso</SelectItem>
                <SelectItem key="under_review">En revisión</SelectItem>
                <SelectItem key="resolved">Resuelto</SelectItem>
                <SelectItem key="closed">Cerrado</SelectItem>
              </Select>
            </ModalBody>
          </>
        );
      case "priority":
        return (
          <>
            <ModalHeader>Cambiar prioridad de reportes</ModalHeader>
            <ModalBody>
              <p className="mb-4">
                Cambiar la prioridad de los {selectedCount} reportes
                seleccionados a:
              </p>
              <Select
                label="Nueva prioridad"
                placeholder="Selecciona una prioridad"
                value={selectedPriority}
                onSelectionChange={(keys) =>
                  setSelectedPriority(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="urgent">
                  <div className="flex items-center gap-2">
                    <i className="icon-[lucide--zap] size-4 text-red-500" />
                    <span>Urgente</span>
                  </div>
                </SelectItem>
                <SelectItem key="high">
                  <div className="flex items-center gap-2">
                    <i className="icon-[lucide--chevrons-up] size-4 text-orange-500" />
                    <span>Alta</span>
                  </div>
                </SelectItem>
                <SelectItem key="normal">Normal</SelectItem>
                <SelectItem key="low">Baja</SelectItem>
              </Select>
            </ModalBody>
          </>
        );
      case "archive":
        return (
          <>
            <ModalHeader>Archivar reportes</ModalHeader>
            <ModalBody>
              <p className="text-danger">
                ¿Estás seguro de que deseas archivar los {selectedCount}{" "}
                reportes seleccionados?
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Los reportes archivados se moverán al archivo y no aparecerán en
                la vista principal. Esta acción se puede revertir.
              </p>
            </ModalBody>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-6 flex items-start sm:items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 sm:gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Denuncias</h1>
        {(processingCount > 0 || pendingCount > 0) && (
          <Tooltip content="Procesamiento en curso (ETA aprox.)">
            <Chip size="sm" variant="solid" color="primary">
              <i className="icon-[lucide--brain] size-3 mr-1" />
              IA en cola: {processingCount + pendingCount}
            </Chip>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 mr-0 sm:mr-3 px-3 py-1 bg-primary-100 rounded-lg">
            <span className="text-sm font-medium text-primary-700">
              {selectedCount} seleccionados
            </span>
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={() => onBulkAction("clear")}
            >
              <i className="icon-[lucide--x] size-4 text-primary-700" />
            </Button>
          </div>
        )}

        {selectedCount > 0 && (
          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" size="sm">
                <i className="icon-[lucide--settings-2] size-4 mr-2" />
                Acciones en masa
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="assign"
                startContent={
                  <i className="icon-[lucide--user-round-plus] size-4" />
                }
                onPress={() => handleBulkActionClick("assign")}
              >
                Asignar investigador
              </DropdownItem>
              <DropdownItem
                key="status"
                startContent={<i className="icon-[lucide--repeat] size-4" />}
                onPress={() => handleBulkActionClick("status")}
              >
                Cambiar estado
              </DropdownItem>
              <DropdownItem
                key="priority"
                startContent={<i className="icon-[lucide--flag] size-4" />}
                onPress={() => handleBulkActionClick("priority")}
              >
                Cambiar prioridad
              </DropdownItem>
              <DropdownItem
                key="archive"
                className="text-danger"
                color="danger"
                startContent={<i className="icon-[lucide--archive] size-4" />}
                onPress={() => handleBulkActionClick("archive")}
              >
                Archivar
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === "table" ? "solid" : "light"}
            isIconOnly
            onPress={() => onViewModeChange("table")}
          >
            <i className="icon-[lucide--list] size-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "cards" ? "solid" : "light"}
            isIconOnly
            onPress={() => onViewModeChange("cards")}
          >
            <i className="icon-[lucide--layout-grid] size-4" />
          </Button>
        </div>

        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered" size="sm">
              <i className="icon-[lucide--download] size-4 mr-2" />
              Exportar
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem
              key="excel"
              startContent={
                <i className="icon-[lucide--file-spreadsheet] size-4" />
              }
              onPress={() => downloadFile("xlsx")}
            >
              Exportar a Excel
            </DropdownItem>
            <DropdownItem
              key="pdf"
              startContent={<i className="icon-[lucide--file-text] size-4" />}
              onPress={downloadPDF}
            >
              Exportar a PDF
            </DropdownItem>
            <DropdownItem
              key="csv"
              startContent={<i className="icon-[lucide--file] size-4" />}
              onPress={() => downloadFile("csv")}
            >
              Exportar a CSV
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              {getBulkActionModalContent()}
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleBulkActionConfirm}
                  isDisabled={
                    (bulkActionType === "assign" && !selectedAssignee) ||
                    (bulkActionType === "status" && !selectedStatus) ||
                    (bulkActionType === "priority" && !selectedPriority)
                  }
                >
                  {bulkActionType === "archive" ? "Archivar" : "Aplicar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
