import { NextResponse } from "next/server";
import { buildSitemapIndexXml } from "@/lib/seo/sitemap-xml";
import { getMainSiteBaseUrl } from "@/lib/seo/sitemap-config";

export const revalidate = 1800;

export async function GET() {
  const now = new Date();
  const base = getMainSiteBaseUrl();

  const xml = buildSitemapIndexXml([
    { loc: `${base}/sitemap-main.xml`, lastmod: now },
    { loc: `${base}/sitemap-blog.xml`, lastmod: now },
  ]);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
