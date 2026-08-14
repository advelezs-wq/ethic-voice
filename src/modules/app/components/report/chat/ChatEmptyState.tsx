"use client";

import React from "react";

export function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 bg-sky-50 rounded-2xl mb-4">
        <i className="icon-[lucide--message-circle] size-10 text-sky-400" />
      </div>
      <h3 className="text-base font-semibold text-[#0d212c] mb-1">
        Sin mensajes aún
      </h3>
      <p className="text-sm text-slate-400 max-w-sm">
        Inicia la conversación enviando el primer mensaje. Todos los mensajes
        quedan registrados y son confidenciales.
      </p>
    </div>
  );
}
