"use client";

import Image from "next/image";
import { Spinner } from "@heroui/react";
import React from "react";

const MESSAGES = [
  "Cargando la plataforma...",
  "Sincronizando datos...",
  "Verificando configuraciones...",
  "Aplicando tu tema...",
  "Optimizando rendimiento...",
  "Listando recursos...",
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
        <Image
          src="/brand/logo-nobg.png"
          alt="Cargando EthicVoice"
          width={160}
          height={160}
          priority
          className="mx-auto h-auto w-40"
        />
        <div className="mt-6 flex flex-col items-center gap-3">
          <Spinner color="primary" aria-label="Cargando" />
          <p className="text-gray-600">{MESSAGES[index]}</p>
        </div>
      </div>
    </div>
  );
}
