"use client";

import React, { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Progress } from "@heroui/progress";
import { addToast } from "@/modules/core/utils/safe-toast";
// Simple className concatenation utility
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

interface OrganizationLogoDropzoneProps {
  organizationId: string;
  currentLogo?: string;
  onLogoUpdated: (logoUrl: string) => void;
  onLogoRemoved: () => void;
  className?: string;
}

export function OrganizationLogoDropzone({
  organizationId,
  currentLogo,
  onLogoUpdated,
  onLogoRemoved,
  className,
}: OrganizationLogoDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      await uploadFile(file);
    },
    [organizationId]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".svg", ".gif"],
      },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB
      multiple: false,
    });

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      addToast({
        title: "Tipo de archivo no válido",
        description:
          "Por favor selecciona un archivo de imagen válido (PNG, JPG, JPEG, SVG, GIF)",
        color: "danger",
      });
      return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        color: "danger",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("logo", file);
      formData.append("organizationId", organizationId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch("/api/organization/logo/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al subir el logo");
      }

      const result = await response.json();

      addToast({
        title: "Logo actualizado exitosamente",
        description: "El logo de tu organización ha sido actualizado",
        color: "success",
      });

      // Persist in Clerk + DB as organization logo
      try {
        // Update only logo; name remains unchanged (API accepts provided name or ignores null)
        await fetch(`/api/organization/${organizationId}/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: undefined as unknown as string,
            logoUrl: result.logoUrl,
          }),
        });
      } catch {}

      onLogoUpdated(result.logoUrl);
    } catch (error) {
      console.error("Error uploading logo:", error);
      addToast({
        title: "Error al subir logo",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo subir el logo. Intenta nuevamente",
        color: "danger",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const response = await fetch("/api/organization/logo/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar el logo");
      }

      addToast({
        title: "Logo eliminado",
        description: "El logo ha sido eliminado exitosamente",
        color: "success",
      });

      onLogoRemoved();
    } catch (error) {
      console.error("Error removing logo:", error);
      addToast({
        title: "Error al eliminar logo",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el logo. Intenta nuevamente",
        color: "danger",
      });
    }
  };

  // Handle file rejections
  React.useEffect(() => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      let message = "Error al procesar el archivo";

      if (rejection.errors[0]?.code === "file-too-large") {
        message = "El archivo es muy grande. Máximo permitido: 5MB";
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        message = "Tipo de archivo no válido. Usa PNG, JPG, JPEG, SVG o GIF";
      }

      addToast({
        title: "Archivo rechazado",
        description: message,
        color: "danger",
      });
    }
  }, [fileRejections]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start gap-6">
        <div className="flex-1">
          {currentLogo ? (
            <div className="space-y-4">
              {/* Current Logo Preview */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-center">
                  <div className="max-w-xs mx-auto bg-white rounded-lg p-4 shadow-sm">
                    <Image
                      src={currentLogo}
                      alt="Logo actual"
                      className="w-full h-auto object-contain max-h-24"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="flat"
                  color="primary"
                  onPress={() => fileInputRef.current?.click()}
                  isDisabled={uploading}
                  startContent={<i className="icon-[lucide--upload] size-4" />}
                >
                  Cambiar Logo
                </Button>
                <Button
                  variant="flat"
                  color="danger"
                  onPress={handleRemoveLogo}
                  isDisabled={uploading}
                  startContent={<i className="icon-[lucide--trash-2] size-4" />}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-primary bg-primary-50 border-solid"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                uploading && "pointer-events-none opacity-50"
              )}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  {isDragActive ? (
                    <i className="icon-[lucide--download] size-8 text-primary" />
                  ) : (
                    <i className="icon-[lucide--image] size-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {isDragActive
                      ? "Suelta el archivo aquí"
                      : "Arrastra el logo aquí o haz clic para seleccionar"}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    PNG, JPG, JPEG, SVG o GIF hasta 5MB
                  </p>
                </div>
                {!isDragActive && (
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => fileInputRef.current?.click()}
                    isDisabled={uploading}
                  >
                    <i className="icon-[lucide--upload] size-4 mr-2" />
                    Seleccionar Archivo
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Subiendo logo...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress
                value={uploadProgress}
                color="primary"
                className="w-full"
              />
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                uploadFile(e.target.files[0]);
                e.target.value = ""; // Reset input
              }
            }}
            className="hidden"
            aria-label="Seleccionar archivo de logo"
          />
        </div>

        {/* Recommendations Panel */}
        <div className="w-80">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-3">
              <i className="icon-[lucide--info] size-4 mr-2 inline" />
              Recomendaciones para el Logo
            </h5>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-600 mt-1 flex-shrink-0" />
                Tamaño recomendado: 200x60 píxeles
              </li>
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-600 mt-1 flex-shrink-0" />
                Formatos: PNG, JPG, JPEG, SVG, GIF
              </li>
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-600 mt-1 flex-shrink-0" />
                Tamaño máximo: 5MB
              </li>
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-600 mt-1 flex-shrink-0" />
                Fondo transparente recomendado
              </li>
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-600 mt-1 flex-shrink-0" />
                Asegúrate de que sea legible en fondos claros
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
