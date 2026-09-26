import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import React from "react";

const TrackLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // Seguimiento anónimo del caso — mismo criterio que submit/layout.tsx.
    <MarketingPageShell showStickyCta={false} showFooter={false} showWhatsApp={false} hideUtility>
      {children}
    </MarketingPageShell>
  );
};

export default TrackLayout;
