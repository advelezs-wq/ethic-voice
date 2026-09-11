"use client";

import React from "react";
import { Tooltip, Spinner } from "@heroui/react";
import { useSubmissionQueueInfo } from "../../hooks/useSubmissionQueueInfo";
import { formatEtaShort } from "../../utils/date.utils";

interface AIQueueInlineStatusProps {
  submissionId: number;
  className?: string;
  size?: "xs" | "sm";
}

export const AIQueueInlineStatus: React.FC<AIQueueInlineStatusProps> = ({
  submissionId,
  className,
  size = "sm",
}) => {
  const { info, loading, refresh } = useSubmissionQueueInfo(submissionId);

  const pos = info?.position ?? undefined;
  const etaText = formatEtaShort(info?.eta || null);

  const relativeMinutes = React.useMemo(() => {
    if (!info?.eta) return null;
    const ms = new Date(info.eta).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return null;
    const mins = Math.ceil(ms / 60000);
    if (mins <= 0) return null;
    return `~${mins} min`;
  }, [info?.eta]);

  const textSize = size === "xs" ? "text-xs" : "text-sm";

  // El nombre de la columna ("Análisis") ya da el contexto, así que el texto
  // aquí solo necesita el estado — repetir "Análisis AI en cola" forzaba un
  // párrafo largo dentro de una celda angosta.
  return (
    <div className={`flex flex-col items-start gap-1 ${className || ""}`}>
      <Tooltip content="ETA aprox.">
        <span className={`${textSize} text-sky-700 whitespace-nowrap`}>
          {loading && <Spinner size="sm" className="mr-1 inline" />}
          En cola{pos ? ` #${pos}` : ""}
          {info?.status === "active" && relativeMinutes
            ? ` · ${relativeMinutes}`
            : etaText
              ? ` · ${etaText}`
              : ""}
        </span>
      </Tooltip>
      <button
        type="button"
        onClick={() => refresh()}
        className={`${textSize} underline text-sky-700 hover:text-sky-700`}
      >
        Actualizar
      </button>
    </div>
  );
}; 