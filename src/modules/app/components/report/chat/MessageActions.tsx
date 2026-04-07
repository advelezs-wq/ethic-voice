// components/chat/MessageActions.tsx
"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@heroui/react";
import React from "react";
import { useUserRole } from "@/modules/core/hooks/useUserRole";

interface MessageActionsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
}

const quickReactions = ["👍", "❤️", "😄", "😮", "😢", "🎉"];

export function MessageActions({
  message,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onReply,
  onReact,
}: MessageActionsProps) {
  const { permissions } = useUserRole();

  const canUserEdit = canEdit && permissions.canEditReports;
  const canUserDelete = canDelete && permissions.canEditReports;

  const menuItems = [];

  if (canUserEdit) {
    menuItems.push(
      <DropdownItem
        key="edit"
        onClick={onEdit}
        startContent={<i className="icon-[lucide--pencil] size-4" />}
      >
        Editar
      </DropdownItem>
    );
  }

  menuItems.push(
    <DropdownItem
      key="copy"
      onClick={() => navigator.clipboard.writeText(message.content)}
      startContent={<i className="icon-[lucide--copy] size-4" />}
    >
      Copiar texto
    </DropdownItem>
  );

  if (canUserDelete) {
    menuItems.push(
      <DropdownItem
        key="delete"
        onClick={onDelete}
        className="text-red-600"
        startContent={<i className="icon-[lucide--trash-2] size-4 text-red-500" />}
      >
        Eliminar
      </DropdownItem>
    );
  }

  return (
    <div className="absolute -top-9 right-0 flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl shadow-lg px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {quickReactions.map((emoji) => (
        <Tooltip key={emoji} content={emoji} placement="top">
          <button
            onClick={() => onReact(emoji)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-sm leading-none"
            aria-label={`Reaccionar con ${emoji}`}
          >
            {emoji}
          </button>
        </Tooltip>
      ))}

      <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      <Tooltip content="Responder" placement="top">
        <button
          onClick={onReply}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Responder"
        >
          <i className="icon-[lucide--reply] size-3.5" />
        </button>
      </Tooltip>

      <Dropdown>
        <DropdownTrigger asChild>
          <button
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Más opciones"
          >
            <i className="icon-[lucide--more-vertical] size-3.5" />
          </button>
        </DropdownTrigger>
        <DropdownMenu>{menuItems}</DropdownMenu>
      </Dropdown>
    </div>
  );
}
