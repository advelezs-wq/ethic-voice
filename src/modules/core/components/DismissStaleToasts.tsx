"use client";

import { useEffect } from "react";
import { closeAll } from "@heroui/react";

/**
 * Clears toasts left over from the dashboard. Requests that fail while the
 * session is being closed (e.g. "No se pudo cargar la analítica") would
 * otherwise follow the user onto the sign-in screen.
 */
export function DismissStaleToasts() {
  useEffect(() => {
    try {
      closeAll();
    } catch {
      // No toast region mounted — nothing to clear.
    }
  }, []);
  return null;
}
