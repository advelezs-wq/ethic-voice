import { NextResponse } from "next/server";
import { buildSitemapUrlSetXml } from "@/lib/seo/sitemap-xml";
import {
  getMainSiteBaseUrl,
  PUBLIC_STATIC_ROUTES,
} from "@/lib/seo/sitemap-config";

export const revalidate = 3600;

export async function GET() {
  const now = new Date();
  const base = getMainSiteBaseUrl();

  const xml = buildSitemapUrlSetXml(
    PUBLIC_STATIC_ROUTES.map((route) => ({
      loc: `${base}${route.path}`,
      lastmod: now,
      changefreq: route.changeFrequency,
      priority: route.priority,
    })),
  );

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
