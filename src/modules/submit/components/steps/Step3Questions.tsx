"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Textarea } from "@heroui/input";
import { CompleteFormData } from "../../lib/schemas/ethicline.schema";
import { Checkbox, Radio, RadioGroup } from "@heroui/react";

const FACT_OPTIONS = [
  "Uso indebido de recursos",
  "Conflicto de intereses",
  "Manipulación de información",
  "Abuso de autoridad",
  "Incumplimiento de políticas",
  "Conducta inapropiada",
  "Otro (especificar en detalles)",
];

const HOW_OPTIONS = [
  "De forma recurrente",
  "En una sola ocasión",
  "Durante reuniones laborales",
  "A través de comunicaciones electrónicas",
  "En horario laboral",
  "Fuera del horario laboral",
  "De forma encubierta",
  "Abiertamente",
];

const WHERE_OPTIONS = [
  "En las oficinas principales",
  "En sucursal/sede remota",
  "En eventos de la empresa",
  "En espacios virtuales/online",
  "Fuera de las instalaciones",
  "En múltiples ubicaciones",
];

const WHEN_OPTIONS = [
  "En la última semana",
  "En el último mes",
  "En los últimos 3 meses",
  "En los últimos 6 meses",
  "Hace más de 6 meses",
  "Es una situación continua",
];

export function Step3Questions() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<CompleteFormData>();
  const irregularityType = watch("irregularityType");
  const isReporteLibre = irregularityType === "reporte-libre";

  if (isReporteLibre) {
    return (
      <div className="space-y-6">
        <p className="text-gray-600">
          Redacte el caso con el mayor detalle posible para una mejor
          investigación.
        </p>

        <Controller
          name="questionnaire.freeReport"
          control={control}
          render={({ field, fieldState }) => (
            <Textarea
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
              label="Descripción detallada"
              placeholder="Escriba aquí todos los detalles del caso..."
              minRows={8}
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-gray-600">
        Complete las siguientes preguntas para ayudarnos a entender mejor la
        situación.
      </p>

      {/* Question 1: What happened - Multiple selection with individual checkboxes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          ¿En qué consistió el hecho? * (Seleccione todas las que apliquen)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FACT_OPTIONS.map((option) => (
            <Controller
              key={option}
              name={`questionnaire.whatHappened_${option}`}
              control={control}
              render={({ field }) => (
                <Checkbox
                  isSelected={!!field.value}
                  onValueChange={field.onChange}
                >
                  {option}
                </Checkbox>
              )}
            />
          ))}
        </div>
        {errors.questionnaire?.whatHappened && (
          <p className="text-red-500 text-sm mt-1">
            {errors.questionnaire.whatHappened.message}
          </p>
        )}
      </div>

      {/* Question 2: How it happened - Multiple selection with individual checkboxes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          ¿Cómo se llevó a cabo? * (Seleccione todas las que apliquen)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HOW_OPTIONS.map((option) => (
            <Controller
              key={option}
              name={`questionnaire.howItHappened_${option}`}
              control={control}
              render={({ field }) => (
                <Checkbox
                  isSelected={!!field.value}
                  onValueChange={field.onChange}
                >
                  {option}
                </Checkbox>
              )}
            />
          ))}
        </div>
        {errors.questionnaire?.howItHappened && (
          <p className="text-red-500 text-sm mt-1">
            {errors.questionnaire.howItHappened.message}
          </p>
        )}
      </div>

      {/* Question 3: Where and When - Split into two parts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">¿Dónde sucedió? *</label>
          <Controller
            name="questionnaire.where"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <RadioGroup 
                  onValueChange={field.onChange}
                  value={field.value}
                  isInvalid={!!fieldState.error}
                >
                  {WHERE_OPTIONS.map((option) => (
                    <Radio key={option} value={option}>
                      {option}
                    </Radio>
                  ))}
                </RadioGroup>
                {fieldState.error && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">¿Cuándo sucedió? *</label>
          <Controller
            name="questionnaire.when"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <RadioGroup 
                  onValueChange={field.onChange}
                  value={field.value}
                  isInvalid={!!fieldState.error}
                >
                  {WHEN_OPTIONS.map((option) => (
                    <Radio key={option} value={option}>
                      {option}
                    </Radio>
                  ))}
                </RadioGroup>
                {fieldState.error && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Question 4: Other involved - Radio + Text */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          ¿Considera que existen otros involucrados?
        </label>
        <Controller
          name="questionnaire.hasOtherInvolved"
          control={control}
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange}>
              <Radio value="yes">Sí</Radio>
              <Radio value="no">No</Radio>
              <Radio value="unknown">No estoy seguro/a</Radio>
            </RadioGroup>
          )}
        />

        <Controller
          name="questionnaire.otherInvolved"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
              label="Si la respuesta es sí, por favor menciónelos"
              placeholder="Nombres, cargos o descripción de las personas involucradas..."
              minRows={3}
              className="mt-3"
            />
          )}
        />
      </div>

      {/* Additional details - Always show */}
      <div className="space-y-2">
        <Controller
          name="questionnaire.additionalDetails"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Textarea
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
              label="Detalles adicionales (opcional)"
              placeholder="Proporcione cualquier información adicional que considere relevante..."
              minRows={4}
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />
      </div>
    </div>
  );
}
