import type { Metadata } from "next";
import { AboutPage } from "@/modules/landig-page/components/about/AboutPage";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

export const metadata: Metadata = {
  title: "Nosotros | EthicVoice",
  description:
    "Tecnología y consultoría para la integridad organizacional en Colombia y Latinoamérica. EthicVoice es operada por Valor Estratégico Consultores.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <MarketingPageShell>
      <AboutPage />
    </MarketingPageShell>
  );
}
