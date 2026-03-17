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
import { z } from "zod";
import { addToast } from "@/modules/core/utils/safe-toast";
import { createManualReport } from "@/actions/manual-report.actions";

const createReportSchema = z.object({
  // Información del reportante
  reporterName: z.string().optional(),
  reporterEmail: z
    .string()
    .optional()
    .refine(
      (val) => {
        // Si está vacío, no validar
        if (!val || val.trim() === "") return true;
        // Si tiene contenido, validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(val);
      },
      {
        message: "Debe ser un email válido",
      }
    ),
  reporterPhone: z.string().optional(),
  isAnonymous: z.boolean().default(false),

  // Canal de recepción
  channelType: z.enum(["phone", "whatsapp", "email", "in_person"]),

  // Información del reporte
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z
    .string()
    .min(20, "La descripción debe tener al menos 20 caracteres"),
  irregularityType: z.string().min(1, "Selecciona un tipo de irregularidad"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),

  // Información adicional (todos opcionales)
  location: z.string().optional(),
  involvedPersons: z.string().optional(),
  evidenceDescription: z.string().optional(),

  // Notas del administrador
  adminNotes: z.string().optional(),
});

type CreateReportForm = z.infer<typeof createReportSchema>;

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    clearErrors,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateReportForm>({
    resolver: zodResolver(createReportSchema),
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
      setValue("reporterName", "");
      setValue("reporterEmail", "");
      setValue("reporterPhone", "");
      // Limpiar errores manualmente
      clearErrors(["reporterName", "reporterEmail", "reporterPhone"]);
    }
  }, [isAnonymous, setValue, clearErrors]);

  const onSubmit = async (data: CreateReportForm) => {
    console.log("=== FORM SUBMIT TRIGGERED ===");
    console.log("Form data:", data);
    console.log("Form errors:", errors);
    console.log("Form is valid:", isValid);
    console.log("Is submitting:", isSubmitting);

    // Check if form has errors
    if (Object.keys(errors).length > 0) {
      console.log("❌ Form has validation errors:", errors);
      addToast({
        title: "Errores en el formulario",
        description: "Por favor corrige los errores antes de continuar",
        color: "danger",
      });
      return;
    }

    startTransition(async () => {
      try {
        console.log("🚀 Sending data to server...");
        await createManualReport(organizationId, data);
        addToast({
          title: "Reporte creado exitosamente",
          description: "El reporte ha sido registrado en el sistema",
          color: "success",
        });
        reset();
        onClose();
      } catch (error) {
        console.error("❌ Error creating manual report:", error);
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
                  onValueChange={(value) => setValue("isAnonymous", value)}
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
                    {...register("reporterName")}
                    errorMessage={errors.reporterName?.message}
                    size="sm"
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@ejemplo.com"
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
              disabled={isSubmitting || isPending}
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
