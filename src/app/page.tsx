import { Landing } from "@/modules/landig-page/components";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EthicVoice | Canal de denuncias y cumplimiento",
  description:
    "Implementa un canal de denuncias seguro y trazable. EthicVoice ayuda a tu organización a gestionar casos con enfoque de cumplimiento, confidencialidad y cultura ética.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "EthicVoice | Canal de denuncias y cumplimiento",
    description:
      "Canal de denuncias para organizaciones que buscan trazabilidad, seguridad y mejores decisiones éticas.",
    url: "/",
    siteName: "EthicVoice",
    type: "website",
    // Next.js's per-route metadata replaces the parent layout's `openGraph`
    // object wholesale rather than merging it field-by-field — omitting
    // `images` here meant the homepage shipped with NO og:image tag at all.
    // Link-preview crawlers (WhatsApp, etc.) then fell back to grabbing an
    // image from the page content itself, landing on a client logo from
    // the landing page's "trusted by" section instead of the real brand
    // image — cropped down to a small thumbnail, it looked like an
    // unrelated company's logo.
    images: [
      {
        // Relative — resolved against the root layout's metadataBase.
        url: "/brand/ethicvoice.jpeg",
        width: 1200,
        height: 630,
        alt: "EthicVoice | Plataforma de Línea Ética",
      },
    ],
  },
};

export default function LandingPage() {
  return <Landing />;
}
