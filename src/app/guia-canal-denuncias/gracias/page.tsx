import type { Metadata } from "next";
import { ResourceThankYouClient } from "@/modules/landig-page/components/resources/ResourceThankYouClient";
import { resolvePublicEbookPdfUrl } from "@/lib/ebook-public-pdf";

export const metadata: Metadata = {
  title: "¡Gracias por tu descarga! | EthicVoice",
  robots: { index: false, follow: false },
};

/** Thank-you page de la guía del canal de denuncias: permite medir la conversión. */
export default function GuiaCanalDenunciasGraciasPage() {
  return (
    <ResourceThankYouClient
      slug="guia-canal-denuncias"
      title="Guía Práctica para Implementar un Canal de Denuncias Efectivo"
      campaign="guia_canal_denuncias"
      fileUrl={resolvePublicEbookPdfUrl()}
    />
  );
}
