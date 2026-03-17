"use client";

import React from "react";

interface ChatErrorProps {
  error: string;
  onRetry?: () => void;
}

export function ChatError({ error, onRetry }: ChatErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 mb-4 text-red-500">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        Error al cargar los mensajes
      </h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">
        {error || "Ocurrió un error inesperado. Por favor, intenta nuevamente."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
