import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import React from "react";

const SubmitLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // This is the anonymous whistleblower report form, not a marketing
    // page — a sales CTA ("Agendar prueba gratis") sticky-pinned over the
    // form fields, or a "book a demo" footer band, has no place here and
    // actively obstructs the form on mobile.
    <MarketingPageShell
      mainClassName="!pt-16 pb-10"
      showStickyCta={false}
      showFooter={false}
    >
      {children}
    </MarketingPageShell>
  );
};

export default SubmitLayout;
