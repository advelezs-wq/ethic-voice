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
    <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
          <i className="icon-[lucide--message-circle] size-4 text-blue-700" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 leading-tight">
            Comunicación del caso #{reportId}
          </h2>
          <p className="text-xs text-gray-500">Canal seguro y confidencial</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Tooltip
          content={
            showInternal
              ? "Mostrando mensajes internos y externos. Clic para ocultar internos."
              : "Solo mensajes externos. Clic para ver también los internos."
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
            {showInternal ? "Todos" : "Solo externos"}
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
            <i className="icon-[lucide--refresh-cw] size-4 text-gray-500" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
