"use client";

import React from "react";
import { Button } from "@heroui/react";

interface ChatErrorProps {
  error: string;
  onRetry?: () => void;
}

export function ChatError({ error, onRetry }: ChatErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 bg-red-50 rounded-2xl mb-4">
        <i className="icon-[lucide--message-circle-x] size-10 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        Error al cargar los mensajes
      </h3>
      <p className="text-sm text-gray-500 mb-5 max-w-sm">
        {error || "Ocurrió un error inesperado. Por favor, intenta nuevamente."}
      </p>
      {onRetry && (
        <Button
          color="primary"
          size="sm"
          onPress={onRetry}
          startContent={<i className="icon-[lucide--refresh-cw] size-4" />}
        >
          Reintentar
        </Button>
      )}
    </div>
  );
}
