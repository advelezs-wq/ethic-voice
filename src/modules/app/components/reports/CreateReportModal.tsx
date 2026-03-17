"use client";

import React, { useTransition } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  Chip,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addToast } from "@/modules/core/utils/safe-toast";
import { createManualReport } from "@/actions/manual-report.actions";
import { useRouter } from "next/navigation";
import {
  createManualReportSchema,
  type CreateManualReportData,
} from "@/modules/app/lib/schemas/manual-report";
import { useAnalytics } from "../../context/AnalyticsContext";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

const irregularityTypes = [
  { key: "harassment", label: "Acoso o Bullying" },
  { key: "discrimination", label: "Discriminación" },
  { key: "corruption", label: "Corrupción o Soborno" },
  { key: "fraud", label: "Fraude" },
  { key: "safety", label: "Violación de Seguridad" },
  { key: "ethics", label: "Violación Ética" },
  { key: "legal", label: "Violación Legal" },
  { key: "financial", label: "Irregularidad Financiera" },
  { key: "environmental", label: "Violación Ambiental" },
  { key: "other", label: "Otro" },
];

const channelTypes = [
  { key: "phone", label: "Teléfono" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "in_person", label: "Presencial" },
];

const priorities = [
  { key: "LOW", label: "Baja" },
  { key: "MEDIUM", label: "Media" },
  { key: "HIGH", label: "Alta" },
];

export function CreateReportModal({
  isOpen,
  onClose,
  organizationId,
}: CreateReportModalProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { invalidateAfterReportCreate } = useAnalytics();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateManualReportData>({
    resolver: zodResolver(createManualReportSchema),
    mode: "onChange", // Show errors immediately as user types
    reValidateMode: "onChange",
    defaultValues: {
      isAnonymous: false,
      channelType: "phone",
      priority: "MEDIUM",
      title: "",
      description: "",
      irregularityType: "",
      reporterName: "",
      reporterEmail: "",
      reporterPhone: "",
      location: "",
      involvedPersons: "",
      evidenceDescription: "",
      adminNotes: "",
    },
  });

  const isAnonymous = watch("isAnonymous");

  // Limpiar campos del reportante cuando se marca como anónimo
  React.useEffect(() => {
    if (isAnonymous) {
      setValue("reporterName", "", { shouldValidate: true, shouldDirty: true });
      setValue("reporterEmail", "", { shouldValidate: true, shouldDirty: true });
      setValue("reporterPhone", "", { shouldValidate: true, shouldDirty: true });
      // Limpiar errores manualmente
      clearErrors(["reporterName", "reporterEmail", "reporterPhone"]);
    }
  }, [isAnonymous, setValue, clearErrors]);

  const onSubmit = async (data: CreateManualReportData) => {
    if (Object.keys(errors).length > 0) {
      addToast({
        title: "Errores en el formulario",
        description: "Por favor corrige los errores antes de continuar",
        color: "danger",
      });
      return;
    }

    startTransition(async () => {
      try {
        await createManualReport(organizationId, data);
        await invalidateAfterReportCreate();
        router.refresh();
        window.dispatchEvent(new CustomEvent("manual-report-created"));
        addToast({
          title: "Reporte creado exitosamente",
          description: "El reporte ha sido registrado en el sistema",
          color: "success",
        });
        reset();
        onClose();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        addToast({
          title: "Error al crear el reporte",
          description: errorMessage,
          color: "danger",
        });
      }
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
      placement="center"
      className="mx-2 my-2"
      classNames={{
        base: "min-h-0",
        wrapper: "items-center justify-center p-4",
        backdrop: "bg-black/50",
      }}
    >
      <ModalContent className="max-h-[85vh] min-h-0 flex flex-col">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full min-h-0"
        >
          <ModalHeader className="flex flex-col gap-1 shrink-0 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Crear Reporte Manual</h2>
            <p className="text-sm text-gray-500">
              Registra denuncias recibidas por teléfono, WhatsApp u otros
              canales
            </p>
          </ModalHeader>

          <ModalBody className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Canal de Recepción */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Canal de Recepción
              </h3>
              <Controller
                name="channelType"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Canal de Recepción"
                    placeholder="Selecciona cómo se recibió la denuncia"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => {
                      const selectedValue = Array.from(keys)[0] as string;
                      field.onChange(selectedValue);
                    }}
                    isRequired
                    errorMessage={errors.channelType?.message}
                    size="sm"
                  >
                    {channelTypes.map((channel) => (
                      <SelectItem key={channel.key}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            </div>

            {/* Información del Reportante */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  Información del Reportante
                </h3>
                <Checkbox
                  isSelected={isAnonymous}
                  onValueChange={(value) =>
                    setValue("isAnonymous", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  size="sm"
                >
                  Reporte Anónimo
                </Checkbox>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    label="Nombre Completo"
                    placeholder="Nombre del reportante"
                    isRequired
                    {...register("reporterName")}
                    errorMessage={errors.reporterName?.message}
                    size="sm"
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@ejemplo.com"
                    isRequired
                    {...register("reporterEmail")}
                    errorMessage={errors.reporterEmail?.message}
                    size="sm"
                  />
                  <Input
                    label="Teléfono"
                    placeholder="+1234567890"
                    {...register("reporterPhone")}
                    errorMessage={errors.reporterPhone?.message}
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Información del Reporte */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                Detalles del Reporte
              </h3>

              <div className="space-y-4">
                <Input
                  label="Título del Reporte"
                  placeholder="Breve descripción del problema"
                  {...register("title")}
                  errorMessage={errors.title?.message}
                  isRequired
                  size="sm"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Controller
                    name="irregularityType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Tipo de Irregularidad"
                        placeholder="Selecciona el tipo"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const selectedValue = Array.from(keys)[0] as string;
                          field.onChange(selectedValue);
                        }}
                        isRequired
                        errorMessage={errors.irregularityType?.message}
                        size="sm"
                      >
                        {irregularityTypes.map((type) => (
                          <SelectItem key={type.key}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Prioridad"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const selectedValue = Array.from(keys)[0] as string;
                          field.onChange(selectedValue);
                        }}
                        errorMessage={errors.priority?.message}
                        size="sm"
                      >
                        {priorities.map((priority) => (
                          <SelectItem key={priority.key}>
                            <div className="flex items-center gap-2">
                              <Chip
                                size="sm"
                                color={
                                  priority.key === "HIGH"
                                    ? "danger"
                                    : priority.key === "MEDIUM"
                                      ? "warning"
                                      : "success"
                                }
                                variant="flat"
                              >
                                {priority.label}
                              </Chip>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>

                <Textarea
                  label="Descripción Detallada"
                  placeholder="Describe los hechos de manera detallada..."
                  rows={3}
                  {...register("description")}
                  errorMessage={errors.description?.message}
                  isRequired
                  size="sm"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    label="Ubicación/Lugar"
                    placeholder="Dónde ocurrieron los hechos (opcional)"
                    {...register("location")}
                    errorMessage={errors.location?.message}
                    size="sm"
                  />

                  <Textarea
                    label="Personas Involucradas"
                    placeholder="Nombres o descripciones (opcional)"
                    rows={2}
                    {...register("involvedPersons")}
                    errorMessage={errors.involvedPersons?.message}
                    size="sm"
                  />
                </div>

                <Textarea
                  label="Descripción de Evidencias"
                  placeholder="Describe las evidencias disponibles"
                  rows={2}
                  {...register("evidenceDescription")}
                  errorMessage={errors.evidenceDescription?.message}
                  size="sm"
                />
              </div>
            </div>

            {/* Notas del Administrador */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Notas Internas
              </h3>
              <Textarea
                label="Notas del Administrador"
                placeholder="Observaciones internas, contexto adicional..."
                rows={2}
                {...register("adminNotes")}
                description="Estas notas son internas y no serán visibles para el reportante"
                errorMessage={errors.adminNotes?.message}
                size="sm"
              />
            </div>
          </ModalBody>

          <ModalFooter className="shrink-0 border-t border-gray-200 gap-3">
            <Button
              color="danger"
              variant="light"
              onPress={handleClose}
              disabled={isPending}
              size="sm"
            >
              Cancelar
            </Button>
              {/* Removed noisy debug button to reduce console warnings */}
            <Button
              color="primary"
              type="submit"
              isLoading={isPending}
              disabled={isSubmitting || isPending || !isValid}
              size="sm"
            >
              {isPending ? "Creando..." : "Crear Reporte"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
