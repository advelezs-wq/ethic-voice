export {};

const host = process.env.PUBLIC_BLOG_LIVE_HOST || "ethicvoice.co";
const locale = process.env.PUBLIC_BLOG_LIVE_LOCALE || "es";
const slug =
  process.env.PUBLIC_BLOG_LIVE_SLUG ||
  "mundial-2026-tu-guia-de-compliance";
const apiUrl = (process.env.SEMSEI_API_URL || "https://app.semsei.io").replace(
  /\/+$/,
  "",
);
const apiKey = process.env.SEMSEI_API_KEY;

if (!apiKey) {
  console.error("LIVE_CODE_PREFLIGHT", {
    status: "blocked",
    reason: "SEMSEI_API_KEY is not configured",
  });
  process.exit(2);
}

const url = new URL(`${apiUrl}/api/public/code/page`);
url.search = new URLSearchParams({ host, locale, slug }).toString();
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${apiKey}` },
});
const data = await response.json() as Record<string, unknown>;
const hreflang = data.hreflang;
const legacyCanonical =
  hreflang && !Array.isArray(hreflang) && typeof hreflang === "object"
    ? (hreflang as Record<string, unknown>)[locale]
    : undefined;
const actualCanonical =
  typeof data.canonicalUrl === "string"
    ? data.canonicalUrl
    : typeof legacyCanonical === "string"
      ? legacyCanonical
      : null;
const expectedCanonical = `https://ethicvoice.co/${locale}/blogs/${slug}`;
const validConfiguration =
  response.ok &&
  data.siteOrigin === "https://ethicvoice.co" &&
  data.pathPrefix === "/blogs" &&
  actualCanonical === expectedCanonical;

console.log("LIVE_CODE_PREFLIGHT", {
  status: validConfiguration ? "ready" : "deployment_blocker",
  httpStatus: response.status,
  expectedSiteOrigin: "https://ethicvoice.co",
  actualSiteOrigin: data.siteOrigin ?? null,
  expectedPathPrefix: "/blogs",
  actualPathPrefix: data.pathPrefix ?? null,
  expectedCanonical,
  actualCanonical,
});

if (!validConfiguration) process.exitCode = 1;
