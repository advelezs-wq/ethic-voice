"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Checkbox } from "@heroui/checkbox";
import { CompleteFormData } from "../../lib/schemas/ethicline.schema";
import { AttachmentUploader, UploadedAttachment } from "../AttachmentUploader";
import { useOrganization } from "@clerk/nextjs";

export function Step4Evidence() {
  const { control, setValue } = useFormContext<CompleteFormData>();
  const { organization } = useOrganization();

  const handleAttachmentsChange = (newAttachments: UploadedAttachment[]) => {
    setValue("uploadedFiles", newAttachments);
  };

  return (
    <div className="space-y-6 flex flex-col items-center">
      <p className="text-gray-600">
                  Opcional: Adjunte evidencias que ayuden en la investigación (máx. 50MB
        por archivo).
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
              <span className="text-sm">
                Declaro que la información proporcionada es verídica y autorizo
                su uso para la investigación correspondiente.
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
