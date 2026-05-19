import prisma from "@/modules/prisma/lib/prisma";
import { BlogPostStatus } from "@prisma/client";

export type SitemapUrlEntry = {
  loc: string;
  lastmod?: Date | string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value?: Date | string): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function buildSitemapUrlSetXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = toIsoDate(entry.lastmod);
      const changefreq = entry.changefreq
        ? `<changefreq>${entry.changefreq}</changefreq>`
        : "";
      const priority =
        typeof entry.priority === "number"
          ? `<priority>${entry.priority.toFixed(1)}</priority>`
          : "";

      return `<url><loc>${escapeXml(entry.loc)}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
      }${changefreq}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildSitemapIndexXml(
  sitemaps: Array<{ loc: string; lastmod?: Date | string }>,
): string {
  const body = sitemaps
    .map((entry) => {
      const lastmod = toIsoDate(entry.lastmod);
      return `<sitemap><loc>${escapeXml(entry.loc)}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
      }</sitemap>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export async function getPublishedBlogPostsForSitemap(now = new Date()) {
  return prisma.blogPost.findMany({
    where: {
      status: BlogPostStatus.PUBLISHED,
      publishedAt: { not: null, lte: now },
      noIndex: false,
    },
    select: {
      slug: true,
      updatedAt: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });
}
