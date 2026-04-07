// components/chat/ReportChat.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useReportChat } from "../../hooks/useReportChat";
import { ChatError } from "./chat/ChatError";
import { ChatHeader } from "./chat/ChatHeader";
import { cn } from "@heroui/react";
import { ChatLoadingSkeleton } from "./chat/ChatLoadingSkeleton";
import { ChatEmptyState } from "./chat/ChatEmptyState";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatTypingIndicator } from "./chat/ChatTypingIndicator";
import { ChatInput } from "./chat/ChatInput";

interface ReportChatProps {
  reportId: number;
  className?: string;
  height?: string;
  reportStatus?: string;
  onUnreadChange?: (count: number) => void;
}

export function ReportChat({
  reportId,
  className,
  height = "600px",
  reportStatus,
  onUnreadChange,
}: ReportChatProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showInternal, setShowInternal] = useState(true);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // Check if report is closed - archived reports should also be treated as closed
  const isReportClosed =
    reportStatus === "CLOSED" ||
    reportStatus === "RESOLVED" ||
    reportStatus === "ARCHIVED";

  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    typingUsers,
    typingUsersList,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    sendTypingIndicator,
    trackMessageVisibility,
    loadMoreRef,
    refresh,
    unreadCount,
  } = useReportChat({
    reportId,
    includeInternal: showInternal,
    enableRealtime: true,
    autoMarkAsRead: true,
  });

  // Notify parent about unread changes
  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  // Scroll handling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsScrolledToBottom(isAtBottom);
    // Persist position and flag
    try {
      const key = `chat-scroll-${reportId}-${showInternal ? "internal" : "all"}`;
      const payload = {
        isAtBottom,
        scrollTop,
      };
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }, [reportId, showInternal]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (
      isScrolledToBottom &&
      messages.length > 0 &&
      scrollContainerRef.current
    ) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages.length, isScrolledToBottom]);

  // Restore scroll state when tab opens or filter changes
  useEffect(() => {
    try {
      const key = `chat-scroll-${reportId}-${showInternal ? "internal" : "all"}`;
      const raw = sessionStorage.getItem(key);
      if (raw && scrollContainerRef.current) {
        const { isAtBottom, scrollTop } = JSON.parse(raw);
        if (!isAtBottom) {
          scrollContainerRef.current.scrollTop = scrollTop || 0;
          setIsScrolledToBottom(false);
        }
      }
    } catch {}
  }, [reportId, showInternal]);

  // Track message visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = Number(
            entry.target.getAttribute("data-message-id")
          );
          if (!isNaN(messageId)) {
            trackMessageVisibility(messageId, entry.isIntersecting);
          }
        });
      },
      { root: scrollContainerRef.current, threshold: 0.5 }
    );

    const messageElements =
      scrollContainerRef.current?.querySelectorAll("[data-message-id]");
    messageElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, trackMessageVisibility]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  if (error) {
    return <ChatError error={error} onRetry={refresh} />;
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-white rounded-md shadow-sm border",
        className
      )}
      style={{ height }}
    >
      <ChatHeader
        reportId={reportId}
        showInternal={showInternal}
        onToggleInternal={setShowInternal}
        onRefresh={refresh}
      />

      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <ChatLoadingSkeleton />
        ) : messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <>
            <div
              ref={scrollContainerRef}
              className="h-full overflow-y-auto px-4 py-2"
              onScroll={handleScroll}
            >
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-2">
                  {isLoadingMore && (
                    <div className="text-sm text-gray-500">
                      Cargando mensajes anteriores...
                    </div>
                  )}
                </div>
              )}

              {messages.map((message, index) => {
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const nextMessage =
                  index < messages.length - 1 ? messages[index + 1] : null;

                const isFirstInGroup =
                  index === 0 ||
                  !previousMessage ||
                  previousMessage.authorId !== message.authorId ||
                  new Date(message.createdAt).getTime() -
                    new Date(previousMessage.createdAt).getTime() >
                    300000; // 5 minutes

                const isLastInGroup =
                  index === messages.length - 1 ||
                  !nextMessage ||
                  nextMessage.authorId !== message.authorId ||
                  new Date(nextMessage.createdAt).getTime() -
                    new Date(message.createdAt).getTime() >
                    300000;

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                    onReact={toggleReaction}
                    onReply={() => {
                      /* reply functionality placeholder */
                    }}
                  />
                );
              })}
            </div>

            {!isScrolledToBottom && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-20 right-4 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                aria-label="Ir al mensaje más reciente"
                title="Ir al mensaje más reciente"
              >
                <i className="icon-[lucide--chevrons-down] size-4 text-gray-600" />
              </button>
            )}
          </>
        )}

        {typingUsers && !isReportClosed && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-white">
            <ChatTypingIndicator text={typingUsers} />
          </div>
        )}
      </div>

      <ChatInput
        reportId={reportId}
        onSendMessage={sendMessage}
        onTyping={sendTypingIndicator}
        isReportClosed={isReportClosed}
      />
    </div>
  );
}
