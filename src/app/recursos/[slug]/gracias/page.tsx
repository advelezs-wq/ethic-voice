import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/modules/prisma/lib/prisma";
import { ResourceThankYouClient } from "@/modules/landig-page/components/resources/ResourceThankYouClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "¡Gracias por tu descarga! | EthicVoice",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function ResourceThankYouPage({ params }: Props) {
  const { slug } = await params;
  const magnet = await prisma.leadMagnet.findUnique({ where: { slug } });
  if (!magnet || !magnet.isActive) notFound();

  return (
    <ResourceThankYouClient
      slug={magnet.slug}
      title={magnet.title}
      campaign={magnet.campaign}
      fileUrl={magnet.fileUrl}
    />
  );
}
