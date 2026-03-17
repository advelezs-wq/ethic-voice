"use client";

import { cn } from "@heroui/react";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    "image/*": [".png", ".jpeg", ".jpeg", ".gif"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
  },
  className,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400",
        className
      )}
    >
      <input {...getInputProps()} />
      <svg
        className="w-8 h-8 mx-auto mb-2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="text-sm text-gray-600">
        {isDragActive
          ? "Suelta los archivos aquí"
          : "Arrastra archivos o haz clic para seleccionar"}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Máximo {Math.round(maxSize / 1024 / 1024)}MB por archivo
      </p>
    </div>
  );
}
