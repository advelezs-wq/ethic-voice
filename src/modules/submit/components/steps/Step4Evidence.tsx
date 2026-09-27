"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Checkbox } from "@heroui/checkbox";
import { CompleteFormData } from "../../lib/schemas/ethicline.schema";
import { AttachmentUploader, UploadedAttachment } from "../AttachmentUploader";
import Link from "next/link";

interface Step4EvidenceProps {
  organizationId: string;
}

export function Step4Evidence({ organizationId }: Step4EvidenceProps) {
  const { control, setValue } = useFormContext<CompleteFormData>();

  const handleAttachmentsChange = (newAttachments: UploadedAttachment[]) => {
    setValue("uploadedFiles", newAttachments);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ev-night/10 bg-ev-paper p-4">
        <p className="text-sm leading-relaxed text-ev-mute">
          Opcional: adjunta evidencias que ayuden en la investigación (máx.
          50MB por archivo). Evita incluir datos sensibles no relacionados con
          el caso.
        </p>
      </div>

      <p className="text-xs text-ev-mute">
        Validamos tipo y tamaño de archivo antes del almacenamiento para reducir
        riesgos de seguridad.
      </p>

      <AttachmentUploader
        onAttachmentsChange={handleAttachmentsChange}
        maxFiles={10}
        orgId={organizationId}
      />

      <Controller
        name="agreedToTerms"
        control={control}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <div>
            <Checkbox
              isSelected={field.value}
              onValueChange={field.onChange}
              isInvalid={!!fieldState.error}
              classNames={{
                wrapper:
                  "before:border-2 before:border-slate-400 after:bg-emerald-600",
              }}
            >
              <span className="text-sm leading-relaxed text-ev-night">
                Declaro que la información proporcionada es verídica y autorizo
                su uso para la investigación correspondiente, de acuerdo con la{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="font-semibold text-ev-night underline underline-offset-2"
                >
                  política de privacidad
                </Link>{" "}
                y los{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-ev-night underline underline-offset-2"
                >
                  términos de uso
                </Link>
                .
              </span>
            </Checkbox>
            {fieldState.error && (
              <p className="text-red-500 text-sm mt-1">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}
