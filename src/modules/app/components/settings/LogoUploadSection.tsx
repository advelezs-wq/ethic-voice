"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Image, Progress } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import { useTheme } from "@/modules/core/providers/ThemeProvider";

interface LogoUploadSectionProps {
  organizationId: string;
}

export function LogoUploadSection({ organizationId }: LogoUploadSectionProps) {
  const { settings, updateSettings } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current logo from context
  useEffect(() => {
    if (settings?.logoUrl) {
      setCurrentLogo(settings.logoUrl);
    }
  }, [settings]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      addToast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        color: "danger",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "Error",
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
        throw new Error("Error al subir el logo");
      }

      const result = await response.json();
      const logoUrl = result.logoUrl;

      // Update through theme context for real-time application
      await updateSettings({ logoUrl });
      setCurrentLogo(logoUrl);

      addToast({
        title: "Logo actualizado",
        description:
          "El logo de tu organización ha sido actualizado exitosamente",
        color: "success",
      });
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo subir el logo. Intenta nuevamente",
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
        throw new Error("Error al eliminar el logo");
      }

      // Update through theme context for real-time application
      await updateSettings({ logoUrl: undefined });
      setCurrentLogo(null);

      addToast({
        title: "Logo eliminado",
        description: "El logo ha sido eliminado exitosamente",
        color: "success",
      });
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo eliminar el logo. Intenta nuevamente",
        color: "danger",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {currentLogo ? (
              <div className="space-y-4">
                <div className="max-w-xs mx-auto">
                  <Image
                    src={currentLogo}
                    alt="Logo actual"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="flat"
                    color="primary"
                    onPress={handleFileSelect}
                    isDisabled={uploading}
                  >
                    <i className="icon-[lucide--upload] size-4 mr-2" />
                    Cambiar Logo
                  </Button>
                  <Button
                    variant="flat"
                    color="danger"
                    onPress={handleRemoveLogo}
                    isDisabled={uploading}
                  >
                    <i className="icon-[lucide--trash-2] size-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className="icon-[lucide--image] size-8 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Sube el logo de tu organización
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Formatos PNG, JPG o SVG hasta 5MB
                  </p>
                </div>
                <Button
                  color="primary"
                  onPress={handleFileSelect}
                  isDisabled={uploading}
                >
                  <i className="icon-[lucide--upload] size-4 mr-2" />
                  Seleccionar Archivo
                </Button>
              </div>
            )}
          </div>

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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Seleccionar archivo de logo"
          />
        </div>

        <div className="w-80">
          <div className="bg-secondary rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">
              <i className="icon-[lucide--info] size-4 mr-2 inline" />
              Recomendaciones
            </h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-500 mt-1 flex-shrink-0" />
                Tamaño recomendado: 200x60 píxeles
              </li>
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-500 mt-1 flex-shrink-0" />
                Formatos soportados: PNG, JPG, SVG
              </li>
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-500 mt-1 flex-shrink-0" />
                Tamaño máximo: 5MB
              </li>
              <li className="flex items-start gap-2">
                <i className="icon-[lucide--check] size-3 text-green-500 mt-1 flex-shrink-0" />
                Fondo transparente recomendado
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
