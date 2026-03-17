"use client";

import { useState, useRef } from "react";
import { Button, Card, Progress } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import { formatFileSize } from "@/modules/app/utils/reports";

export interface UploadedAttachment {
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  cloudinaryPublicId: string;
}

interface AttachmentUploaderProps {
  onAttachmentsChange: (attachments: UploadedAttachment[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  maxFiles?: number;
  orgId: string;
}

export function AttachmentUploader({
  onAttachmentsChange,
  onUploadingChange,
  maxFiles = 10,
  orgId,
}: AttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    const newFiles = Array.from(files);

    // Check total file limit
    if (attachments.length + newFiles.length > maxFiles) {
      addToast({
        title: "Límite de archivos alcanzado",
        description: `Máximo ${maxFiles} archivos permitidos`,
        color: "warning",
      });
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);

    // Start uploading each file
    for (const file of newFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
    onUploadingChange?.(false);
  };

  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      addToast({
        title: "Archivo muy grande",
        description: `El archivo ${file.name} excede el límite de 50MB`,
        color: "danger",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "video/mp4",
      "video/avi",
      "video/quicktime",
      "video/webm",
    ];

    if (!allowedTypes.includes(file.type)) {
      addToast({
        title: "Tipo de archivo no permitido",
        description: `El formato ${file.type} no está permitido`,
        color: "danger",
      });
      return;
    }

    setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", orgId);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [fileId]: Math.min(prev[fileId] + Math.random() * 30, 90),
        }));
      }, 500);

      const response = await fetch("/api/upload/attachments", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error subiendo archivo");
      }

      const result = await response.json();
      const newAttachment: UploadedAttachment = result.attachment;

      setAttachments((prev) => {
        const updated = [...prev, newAttachment];
        onAttachmentsChange(updated);
        return updated;
      });

      setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

      // Show success toast
      addToast({
        title: "Archivo subido exitosamente",
        description: `${file.name} se ha subido correctamente`,
        color: "success",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      addToast({
        title: "Error al subir archivo",
        description: `Error subiendo ${file.name}: ${error instanceof Error ? error.message : "Error desconocido"}`,
        color: "danger",
      });
    } finally {
      setTimeout(() => {
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }, 2000);
    }
  };

  const removeAttachment = (index: number) => {
    const fileToRemove = attachments[index];
    setAttachments((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      onAttachmentsChange(updated);
      return updated;
    });

    addToast({
      title: "Archivo eliminado",
      description: `${fileToRemove?.filename || "Archivo"} ha sido eliminado`,
      color: "warning",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "[IMG]";
    if (mimeType === "application/pdf") return "[PDF]";
    if (mimeType.includes("word")) return "[DOC]";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "[XLS]";
    if (mimeType.startsWith("audio/")) return "[AUD]";
    if (mimeType.startsWith("video/")) return "[VID]";
    return "[FILE]";
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "Imagen";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.includes("word")) return "Documento";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "Hoja de cálculo";
    if (mimeType.startsWith("audio/")) return "Audio";
    if (mimeType.startsWith("video/")) return "Video";
    return "Archivo";
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={(e) => {
          // Only trigger file selection if clicking outside the button
          if (
            e.target === e.currentTarget ||
            !(e.target as Element).closest("button")
          ) {
            fileInputRef.current?.click();
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFileSelect(files);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
      >
        <div className="space-y-4">
          <div>
            <i className="icon-[lucide--paperclip] size-12 text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Imágenes, documentos, audio, video - Máximo 50MB por archivo
            </p>
          </div>
          <Button
            color="primary"
            variant="flat"
            onPress={() => {
              fileInputRef.current?.click();
            }}
          >
            Seleccionar Archivos
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,audio/*,video/*"
        className="hidden"
        aria-label="Seleccionar archivos adjuntos"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files);
            e.target.value = ""; // Reset input
          }
        }}
      />

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([fileId, progress]) => (
        <Card key={fileId} className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subiendo...</span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </Card>
      ))}

      {/* Upload Status */}
      {isUploading && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-800 font-medium">
              Subiendo archivos... Por favor espera antes de enviar el
              formulario.
            </span>
          </div>
        </Card>
      )}

      {/* Uploaded Files List */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">
            Archivos adjuntos ({attachments.length}/{maxFiles})
          </h4>

          {attachments.map((attachment, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getFileIcon(attachment.mimeType)}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {attachment.filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getFileTypeLabel(attachment.mimeType)} •{" "}
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => window.open(attachment.fileUrl, "_blank")}
                  >
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => removeAttachment(index)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
            <i className="icon-[lucide--info] size-4" />
            Tipos de archivos permitidos:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <i className="icon-[lucide--image] size-4 inline mr-2 text-blue-600" />{" "}
              <strong>Imágenes:</strong> JPG, PNG, GIF, WebP
            </li>
            <li>
              <i className="icon-[lucide--file-text] size-4 inline mr-2 text-blue-600" />{" "}
              <strong>Documentos:</strong> PDF, Word, Excel, TXT
            </li>
            <li>
              <i className="icon-[lucide--volume-2] size-4 inline mr-2 text-blue-600" />{" "}
              <strong>Audio:</strong> MP3, WAV, M4A
            </li>
            <li>
              <i className="icon-[lucide--video] size-4 inline mr-2 text-blue-600" />{" "}
              <strong>Video:</strong> MP4, AVI, MOV, WebM
            </li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            <strong>Nota:</strong> Todos los archivos son tratados con total
            confidencialidad y almacenados de forma segura.
          </p>
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,audio/*,video/*"
        aria-label="Seleccionar archivos para cargar"
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelect(e.target.files);
          }
        }}
        style={{ display: "none" }}
      />
    </div>
  );
}
