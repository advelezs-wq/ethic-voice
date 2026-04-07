"use client";

import type { ReactNode } from "react";
import * as Frigade from "@frigade/react";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";

type Props = {
  children: ReactNode;
  userId?: string | null;
  apiKey: string;
  flowId: string;
};

/**
 * Frigade es analítica/producto de terceros: solo con cookies analíticas aceptadas.
 */
export function FrigadeConsentClient({
  children,
  userId,
  apiKey,
  flowId,
}: Props) {
  const cookie = useCookieConsentOptional();
  if (!cookie?.consent?.analytics) {
    return <>{children}</>;
  }

  return (
    <Frigade.Provider apiKey={apiKey} userId={userId ?? undefined}>
      <Frigade.Tour flowId={flowId} />
      {children}
    </Frigade.Provider>
  );
}
