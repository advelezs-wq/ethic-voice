import type { Metadata } from "next";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { ServicesPage } from "@/modules/landig-page/components/services/ServicesPage";

export const metadata: Metadata = {
  title: "Servicios | EthicVoice",
  description:
    "Portafolio de servicios EthicVoice: gestión tercerizada de canales de denuncia, investigaciones internas, auditoría forense, comités de ética, formación y más.",
  alternates: { canonical: "/services" },
};

export default function Page() {
  return (
    <MarketingPageShell>
      <ServicesPage />
    </MarketingPageShell>
  );
}
