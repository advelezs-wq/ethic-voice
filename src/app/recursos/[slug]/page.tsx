import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/modules/prisma/lib/prisma";
import {
  ResourceLandingClient,
  type ResourceLandingData,
} from "@/modules/landig-page/components/resources/ResourceLandingClient";
import { parseLeadMagnetFormFields } from "@/lib/lead-magnets";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const magnet = await prisma.leadMagnet.findUnique({ where: { slug } });
  if (!magnet || !magnet.isActive) return { title: "Recurso | EthicVoice" };
  return {
    title: `${magnet.title} | Recurso gratuito | EthicVoice`,
    description:
      magnet.description?.slice(0, 160) ||
      `Descarga gratis: ${magnet.title}. Recurso de EthicVoice.`,
    alternates: { canonical: `/recursos/${magnet.slug}` },
    openGraph: {
      title: magnet.title,
      description: magnet.description?.slice(0, 160) || magnet.title,
      ...(magnet.coverImageUrl
        ? { images: [{ url: magnet.coverImageUrl }] }
        : {}),
    },
  };
}

export default async function ResourceLandingPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const magnet = await prisma.leadMagnet.findUnique({ where: { slug } });
  if (!magnet || !magnet.isActive) notFound();

  // Métrica de visitas de la landing (no bloquea el render si falla)
  prisma.leadMagnet
    .update({ where: { id: magnet.id }, data: { visits: { increment: 1 } } })
    .catch(() => {});

  const resource: ResourceLandingData = {
    slug: magnet.slug,
    title: magnet.title,
    description: magnet.description,
    coverImageUrl: magnet.coverImageUrl,
    ctaLabel: magnet.ctaLabel,
    formFields: parseLeadMagnetFormFields(magnet.formFields),
  };

  const utm = {
    utmSource: pick(sp.utm_source),
    utmMedium: pick(sp.utm_medium),
    utmCampaign: pick(sp.utm_campaign),
    utmContent: pick(sp.utm_content),
    utmTerm: pick(sp.utm_term),
  };

  return <ResourceLandingClient resource={resource} utm={utm} />;
}
