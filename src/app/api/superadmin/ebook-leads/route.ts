import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

function parseCampaignFilter(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim().slice(0, 80);
  if (!t || !/^[\w-]+$/.test(t)) return undefined;
  return t;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await currentUser();
  const email = me?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10) || 25));
  const campaign = parseCampaignFilter(searchParams.get("campaign"));

  const where = campaign ? { campaign } : {};

  const [total, leads] = await Promise.all([
    prisma.ebookLead.count({ where }),
    prisma.ebookLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    leads: leads.map((l) => ({
      id: l.id,
      fullName: l.fullName,
      phone: l.phone,
      email: l.email,
      company: l.company,
      role: l.role,
      campaign: l.campaign,
      sourcePath: l.sourcePath,
      utmSource: l.utmSource,
      utmMedium: l.utmMedium,
      utmCampaign: l.utmCampaign,
      utmContent: l.utmContent,
      utmTerm: l.utmTerm,
      userAgent: l.userAgent,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages,
  });
}
