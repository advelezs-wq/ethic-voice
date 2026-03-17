"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio,
  DateInput,
} from "@heroui/react";
import { parseDate, DateValue } from "@internationalized/date";
import { addToast } from "@/modules/core/utils/safe-toast";

interface DownloadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportTitle: string;
  organizationId: string;
}

export function DownloadReportModal({
  isOpen,
  onClose,
  reportType,
  reportTitle,
  organizationId,
}: DownloadReportModalProps) {
  const [dateFrom, setDateFrom] = useState<any>(null);
  const [dateTo, setDateTo] = useState<any>(null);
  const [format, setFormat] = useState("pdf");
  const [downloading, setDownloading] = useState(false);

  const handleClose = () => {
    if (!downloading) {
      onClose();
      // Reset form
      setDateFrom(null);
      setDateTo(null);
      setFormat("pdf");
    }
  };

  const formatDateForFilename = (date: DateValue) => {
    // date.toString() returns YYYY-MM-DD for CalendarDate/DateValue
    return String((date as any).toString());
  };

  const generateFilename = () => {
    const baseFilename = reportTitle.toLowerCase().replace(/\s+/g, "_");
    let dateRange = "";

    if (dateFrom && dateTo) {
      dateRange = `_${formatDateForFilename(dateFrom)}_a_${formatDateForFilename(dateTo)}`;
    } else if (dateFrom) {
      dateRange = `_desde_${formatDateForFilename(dateFrom)}`;
    } else if (dateTo) {
      dateRange = `_hasta_${formatDateForFilename(dateTo)}`;
    }

    const extension = format === "excel" ? "xlsx" : "pdf";
    return `${baseFilename}${dateRange}.${extension}`;
  };

  const handleDownload = async () => {
    if (!dateFrom || !dateTo) {
      addToast({
        title: "Fechas requeridas",
        description: "Por favor selecciona las fechas de inicio y fin",
        color: "warning",
      });
      return;
    }

    const compare = ((a: DateValue, b: DateValue) => String((a as any).toString()).localeCompare(String((b as any).toString())));
    if (compare(dateFrom, dateTo) > 0) {
      addToast({
        title: "Fechas inválidas",
        description: "La fecha de inicio debe ser anterior a la fecha fin",
        color: "danger",
      });
      return;
    }

    setDownloading(true);

    try {
      const params = new URLSearchParams({
        orgId: organizationId,
        reportType,
        format,
        dateFrom: dateFrom.toString(),
        dateTo: dateTo.toString(),
      });

      const response = await fetch(`/api/analytics/download?${params}`);

      if (!response.ok) {
        throw new Error("Error al generar el reporte");
      }

      // Get the blob and create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast({
        title: "Reporte descargado",
        description: `El reporte "${reportTitle}" ha sido descargado exitosamente`,
        color: "success",
      });

      handleClose();
    } catch {
      addToast({
        title: "Error al descargar",
        description: "No se pudo generar el reporte. Intenta nuevamente",
        color: "danger",
      });
    } finally {
      setDownloading(false);
    }
  };

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - days);

    setDateFrom(parseDate(fromDate.toISOString().split("T")[0]));
    setDateTo(parseDate(today.toISOString().split("T")[0]));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      classNames={{
        base: "max-h-[90vh]",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="icon-[lucide--download] size-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Descargar Reporte</h3>
              <p className="text-sm text-gray-600">{reportTitle}</p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {/* Quick Date Range Buttons */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-3">
              Rangos rápidos
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="flat"
                onPress={() => setQuickDateRange(7)}
              >
                Últimos 7 días
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => setQuickDateRange(30)}
              >
                Último mes
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => setQuickDateRange(90)}
              >
                Últimos 3 meses
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => setQuickDateRange(365)}
              >
                Último año
              </Button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateInput
              label="Fecha de inicio"
              value={(dateFrom as any) || undefined}
              onChange={(v) => setDateFrom(v)}
              isRequired
              variant="bordered"
              startContent={
                <i className="icon-[lucide--calendar] size-4 text-gray-400" />
              }
            />
            <DateInput
              label="Fecha fin"
              value={(dateTo as any) || undefined}
              onChange={(v) => setDateTo(v)}
              isRequired
              variant="bordered"
              startContent={
                <i className="icon-[lucide--calendar] size-4 text-gray-400" />
              }
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-3">
              Formato de descarga
            </label>
            <RadioGroup
              value={format}
              onValueChange={setFormat}
              orientation="horizontal"
            >
              <Radio value="pdf">
                <div className="flex items-center gap-2">
                  <i className="icon-[lucide--file-text] size-4 text-red-500" />
                  <span>PDF</span>
                </div>
              </Radio>
              <Radio value="excel">
                <div className="flex items-center gap-2">
                  <i className="icon-[lucide--file-spreadsheet] size-4 text-green-500" />
                  <span>Excel</span>
                </div>
              </Radio>
            </RadioGroup>
          </div>

          {/* Preview filename */}
          {dateFrom && dateTo && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">
                El archivo se descargará como:
              </p>
              <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {generateFilename()}
              </p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <i className="icon-[lucide--info] size-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Información del reporte</p>
                <ul className="space-y-1 text-blue-700">
                  <li>
                    • Los datos se filtrarán según el rango de fechas
                    seleccionado
                  </li>
                  <li>• El PDF incluye gráficos y visualizaciones</li>
                  <li>
                    • El Excel contiene datos tabulares para análisis adicional
                  </li>
                  <li>• La generación puede tomar unos segundos</li>
                </ul>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" onPress={handleClose} isDisabled={downloading}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleDownload}
            isLoading={downloading}
            isDisabled={downloading || !dateFrom || !dateTo}
          >
            <i className="icon-[lucide--download] size-4 mr-2" />
            {downloading ? "Generando..." : "Descargar Reporte"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
