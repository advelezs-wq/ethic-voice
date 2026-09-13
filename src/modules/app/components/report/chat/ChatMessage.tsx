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
  const [pendingDelete, setPendingDelete] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwnMessage = message.authorId === user?.id;
  const canEdit = isOwnMessage && !message.isOptimistic && message.id > 0;
  const canDelete = isOwnMessage && !message.isOptimistic && message.id > 0;

  const handleEdit = async (newContent: string) => {
    await onEdit(message.id, newContent);
    setIsEditing(false);
  };

  /* Two-step delete: first click arms, second click confirms */
  const handleDelete = async () => {
    if (!pendingDelete) {
      setPendingDelete(true);
      deleteTimerRef.current = setTimeout(() => setPendingDelete(false), 3000);
      return;
    }
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDelete(false);
    await onDelete(message.id);
  };

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Highlights @mentions and links #t123 task refs without ever putting
  // message content through dangerouslySetInnerHTML. Message content is
  // free text written by any org member with report access — rendering it
  // as raw HTML let one member's chat message run arbitrary script in
  // every other viewer's session (including admins), a stored XSS with a
  // real privilege-escalation path since actions in this app are plain
  // same-origin fetches that ride the viewer's session.
  const renderContent = (content: string): React.ReactNode => {
    const mentionNames = (message.mentions || []).map((m) => m.userName);
    const mentionAlternatives = mentionNames
      .map((name) => `@${escapeRegExp(name)}`)
      .join("|");
    const pattern = mentionAlternatives
      ? `(${mentionAlternatives})|(#t\\d+)`
      : `(#t\\d+)`;
    const regex = new RegExp(pattern, "g");

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(content.slice(lastIndex, match.index));
      }
      const matched = match[0];
      if (matched.startsWith("@")) {
        nodes.push(
          <span
            key={key++}
            className="bg-sky-100 text-sky-700 px-1 rounded"
          >
            {matched}
          </span>
        );
      } else {
        const id = matched.slice(2);
        nodes.push(
          <a
            key={key++}
            href={`?tab=tasks&task=${id}`}
            className="text-sky-700 underline"
          >
            {matched}
          </a>
        );
      }
      lastIndex = match.index + matched.length;
    }
    if (lastIndex < content.length) {
      nodes.push(content.slice(lastIndex));
    }
    return nodes;
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
        <div className="w-8 h-8 rounded-full bg-slate-300 flex-shrink-0 flex items-center justify-center text-sm font-medium overflow-hidden">
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
            <span className="font-medium text-sm text-[#0d212c]">
              {message.authorName}
            </span>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
            {message.isEdited && (
              <span className="text-xs text-slate-400">(editado)</span>
            )}
            {message.isInternal && (
              <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                <i className="icon-[lucide--lock] size-3" />
                Interno
              </span>
            )}
            {pendingDelete && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                <i className="icon-[lucide--trash-2] size-3" />
                Clic para confirmar eliminación
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
                : "bg-sky-500 text-white"
              : "bg-emerald-50 text-[#0d212c]",
            !isFirstInGroup && "mt-0.5",
            message.parentId && "ml-4 border-l-2 border-emerald-200"
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
              {renderContent(message.content)}
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
              <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
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
                      className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[10px] text-slate-600 border border-white overflow-hidden"
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
                    <div className="px-1 h-4 rounded-full bg-emerald-100 text-[10px] text-slate-600 flex items-center justify-center border border-white">
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
