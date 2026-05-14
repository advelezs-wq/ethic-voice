"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { CompleteFormData } from "../../lib/schemas/ethicline.schema";
import {
  DEPARTMENTS,
  GENDERS,
  POSITIONS,
  WORK_RELATIONSHIPS,
  YES_NO_OPTIONS,
} from "../../constants/ethicline.constants";
import { Switch, RadioGroup, Radio, Textarea } from "@heroui/react";

export function Step1Personal() {
  const { control, watch } = useFormContext<CompleteFormData>();
  const isAnonymous = watch("isAnonymous");
  const consultedBefore = watch("consultedBefore");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#0a1e14]">Denunciante</h3>

        <div className="mb-4 rounded-xl border border-lime-200 bg-lime-50/80 p-3">
          <p className="text-xs leading-relaxed text-[#1f3d31]">
            Puedes activar el anonimato para ocultar tu identidad durante el
            proceso. Solo comparte datos personales si deseas recibir contacto
            de seguimiento directo.
          </p>
        </div>

        <Controller
          name="isAnonymous"
          control={control}
          render={({ field }) => (
            <Switch
              isSelected={field.value}
              onValueChange={field.onChange}
              classNames={{
                base: "max-w-full",
                wrapper: "bg-gray-300 group-data-[selected=true]:bg-[#0a1e14]",
                thumb: "bg-white",
              }}
              className="mb-6"
            >
              <span className="text-sm font-medium">Mantener el anonimato</span>
            </Switch>
          )}
        />

        {!isAnonymous && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="reporter.firstName"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  label="Nombre"
                  placeholder="Tu nombre"
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  isRequired
                />
              )}
            />

            <Controller
              name="reporter.lastName"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  label="Apellido(s)"
                  placeholder="Tus apellidos"
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  isRequired
                />
              )}
            />

            <Controller
              name="reporter.gender"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label="Género"
                  placeholder="Selecciona tu género"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) =>
                    field.onChange(Array.from(keys)[0])
                  }
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  isRequired
                >
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender.value}>{gender.label}</SelectItem>
                  ))}
                </Select>
              )}
            />

            <Controller
              name="reporter.email"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  type="email"
                  label="E-mail personal"
                  placeholder="correo@ejemplo.com"
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  isRequired
                />
              )}
            />

            <Controller
              name="reporter.idDocument"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Documento o cédula"
                  placeholder="Número de documento"
                />
              )}
            />

            <Controller
              name="reporter.phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="tel"
                  label="Teléfono"
                  placeholder="+57 300 123 4567"
                />
              )}
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold text-[#0a1e14]">Denunciado</h3>
        <p className="mb-4 text-sm text-[#273c46]">
          Si no conoce al denunciado, escriba &quot;No especificado&quot; en los
          campos de nombre.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="reported.firstName"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label="Nombre"
                placeholder="Nombre del denunciado"
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                isRequired
              />
            )}
          />

          <Controller
            name="reported.lastName"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label="Apellido(s)"
                placeholder="Apellidos del denunciado"
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                isRequired
              />
            )}
          />

          <Controller
            name="reported.department"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Área o sector"
                placeholder="Selecciona el área"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) =>
                  field.onChange(Array.from(keys)[0])
                }
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                isRequired
              >
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept}>{dept}</SelectItem>
                ))}
              </Select>
            )}
          />

          <Controller
            name="reported.position"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Cargo o puesto"
                placeholder="Selecciona el cargo"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) =>
                  field.onChange(Array.from(keys)[0])
                }
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                isRequired
              >
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos}>{pos}</SelectItem>
                ))}
              </Select>
            )}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#0a1e14]">
          Información adicional
        </h3>

        <div className="space-y-6">
          <Controller
            name="workRelationship"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Relación laboral con la empresa a la cual enviarás la denuncia"
                placeholder="Selecciona tu relación laboral"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) =>
                  field.onChange(Array.from(keys)[0])
                }
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                isRequired
                className="max-w-md"
              >
                {WORK_RELATIONSHIPS.map((relationship) => (
                  <SelectItem key={relationship.value}>{relationship.label}</SelectItem>
                ))}
              </Select>
            )}
          />

          <Controller
            name="consultedBefore"
            control={control}
            render={({ field, fieldState }) => (
              <RadioGroup
                label="¿Has consultado esto con otro miembro de la organización?"
                value={field.value}
                onValueChange={field.onChange}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                isRequired
                orientation="horizontal"
              >
                {YES_NO_OPTIONS.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </RadioGroup>
            )}
          />

          {consultedBefore === "si" && (
            <Controller
              name="consultationDetails"
              control={control}
              render={({ field, fieldState }) => (
                <Textarea
                  {...field}
                  label="Detalles de la consulta"
                  placeholder="Proporciona detalles sobre con quién consultaste y qué respuesta recibiste"
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  isRequired
                  minRows={3}
                  maxRows={6}
                />
              )}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#0a1e14]/10 bg-[#f7faf9] p-3">
        <p className="text-xs leading-relaxed text-[#273c46]">
          Recomendación de seguridad: evita incluir contraseñas, datos
          bancarios completos o información de terceros no relacionada con el
          hecho reportado.
        </p>
      </div>
    </div>
  );
}
