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

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Tooltip content="ETA aprox.">
        <span className={`${textSize} text-blue-700`}>
          {loading && <Spinner size="sm" className="mr-1 inline" />}
          Análisis AI en cola{pos ? `: ${pos}` : ""} • {etaText}
          {info?.status === "active" && relativeMinutes ? ` (${relativeMinutes})` : ""}
        </span>
      </Tooltip>
      <button
        type="button"
        onClick={() => refresh()}
        className={`${textSize} underline text-blue-700 hover:text-blue-800`}
      >
        Actualizar ahora
      </button>
    </div>
  );
}; 