import { NextResponse } from "next/server";
import {
  buildSitemapUrlSetXml,
  getPublishedBlogPostsForSitemap,
} from "@/lib/seo/sitemap-xml";
import { getMainSiteBaseUrl } from "@/lib/seo/sitemap-config";

export const revalidate = 1800;

export async function GET() {
  const now = new Date();
  const mainBase = getMainSiteBaseUrl();
  const posts = await getPublishedBlogPostsForSitemap(now);

  // Los posts propios de EthicVoice viven en /blog/[slug] del dominio principal.
  // (blog.ethicvoice.co es una herramienta externa no relacionada con este repo.)
  const xml = buildSitemapUrlSetXml(
    posts.map((post) => ({
      loc: `${mainBase}/blog/${post.slug}`,
      lastmod: post.updatedAt ?? post.publishedAt ?? now,
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
}
