"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Checkbox } from "@heroui/checkbox";
import { CompleteFormData } from "../../lib/schemas/ethicline.schema";
import { AttachmentUploader, UploadedAttachment } from "../AttachmentUploader";
import { useOrganization } from "@clerk/nextjs";
import Link from "next/link";

export function Step4Evidence() {
  const { control, setValue } = useFormContext<CompleteFormData>();
  const { organization } = useOrganization();

  const handleAttachmentsChange = (newAttachments: UploadedAttachment[]) => {
    setValue("uploadedFiles", newAttachments);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#0a1e14]/10 bg-[#f7faf9] p-4">
        <p className="text-sm leading-relaxed text-[#273c46]">
          Opcional: adjunta evidencias que ayuden en la investigación (máx.
          50MB por archivo). Evita incluir datos sensibles no relacionados con
          el caso.
        </p>
      </div>

      <p className="text-xs text-[#273c46]">
        Validamos tipo y tamaño de archivo antes del almacenamiento para reducir
        riesgos de seguridad.
      </p>

      <AttachmentUploader
        onAttachmentsChange={handleAttachmentsChange}
        maxFiles={10}
        orgId={organization?.id || 'default'}
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
            >
              <span className="text-sm leading-relaxed text-[#0d212c]">
                Declaro que la información proporcionada es verídica y autorizo
                su uso para la investigación correspondiente, de acuerdo con la{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="font-semibold text-[#0a1e14] underline underline-offset-2"
                >
                  política de privacidad
                </Link>{" "}
                y los{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-[#0a1e14] underline underline-offset-2"
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
