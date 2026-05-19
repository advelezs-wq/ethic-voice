export type StaticSitemapRoute = {
  path: string;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
};

export const PUBLIC_STATIC_ROUTES: StaticSitemapRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/platform", changeFrequency: "weekly", priority: 0.9 },
  { path: "/services", changeFrequency: "weekly", priority: 0.85 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/careers", changeFrequency: "weekly", priority: 0.6 },
  { path: "/partners", changeFrequency: "weekly", priority: 0.6 },
  { path: "/guia-canal-denuncias", changeFrequency: "monthly", priority: 0.75 },
  { path: "/submit", changeFrequency: "weekly", priority: 0.8 },
  { path: "/track", changeFrequency: "weekly", priority: 0.75 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/privacidad", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/sitemap", changeFrequency: "weekly", priority: 0.2 },
];

export function getMainSiteBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://ethicvoice.co").replace(
    /\/$/,
    "",
  );
}

export function getBlogSiteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BLOG_BASE_URL || "https://blog.ethicvoice.co"
  ).replace(/\/$/, "");
}
