import { getMainSiteBaseUrl } from "@/lib/seo/sitemap-config";

const DEFAULT_TIMEOUT_MS = 4000;

function isPingEnabled() {
  return process.env.SITEMAP_PING_ENABLED === "true";
}

function getTimeoutMs() {
  const raw = process.env.SITEMAP_PING_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(parsed, 15000);
}

function getSitemapIndexUrl() {
  const base = getMainSiteBaseUrl();
  return `${base}/sitemap.xml`;
}

function assertSafeSitemapUrl(url: string) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Protocolo de sitemap no permitido");
  }
}

async function pingEngine(
  name: "google" | "bing",
  endpoint: string,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[sitemap-ping] ${name} respondió ${res.status}`);
      return;
    }
    console.info(`[sitemap-ping] ${name} notificado`);
  } catch (error) {
    console.warn(`[sitemap-ping] ${name} no disponible`, error);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Notifica buscadores de que el sitemap cambió.
 * No lanza excepciones para no romper el flujo principal.
 */
export async function notifySitemapUpdated() {
  if (!isPingEnabled()) return;

  try {
    const sitemapUrl = getSitemapIndexUrl();
    assertSafeSitemapUrl(sitemapUrl);
    const timeoutMs = getTimeoutMs();
    const encoded = encodeURIComponent(sitemapUrl);

    await Promise.allSettled([
      pingEngine(
        "google",
        `https://www.google.com/ping?sitemap=${encoded}`,
        timeoutMs,
      ),
      pingEngine(
        "bing",
        `https://www.bing.com/ping?sitemap=${encoded}`,
        timeoutMs,
      ),
    ]);
  } catch (error) {
    console.warn("[sitemap-ping] se omitió la notificación", error);
  }
}
