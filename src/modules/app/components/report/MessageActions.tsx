// components/chat/MessageActions.tsx
"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
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

  // Enhanced permission checks
  const canUserEdit = canEdit && permissions.canEditReports;
  const canUserDelete = canDelete && permissions.canEditReports;
  const canUserReact = true; // Everyone can react
  const canUserReply = true; // Everyone can reply

  return (
    <div className="absolute -top-8 right-0 flex items-center gap-1 bg-white border rounded-lg shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {canUserReact &&
        quickReactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={`React with ${emoji}`}
          >
            <span className="text-sm">{emoji}</span>
          </button>
        ))}

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {canUserReply && (
        <button
          onClick={onReply}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Responder"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>
      )}

      <Dropdown>
        <DropdownTrigger asChild>
          <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </DropdownTrigger>
        <DropdownMenu>
          {canUserEdit ? (
            <DropdownItem key="edit" onClick={onEdit}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar
            </DropdownItem>
          ) : null}

          <DropdownItem
            key="copy"
            onClick={() => navigator.clipboard.writeText(message.content)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copiar
          </DropdownItem>

          {canUserDelete ? (
            <DropdownItem
              key="delete"
              onClick={onDelete}
              className="text-red-600"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Eliminar
            </DropdownItem>
          ) : null}

          {!canUserEdit && !canUserDelete ? (
            <DropdownItem key="no-permissions" className="text-gray-500">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Sin permisos de edición
            </DropdownItem>
          ) : null}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
