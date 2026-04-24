"use client";

import type { ReactNode } from "react";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

/** Mismo cromo que `/platform`, `/services`, etc.: Header marketing + FooterCTA. */
export function PublicBlogLayout({ children }: { children: ReactNode }) {
  return <MarketingPageShell>{children}</MarketingPageShell>;
}
