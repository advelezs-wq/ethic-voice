import { NextRequest, NextResponse } from "next/server";
import { findOrgByCustomDomain } from "@/modules/core/utils/org-branding.server";

/** Usado por el middleware: ¿a qué organización (Premium) pertenece este dominio? */
export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get("host") || "";
  const org = host ? await findOrgByCustomDomain(host) : null;
  return NextResponse.json({ slug: org?.slug ?? null }, { headers: { "Cache-Control": "public, max-age=300" } });
}
