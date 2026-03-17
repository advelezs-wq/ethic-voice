"use client";

import React from "react";
import { formatFileSize } from "@/modules/app/utils/reports";
import { cn, Image } from "@heroui/react";

interface MessageAttachmentsProps {
  attachments: Array<{
    id: number;
    filename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  className?: string;
}

export function MessageAttachments({
  attachments,
  className,
}: MessageAttachmentsProps) {
  if (attachments.length === 0) return null;

  const isImage = (mimeType: string) => mimeType.startsWith("image/");
  const isPDF = (mimeType: string) => mimeType === "application/pdf";

  const getFileIcon = (mimeType: string) => {
    if (isImage(mimeType)) return "🖼️";
    if (isPDF(mimeType)) return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "📊";
    return "📎";
  };

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      {attachments.map((attachment) => (
        <div key={attachment.id}>
          {isImage(attachment.mimeType) ? (
            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-xs rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
            >
              <Image
                src={attachment.fileUrl}
                alt={attachment.filename}
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="bg-gray-100 px-3 py-2 text-xs text-gray-600">
                {attachment.filename} • {formatFileSize(attachment.fileSize)}
              </div>
            </a>
          ) : (
            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span className="text-lg">
                {getFileIcon(attachment.mimeType)}
              </span>
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {attachment.filename}
                </div>
                <div className="text-gray-500">
                  {formatFileSize(attachment.fileSize)}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
