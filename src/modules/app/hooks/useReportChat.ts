import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
  getReportMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  markAsRead,
  type ChatMessage,
} from "@/actions/chat.actions";
import { useIntersectionObserver } from "./useIntersectionObserver";
import { pusherClient } from "../lib/pusher";

interface UseReportChatOptions {
  reportId: number;
  includeInternal?: boolean;
  enableRealtime?: boolean;
  autoMarkAsRead?: boolean;
}

interface OptimisticMessage extends ChatMessage {
  isOptimistic?: boolean;
  error?: string;
  tempId?: string;
}

export function useReportChat({
  reportId,
  includeInternal = true,
  enableRealtime = true,
  autoMarkAsRead = true,
}: UseReportChatOptions) {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typingUsers, setTypingUsers] = useState<
    Map<string, { userName: string; timestamp: number }>
  >(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
    threshold: 0.1,
    rootMargin: "100px",
  });

  const visibleMessages = useRef<Set<number>>(new Set());
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout>();

  // Define functions first before using them in useEffect
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { messages: loadedMessages, hasMore: moreAvailable } =
        await getReportMessages(reportId, {
          includeInternal,
        });
      setMessages(loadedMessages);
      setHasMore(moreAvailable);
    } catch (err) {
      setError("Failed to load messages");
      console.error("Error loading messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [reportId, includeInternal]);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return;

    try {
      setIsLoadingMore(true);
      const oldestMessage = messages[0];
      const { messages: olderMessages, hasMore: moreAvailable } =
        await getReportMessages(reportId, {
          includeInternal,
          cursor: oldestMessage.id,
        });
      setMessages((prev) => [...olderMessages, ...prev]);
      setHasMore(moreAvailable);
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, messages, reportId, includeInternal]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = pusherClient.subscribe(`report-${reportId}`);

    channel.bind("new-message", (data: { message: ChatMessage }) => {
      // Remove optimistic message if it exists
      setOptimisticMessages((prev) =>
        prev.filter(
          (msg) =>
            !(msg.authorId === user?.id && msg.content === data.message.content)
        )
      );

      // Add the real message
      setMessages((prev) => {
        // Check if message already exists
        if (prev.some((msg) => msg.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
    });

    channel.bind(
      "message-updated",
      (data: { messageId: number; content: string; updatedAt: string }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? {
                  ...msg,
                  content: data.content,
                  updatedAt: data.updatedAt,
                  isEdited: true,
                }
              : msg
          )
        );
      }
    );

    channel.bind("message-deleted", (data: { messageId: number }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    });

    channel.bind("reaction-toggled", () => {
      // Refetch messages to get updated reactions
      loadMessages();
    });

    // Client-typed events
    channel.bind(
      "client-user-typing",
      (data: { userId: string; userName: string }) => {
        if (data.userId !== user?.id) {
          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.set(data.userId, {
              userName: data.userName,
              timestamp: Date.now(),
            });
            return newMap;
          });
        }
      }
    );

    channel.bind("client-user-stopped-typing", (data: { userId: string }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    });

    return () => {
      pusherClient.unsubscribe(`report-${reportId}`);
    };
  }, [reportId, enableRealtime, user?.id, loadMessages]);

  // Clean up stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const now = Date.now();
        for (const [userId, data] of newMap) {
          if (now - data.timestamp > 3000) {
            newMap.delete(userId);
          }
        }
        return newMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load more messages when scrolling
  useEffect(() => {
    if (isIntersecting && hasMore && !isLoadingMore && messages.length > 0) {
      loadMoreMessages();
    }
  }, [isIntersecting, hasMore, isLoadingMore, messages.length, loadMoreMessages]);

  // Auto mark messages as read
  useEffect(() => {
    if (!autoMarkAsRead || messages.length === 0) return;

    clearTimeout(markAsReadTimeoutRef.current);
    markAsReadTimeoutRef.current = setTimeout(() => {
      const unreadMessages = messages
        .filter((msg) => !msg.readBy.some((r) => r.userId === user?.id))
        .filter((msg) => visibleMessages.current.has(msg.id))
        .map((msg) => msg.id);

      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages).catch(console.error);
      }
    }, 1000);

    return () => clearTimeout(markAsReadTimeoutRef.current);
  }, [messages, autoMarkAsRead, user?.id]);

  const sendMessageOptimistic = useCallback(
    async (
      content: string,
      options?: {
        isInternal?: boolean;
        parentId?: number;
        mentions?: Array<{ userId: string; userName: string }>;
        attachmentIds?: number[];
      }
    ) => {
      if (!user || !content.trim()) return;

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: OptimisticMessage = {
        id: -Math.floor(Math.random() * 1000000), // Negative ID for optimistic messages
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: user.id,
        authorName: user.fullName || "Unknown User",
        authorEmail: user.emailAddresses[0]?.emailAddress,
        isInternal: options?.isInternal || false,
        isEdited: false,
        parentId: options?.parentId,
        mentions: options?.mentions || [],
        attachments: [], // Will be populated after upload
        reactions: [],
        readBy: [],
        isOptimistic: true,
        tempId,
      };

      // Add optimistic message
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Send the actual message
        await sendMessage(reportId, content, options);

        // Remove optimistic message
        setOptimisticMessages((prev) =>
          prev.filter((msg) => msg.tempId !== tempId)
        );

        // The real message will be added via Pusher real-time update
      } catch (err) {
        // Mark optimistic message as failed
        setOptimisticMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, error: "Failed to send" } : msg
          )
        );

        console.error("Error sending message:", err);
        throw err;
      }
    },
    [user, reportId]
  );

  const editMessageOptimistic = useCallback(
    async (messageId: number, newContent: string) => {
      if (!user) return;

      const originalMessage = messages.find((msg) => msg.id === messageId);
      if (!originalMessage) return;

      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: newContent,
                isEdited: true,
                updatedAt: new Date().toISOString(),
              }
            : msg
        )
      );

      try {
        await editMessage(messageId, newContent);
      } catch (err) {
        // Rollback on error
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? originalMessage : msg))
        );
        console.error("Error editing message:", err);
        throw err;
      }
    },
    [user, messages]
  );

  const deleteMessageOptimistic = useCallback(
    async (messageId: number) => {
      if (!user) return;

      const messageToDelete = messages.find((msg) => msg.id === messageId);
      if (!messageToDelete) return;

      // Optimistic delete
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      try {
        await deleteMessage(messageId);
      } catch (err) {
        // Rollback on error
        setMessages((prev) => {
          const newMessages = [...prev];
          const insertIndex = newMessages.findIndex(
            (msg) =>
              new Date(msg.createdAt) > new Date(messageToDelete.createdAt)
          );
          if (insertIndex === -1) {
            newMessages.push(messageToDelete);
          } else {
            newMessages.splice(insertIndex, 0, messageToDelete);
          }
          return newMessages;
        });
        console.error("Error deleting message:", err);
        throw err;
      }
    },
    [user, messages]
  );

  const toggleReactionOptimistic = useCallback(
    async (messageId: number, emoji: string) => {
      if (!user) return;

      try {
        await toggleReaction(messageId, emoji);
        // Reactions will be updated via real-time update
      } catch (err) {
        console.error("Error toggling reaction:", err);
        throw err;
      }
    },
    [user]
  );

  const sendTypingIndicator = useCallback(() => {
    if (!user || !enableRealtime) return;

    // Get the channel first
    const channel = pusherClient.subscribe(`report-${reportId}`);

    // Trigger client event (note: must be prefixed with 'client-')
    channel.trigger("client-user-typing", {
      userId: user.id,
      userName: user.fullName || "Unknown User",
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.trigger("client-user-stopped-typing", {
        userId: user.id,
      });
    }, 2000);
  }, [user, reportId, enableRealtime]);

  const trackMessageVisibility = useCallback(
    (messageId: number, isVisible: boolean) => {
      if (isVisible) {
        visibleMessages.current.add(messageId);
      } else {
        visibleMessages.current.delete(messageId);
      }
    },
    []
  );

  // Combine real messages with optimistic ones
  const allMessages = useMemo(() => {
    const combined = [...messages, ...optimisticMessages];
    return combined.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, optimisticMessages]);

  // Format typing users
  const typingUsersList = useMemo(
    () => Array.from(typingUsers.entries()).map(([userId, v]) => ({ userId, userName: v.userName })),
    [typingUsers]
  );
  const formattedTypingUsers = useMemo(() => {
    const users = Array.from(typingUsers.values()).map((u) => u.userName);
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0]} está escribiendo...`;
    if (users.length === 2)
      return `${users[0]} y ${users[1]} están escribiendo...`;
    return `${users[0]} y ${users.length - 1} más están escribiendo...`;
  }, [typingUsers]);

  // Unread count for current user (exclude own messages)
  const unreadCount = useMemo(() => {
    if (!user?.id) return 0;
    return allMessages.filter(
      (m) => m.authorId !== user.id && !m.readBy.some((r) => r.userId === user.id)
    ).length;
  }, [allMessages, user?.id]);

  return {
    messages: allMessages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    typingUsers: formattedTypingUsers,
    typingUsersList,
    unreadCount,
    sendMessage: sendMessageOptimistic,
    editMessage: editMessageOptimistic,
    deleteMessage: deleteMessageOptimistic,
    toggleReaction: toggleReactionOptimistic,
    sendTypingIndicator,
    trackMessageVisibility,
    loadMoreRef,
    refresh: loadMessages,
  };
}
