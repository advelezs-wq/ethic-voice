import { useCallback, useRef } from "react";
import { addToast } from "@/modules/core/utils/safe-toast";

interface ToastMessage {
  title: string;
  description?: string;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
}

interface ToastQueue {
  id: string;
  message: ToastMessage;
  timestamp: number;
}

export function useSafeToast() {
  const queueRef = useRef<ToastQueue[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<number>(0);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) return;

    const now = Date.now();
    // Ensure at least 100ms between toasts to prevent DOM conflicts
    if (now - lastToastRef.current < 100) {
      timeoutRef.current = setTimeout(processQueue, 100);
      return;
    }

    const { message } = queueRef.current.shift()!;
    lastToastRef.current = now;

    try {
      addToast(message);
    } catch (error) {
      console.error("Error displaying toast:", error);
    }

    // Process next toast if any
    if (queueRef.current.length > 0) {
      timeoutRef.current = setTimeout(processQueue, 150);
    }
  }, []);

  const showToast = useCallback(
    (message: ToastMessage) => {
      const id = `toast-${Date.now()}-${Math.random()}`;

      // Remove duplicates based on title
      queueRef.current = queueRef.current.filter(
        (item) => item.message.title !== message.title
      );

      queueRef.current.push({
        id,
        message,
        timestamp: Date.now(),
      });

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Start processing
      timeoutRef.current = setTimeout(processQueue, 10);
    },
    [processQueue]
  );

  const showSuccess = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, color: "success" });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, color: "danger" });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, color: "warning" });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, color: "primary" });
    },
    [showToast]
  );

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
