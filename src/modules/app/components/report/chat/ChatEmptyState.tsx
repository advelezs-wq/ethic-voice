"use client";

import React from "react";

export function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 bg-blue-50 rounded-2xl mb-4">
        <i className="icon-[lucide--message-circle] size-10 text-blue-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        Sin mensajes aún
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Inicia la conversación enviando el primer mensaje. Todos los mensajes
        quedan registrados y son confidenciales.
      </p>
    </div>
  );
}
