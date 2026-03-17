import { useEffect, useState } from 'react';

/**
 * Hook to safely check if code is running on the client side
 * Helps prevent hydration mismatches by ensuring DOM manipulation
 * only happens after client-side hydration is complete
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook for safely accessing window object
 * Returns null during SSR/hydration, window object only on client
 */
export function useWindow() {
  const isClient = useIsClient();
  return isClient ? window : null;
} 