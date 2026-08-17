"use client";

import React from "react";
import { Button, Tooltip } from "@heroui/react";

interface ChatHeaderProps {
  reportId: number;
  showInternal: boolean;
  onToggleInternal: (show: boolean) => void;
  onRefresh: () => void;
}

export function ChatHeader({
  reportId,
  showInternal,
  onToggleInternal,
  onRefresh,
}: ChatHeaderProps) {
  return (
    <div className="px-4 py-3 border-b bg-emerald-50/40 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 bg-sky-100 rounded-lg shrink-0">
          <i className="icon-[lucide--message-circle] size-4 text-sky-700" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#0d212c] leading-tight">
            Comunicación del caso #{reportId}
          </h2>
          <p className="text-xs text-slate-400">
            Los mensajes no internos los ve también quien denunció
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Tooltip
          content={
            showInternal
              ? "Mostrando notas internas del equipo y mensajes visibles al denunciante. Clic para ocultar las internas."
              : "Solo mensajes visibles al denunciante. Clic para ver también las notas internas del equipo."
          }
          placement="bottom"
        >
          <Button
            size="sm"
            variant={showInternal ? "flat" : "light"}
            color={showInternal ? "primary" : "default"}
            onPress={() => onToggleInternal(!showInternal)}
            startContent={
              <i
                className={`${
                  showInternal ? "icon-[lucide--eye]" : "icon-[lucide--eye-off]"
                } size-3.5`}
              />
            }
          >
            {showInternal ? "Todos" : "Solo visibles al denunciante"}
          </Button>
        </Tooltip>

        <Tooltip content="Actualizar mensajes" placement="bottom">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onRefresh}
            aria-label="Actualizar mensajes"
          >
            <i className="icon-[lucide--refresh-cw] size-4 text-slate-400" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
