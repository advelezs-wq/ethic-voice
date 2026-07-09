import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { sanitizeLeadMagnetSlug as sanitizeSlug } from "@/lib/lead-magnets";

async function assertSuperAdmin() {
  const { userId } = await auth();
  if (!userId)
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true as const, userId };
}

export async function GET() {
  const guard = await assertSuperAdmin();
  if (!guard.ok) return guard.response;

  const magnets = await prisma.leadMagnet.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Conteo de leads por campaña para mostrar rendimiento
  const campaigns = magnets.map((m) => m.campaign);
  const leadCounts = campaigns.length
    ? await prisma.ebookLead.groupBy({
        by: ["campaign"],
        where: { campaign: { in: campaigns } },
        _count: { _all: true },
      })
    : [];
  const countByCampaign = new Map(
    leadCounts.map((c) => [c.campaign, c._count._all])
  );

  return NextResponse.json({
    magnets: magnets.map((m) => ({
      ...m,
      leads: countByCampaign.get(m.campaign) ?? 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  const guard = await assertSuperAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
    const rawSlug =
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug
        : title;
    const slug = sanitizeSlug(rawSlug);
    const campaign = sanitizeSlug(
      typeof body.campaign === "string" && body.campaign.trim()
        ? body.campaign
        : slug
    ).replace(/-/g, "_");

    const missing: string[] = [];
    if (!title) missing.push("título");
    if (!fileUrl) missing.push("archivo descargable");
    if (!slug) missing.push("URL personalizada");
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await prisma.leadMagnet.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `La URL /recursos/${slug} ya está en uso.` },
        { status: 409 }
      );
    }

    const magnet = await prisma.leadMagnet.create({
      data: {
        slug,
        title,
        description:
          typeof body.description === "string" ? body.description.trim() : null,
        coverImageUrl:
          typeof body.coverImageUrl === "string" && body.coverImageUrl.trim()
            ? body.coverImageUrl.trim()
            : null,
        fileUrl,
        campaign,
        ctaLabel:
          typeof body.ctaLabel === "string" && body.ctaLabel.trim()
            ? body.ctaLabel.trim()
            : null,
        formFields: {
          phone: body.formFields?.phone !== false,
          company: body.formFields?.company !== false,
          role: body.formFields?.role !== false,
        },
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ magnet });
  } catch (e) {
    console.error("[lead-magnets] create failed:", e);
    return NextResponse.json(
      { error: "No se pudo crear el recurso" },
      { status: 500 }
    );
  }
}
