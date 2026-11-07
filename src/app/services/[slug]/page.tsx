import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { ServiceDetail } from "@/modules/landig-page/components/services/ServiceDetail";
import { SERVICES, getService } from "@/modules/landig-page/services/services.data";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: `${service.title} | Servicios EthicVoice`,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const service = getService(slug);
  if (!service) notFound();
  return (
    <MarketingPageShell>
      <ServiceDetail slug={service.slug} />
    </MarketingPageShell>
  );
}
