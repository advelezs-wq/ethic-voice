import type { MetadataRoute } from "next";
import { getMainSiteBaseUrl } from "@/lib/seo/sitemap-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getMainSiteBaseUrl();

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
