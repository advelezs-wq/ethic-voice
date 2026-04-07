"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type Value = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  close: () => void;
};

const MobileNavContext = createContext<Value | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(
    () => ({ isOpen, setIsOpen, close }),
    [isOpen, close]
  );
  return (
    <MobileNavContext.Provider value={value}>
      {children}
    </MobileNavContext.Provider>
  );
}

/**
 * En landing (con Provider) el estado es compartido (p. ej. ocultar WhatsApp).
 * En el resto de páginas solo existe estado local del menú.
 */
export function useMobileNavDrawer() {
  const ctx = useContext(MobileNavContext);
  const [localOpen, setLocalOpen] = useState(false);
  const closeLocal = useCallback(() => setLocalOpen(false), []);

  if (ctx) {
    return ctx;
  }

  return {
    isOpen: localOpen,
    setIsOpen: setLocalOpen,
    close: closeLocal,
  };
}
