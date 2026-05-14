"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Card } from "@heroui/card";
import { CompleteFormData } from "../../lib/schemas/ethicline.schema";
import { IRREGULARITY_TYPES } from "../../constants/ethicline.constants";

export function Step2Type() {
  const { control } = useFormContext<CompleteFormData>();

  return (
    <div className="space-y-6">
      <p className="text-[#273c46]">
        Seleccione la irregularidad que desea denunciar. Si desea reportar
        varios temas, realice un reporte por cada tipo o seleccione
        &quot;Reporte Libre&quot;.
      </p>

      <Controller
        name="irregularityType"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {IRREGULARITY_TYPES.map((type) => (
                <Card
                  key={type.id}
                  isPressable
                  className={`cursor-pointer border border-[#0a1e14]/10 p-6 transition-all hover:border-lime-400 hover:bg-lime-50 ${
                    field.value === type.id
                      ? "ring-2 ring-[#0a1e14] bg-lime-50"
                      : ""
                  } ${
                    fieldState.error ? "ring-2 ring-red-500" : ""
                  }`}
                  onPress={() => field.onChange(type.id)}
                >
                  <div className="text-center">
                    <h3 className="mb-2 font-semibold text-[#0a1e14]">
                      {type.title}
                    </h3>
                    <p className="text-sm text-[#273c46]">{type.subtitle}</p>
                  </div>
                </Card>
              ))}
            </div>
            {fieldState.error && (
              <p className="text-red-500 text-sm mt-2">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}
