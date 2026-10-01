"use client";

import type { ReactNode } from "react";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { brandingStyle, type ChannelBranding } from "@/modules/core/utils/org-branding";

/**
 * Envoltorio del canal de denuncias (formulario y seguimiento). Aplica la marca
 * de la organización según su plan: color de marca en botones y acentos y, con
 * marca blanca, un encabezado y pie propios sin la marca EthicVoice.
 */
export function ChannelShell({ branding, children }: { branding: ChannelBranding | null; children: ReactNode }) {
  const style = brandingStyle(branding);

  if (branding?.whiteLabel) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-ev-paper" style={style}>
        <header className="border-b border-ev-line bg-white">
          <div className="mx-auto flex h-16 w-full max-w-[var(--ev-max)] items-center gap-3 px-[var(--ev-gutter)]">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.orgName} className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--org-accent)] font-semibold text-[var(--org-accent-fg)]">
                {branding.orgName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="font-medium text-ev-night">{branding.orgName}</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ev-line py-6 text-center text-xs text-ev-mute">
          Canal de denuncias confidencial de {branding.orgName}
        </footer>
      </div>
    );
  }

  return (
    <MarketingPageShell showStickyCta={false} showFooter={false} showWhatsApp={false} hideUtility>
      <div style={style}>{children}</div>
    </MarketingPageShell>
  );
}
