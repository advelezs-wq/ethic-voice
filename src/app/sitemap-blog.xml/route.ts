import { NextResponse } from "next/server";
import {
  buildSitemapUrlSetXml,
  getPublishedBlogPostsForSitemap,
} from "@/lib/seo/sitemap-xml";
import { getBlogSiteBaseUrl } from "@/lib/seo/sitemap-config";

export const revalidate = 1800;

export async function GET() {
  const now = new Date();
  const blogBase = getBlogSiteBaseUrl();
  const posts = await getPublishedBlogPostsForSitemap(now);

  const xml = buildSitemapUrlSetXml([
    {
      loc: `${blogBase}/`,
      lastmod: now,
      changefreq: "daily",
      priority: 0.9,
    },
    ...posts.map((post) => ({
      loc: `${blogBase}/${post.slug}`,
      lastmod: post.updatedAt ?? post.publishedAt ?? now,
      changefreq: "weekly" as const,
      priority: 0.75,
    })),
  ]);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
