"use client";

import { Spinner } from "@heroui/react";
import React from "react";

const MESSAGES = [
  "Cargando tu panel...",
  "Preparando tus métricas...",
  "Sincronizando tu organización...",
  "Actualizando notificaciones...",
  "Verificando permisos de equipo...",
  "Aplicando preferencias...",
];

export default function Loading() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gray-200 text-gray-600 flex items-center justify-center">
          <i className="icon-[lucide--layout-dashboard] size-8" />
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Spinner color="primary" aria-label="Cargando" />
          <p className="text-gray-600">{MESSAGES[index]}</p>
        </div>
      </div>
    </div>
  );
}
