"use client";

import type { ReactNode } from "react";
import { SiteShell } from "@/modules/brand/components/SiteShell";

type MarketingPageShellProps = {
  children: ReactNode;
  /** Bloque lima "Siguiente paso" antes del footer. */
  showFooter?: boolean;
  showWhatsApp?: boolean;
  /** Barra flotante "Agendar demo". */
  showStickyCta?: boolean;
  /** Oculta la franja "¿Vienes a reportar?" (flujos del denunciante). */
  hideUtility?: boolean;
  mainClassName?: string;
};

/**
 * Compatibilidad: las páginas públicas siguen importando este shell, que ahora
 * delega en el cromo único de marca ({@link SiteShell}).
 */
export function MarketingPageShell({
  children,
  showFooter = true,
  showWhatsApp = true,
  showStickyCta = true,
  hideUtility = false,
  mainClassName,
}: MarketingPageShellProps) {
  return (
    <SiteShell
      closingCta={showFooter}
      whatsApp={showWhatsApp}
      stickyCta={showStickyCta}
      hideUtility={hideUtility}
      mainClassName={mainClassName}
    >
      {children}
    </SiteShell>
  );
}
