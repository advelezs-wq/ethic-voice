import React from "react";

// El cromo del canal (marca EthicVoice o la de la organización) lo pone cada
// página con <ChannelShell>, porque depende de la organización del enlace.
export default function ChannelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
