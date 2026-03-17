import { addToast as originalAddToast } from "@heroui/react";

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
  duration?: number;
}

interface ToastQueue {
  id: string;
  message: ToastMessage;
  timestamp: number;
}

// Global queue and state management
let toastQueue: ToastQueue[] = [];
let processingTimeout: NodeJS.Timeout | null = null;
let lastToastTime = 0;
const MIN_DELAY = 100; // Minimum delay between toasts
const PROCESS_DELAY = 150; // Delay for processing next in queue

function processToastQueue() {
  if (toastQueue.length === 0) {
    processingTimeout = null;
    return;
  }

  const now = Date.now();
  if (now - lastToastTime < MIN_DELAY) {
    processingTimeout = setTimeout(processToastQueue, MIN_DELAY);
    return;
  }

  const queueItem = toastQueue.shift()!;
  const { message } = queueItem;
  lastToastTime = now;

  try {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      try {
        originalAddToast(message);
      } catch (error) {
        console.error("Error displaying toast:", error);
        // Fallback to console if DOM fails
        console.log(
          `Toast: ${message.title}${message.description ? ` - ${message.description}` : ""}`
        );
      }
    });
  } catch (error) {
    console.error("Error in toast processing:", error);
  }

  // Schedule next toast if queue has more items
  if (toastQueue.length > 0) {
    processingTimeout = setTimeout(processToastQueue, PROCESS_DELAY);
  } else {
    processingTimeout = null;
  }
}

/**
 * Safe wrapper for addToast that prevents DOM manipulation errors
 * Implements queuing, debouncing, and error handling
 */
export function addToast(message: ToastMessage): void {
  try {
    // Generate unique ID for deduplication
    const id = `toast-${Date.now()}-${Math.random()}`;

    // Remove duplicate toasts with same title
    toastQueue = toastQueue.filter(
      (item) => item.message.title !== message.title
    );

    // Add to queue
    toastQueue.push({
      id,
      message,
      timestamp: Date.now(),
    });

    // Limit queue size to prevent memory issues
    if (toastQueue.length > 10) {
      toastQueue = toastQueue.slice(-10);
    }

    // Start processing if not already running
    if (!processingTimeout) {
      processingTimeout = setTimeout(processToastQueue, 10);
    }
  } catch (error) {
    console.error("Error queuing toast:", error);
    // Fallback to console log
    console.log(
      `Toast: ${message.title}${message.description ? ` - ${message.description}` : ""}`
    );
  }
}

// Convenience methods that match the useSafeToast pattern
export function showSuccess(title: string, description?: string): void {
  addToast({ title, description, color: "success" });
}

export function showError(title: string, description?: string): void {
  addToast({ title, description, color: "danger" });
}

export function showWarning(title: string, description?: string): void {
  addToast({ title, description, color: "warning" });
}

export function showInfo(title: string, description?: string): void {
  addToast({ title, description, color: "primary" });
}

// Default export for easy importing
export default addToast;
