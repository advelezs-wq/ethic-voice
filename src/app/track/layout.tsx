import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import React from "react";

const TrackLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // Anonymous report-tracking flow — same reasoning as submit/layout.tsx:
    // no sales CTA or "book a demo" footer belongs on this page, and the
    // sticky CTA bar overlaps the reference-code input on mobile.
    <MarketingPageShell
      mainClassName="!pt-16 pb-10"
      showStickyCta={false}
      showFooter={false}
    >
      {children}
    </MarketingPageShell>
  );
};

export default TrackLayout;
