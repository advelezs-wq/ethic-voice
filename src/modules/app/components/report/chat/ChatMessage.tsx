"use client";

import React, { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChatMessage as ChatMessageType } from "@/actions/chat.actions";
import { MessageActions } from "./MessageActions";
import { MessageReactions } from "./MessageReactions";
import { MessageAttachments } from "./MessageAttachments";
import { EditMessageForm } from "./EditMessageForm";
import { cn } from "@heroui/react";

interface ChatMessageProps {
  message: ChatMessageType & { isOptimistic?: boolean; error?: string };
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onEdit: (messageId: number, content: string) => Promise<void>;
  onDelete: (messageId: number) => Promise<void>;
  onReact: (messageId: number, emoji: string) => Promise<void>;
  onReply: (messageId: number) => void;
}

export function ChatMessage({
  message,
  isFirstInGroup,
  onEdit,
  onDelete,
  onReact,
  onReply,
}: ChatMessageProps) {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const isOwnMessage = message.authorId === user?.id;
  const canEdit = isOwnMessage && !message.isOptimistic && message.id > 0;
  const canDelete = isOwnMessage && !message.isOptimistic && message.id > 0;

  const handleEdit = async (newContent: string) => {
    await onEdit(message.id, newContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar este mensaje?")) {
      await onDelete(message.id);
    }
  };

  const renderContent = (content: string) => {
    if (!message.mentions || message.mentions.length === 0) {
      // Replace task refs like #t123 with links to tasks tab
      const withTasks = content.replace(
        /#t(\d+)/g,
        (_m, id) =>
          `<a href="?tab=tasks&task=${id}" class="text-blue-700 underline">#t${id}</a>`
      );
      return withTasks;
    }

    let renderedContent = content;
    message.mentions.forEach((mention) => {
      const mentionRegex = new RegExp(`@${mention.userName}`, "g");
      renderedContent = renderedContent.replace(
        mentionRegex,
        `<span class="bg-blue-100 text-blue-800 px-1 rounded">@${mention.userName}</span>`
      );
    });

    // Also convert task refs when mentions exist
    renderedContent = renderedContent.replace(
      /#t(\d+)/g,
      (_m, id) =>
        `<a href="?tab=tasks&task=${id}" class="text-blue-700 underline">#t${id}</a>`
    );

    return <div dangerouslySetInnerHTML={{ __html: renderedContent }} />;
  };

  return (
    <div
      ref={messageRef}
      data-message-id={message.id}
      className={cn(
        "group relative flex items-start gap-3 px-4 py-1",
        isOwnMessage && "flex-row-reverse",
        message.isOptimistic && "opacity-70",
        message.error && "opacity-50"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isFirstInGroup && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-sm font-medium overflow-hidden">
          {message.authorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={message.authorAvatarUrl} alt={message.authorName} className="w-full h-full object-cover" />
          ) : (
            message.authorName.charAt(0).toUpperCase()
          )}
        </div>
      )}
      {!isFirstInGroup && <div className="w-8 flex-shrink-0" />}

      <div
        className={cn(
          "flex-1 max-w-[70%]",
          isOwnMessage && "flex flex-col items-end"
        )}
      >
        {isFirstInGroup && (
          <div
            className={cn(
              "flex items-baseline gap-2 mb-1",
              isOwnMessage && "flex-row-reverse"
            )}
          >
            <span className="font-medium text-sm text-gray-900">
              {message.authorName}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
            {message.isEdited && (
              <span className="text-xs text-gray-400">(editado)</span>
            )}
            {message.isInternal && (
              <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                <svg
                  className="w-3 h-3"
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
                Interno
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative rounded-2xl px-4 py-2 break-words",
            isOwnMessage
              ? message.isInternal
                ? "bg-yellow-100 text-yellow-900"
                : "bg-blue-400 text-white"
              : "bg-gray-100 text-gray-900",
            !isFirstInGroup && "mt-0.5",
            message.parentId && "ml-4 border-l-2 border-gray-300"
          )}
        >
          {message.parentId && (
            <div className="text-xs opacity-70 mb-1">
              En respuesta a un mensaje anterior
            </div>
          )}

          {isEditing ? (
            <EditMessageForm
              initialContent={message.content}
              onSave={handleEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {typeof renderContent(message.content) === "string"
                ? renderContent(message.content)
                : renderContent(message.content)}
            </div>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <MessageAttachments attachments={message.attachments} />
          )}

          {message.error && (
            <div className="text-xs text-red-600 mt-1">
              Error al enviar el mensaje
            </div>
          )}

          {message.isOptimistic && !message.error && (
            <div className="absolute inset-0 bg-white/20 rounded-2xl flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {message.reactions &&
          message.reactions.length > 0 &&
          !message.isOptimistic && (
            <MessageReactions
              reactions={message.reactions}
              onToggleReaction={(emoji) => onReact(message.id, emoji)}
            />
          )}

        {/* Read receipts cluster */}
        {!message.isOptimistic && message.readBy && message.readBy.length > 0 && (
          <div className={cn("mt-1 flex items-center gap-1", isOwnMessage && "justify-end")}> 
            {(() => {
              // Deduplicate by userId, keep latest
              const latestByUser = new Map<string, { userId: string; userName: string; readAt: string; avatarUrl?: string }>();
              (message.readBy as Array<{ userId: string; userName: string; readAt: string; avatarUrl?: string }>).forEach((r) => {
                const prev = latestByUser.get(r.userId);
                if (!prev || new Date(r.readAt) > new Date(prev.readAt)) {
                  latestByUser.set(r.userId, r);
                }
              });
              const receipts = Array.from(latestByUser.values()).sort(
                (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime()
              );
              const maxToShow = 3;
              const toShow = receipts.slice(0, maxToShow);
              const extra = receipts.length - toShow.length;
              return (
                <>
                  {toShow.map((r) => (
                    <div
                      key={`${r.userId}-${r.readAt}`}
                      title={`${r.userName} vio a las ${new Date(r.readAt).toLocaleTimeString("es-CO")}`}
                      className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[10px] text-gray-700 border border-white overflow-hidden"
                    >
                      {r.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.avatarUrl} alt={r.userName} className="w-full h-full object-cover" />
                      ) : (
                        r.userName.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                  {extra > 0 && (
                    <div className="px-1 h-4 rounded-full bg-gray-200 text-[10px] text-gray-700 flex items-center justify-center border border-white">
                      +{extra}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {showActions && !message.isOptimistic && message.id > 0 && (
          <MessageActions
            message={message}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => setIsEditing(true)}
            onDelete={handleDelete}
            onReply={() => onReply(message.id)}
            onReact={(emoji) => onReact(message.id, emoji)}
          />
        )}
      </div>
    </div>
  );
}
