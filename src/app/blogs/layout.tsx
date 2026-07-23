import type { ReactNode } from "react";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

export default function BlogsLayout({ children }: { children: ReactNode }) {
  return <MarketingPageShell>{children}</MarketingPageShell>;
}
