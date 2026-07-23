import { NextResponse } from "next/server";
import { getSitemap, SemseiApiError } from "@semsei/next-blog/client";
import { headers } from "next/headers";
import { buildSitemapUrlSetXml } from "@/lib/seo/sitemap-xml";
import { getMainSiteBaseUrl } from "@/lib/seo/sitemap-config";

export const revalidate = 1800;

export async function GET() {
  try {
    const host = (await headers()).get("host") || "ethicvoice.co";
    const data = await getSitemap(host.split(":")[0]);

    const mainBase = getMainSiteBaseUrl();

    const xml = buildSitemapUrlSetXml(
      data.entries.map((entry) => ({
        loc: `${mainBase}/blogs/${entry.slug}`,
        lastmod: entry.lastModified,
        changefreq: "weekly" as const,
        priority: 0.75,
      })),
    );

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    if (err instanceof SemseiApiError && err.status === 401) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    throw err;
  }
}
