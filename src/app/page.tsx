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
  },
};

export default function LandingPage() {
  return <Landing />;
}
