import type { Metadata } from "next";
import { EbookCanalLandingPage } from "@/modules/landig-page/components/ebook/EbookCanalLandingPage";

export const metadata: Metadata = {
  title: "Guía gratuita: canal de denuncias efectivo | EthicVoice × Valor Estratégico",
  description:
    "Descarga la guía práctica para implementar un canal de denuncias efectivo. Compliance, SARLAFT, SAGRILAFT, Ley 2195 y marco en Latinoamérica. EthicVoice y Valor Estratégico.",
  openGraph: {
    title: "Guía gratuita: canal de denuncias efectivo | EthicVoice",
    description:
      "Detecta fraude y conductas indebidas antes de que se conviertan en crisis. Recurso gratuito con EthicVoice y Valor Estratégico.",
  },
};

function pick(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export default async function GuiaCanalDenunciasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const utm = {
    utmSource: pick(sp.utm_source),
    utmMedium: pick(sp.utm_medium),
    utmCampaign: pick(sp.utm_campaign),
    utmContent: pick(sp.utm_content),
    utmTerm: pick(sp.utm_term),
  };
  return <EbookCanalLandingPage utm={utm} />;
}
