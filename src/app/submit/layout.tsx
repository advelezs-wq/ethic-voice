import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import React from "react";

const SubmitLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <MarketingPageShell mainClassName="!pt-16 pb-10">
      {children}
    </MarketingPageShell>
  );
};

export default SubmitLayout;
