import "server-only";

import {
  createPublicBlogContext,
  type PublicBlogContext,
} from "@/lib/public-blog";

const CODE_PAGE_PATH = "/api/public/code/page";
const MAX_TIMEOUT_MS = 10_000;

export type PublicBlogPreflightResult =
  | { status: "ok"; context: PublicBlogContext }
  | { status: "not-found" }
  | { status: "bad-gateway" };

export type PublicBlogPreflightFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type PublicBlogPreflightDependencies = {
  apiKey: string | undefined;
  apiUrl: string;
  fetch: PublicBlogPreflightFetch;
  timeoutMs: number;
};

export async function preflightPublicBlog(
  pathname: string,
  host: string | null,
  dependencies: PublicBlogPreflightDependencies,
): Promise<PublicBlogPreflightResult> {
  const context = createPublicBlogContext(pathname, host);
  const { apiKey, apiUrl, fetch: fetcher, timeoutMs } = dependencies;
  if (!context) {
    console.error("[public-blog-preflight] bad-gateway: invalid pathname/host context", {
      pathname,
      host,
    });
    return { status: "bad-gateway" };
  }
  if (!apiKey) {
    console.error(
      "[public-blog-preflight] bad-gateway: SEMSEI_API_KEY is empty/undefined at runtime",
    );
    return { status: "bad-gateway" };
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_TIMEOUT_MS) {
    console.error("[public-blog-preflight] bad-gateway: invalid timeoutMs", { timeoutMs });
    return { status: "bad-gateway" };
  }

  let endpoint: URL;
  try {
    const base = new URL(apiUrl);
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !["", "/"].includes(base.pathname)
    ) {
      console.error(
        "[public-blog-preflight] bad-gateway: SEMSEI_API_URL failed shape validation",
        { apiUrl },
      );
      return { status: "bad-gateway" };
    }

    endpoint = new URL(CODE_PAGE_PATH, base.origin);
    const slug = pathname.slice(`/${context.locale}/blogs/`.length);
    endpoint.search = new URLSearchParams({
      host: context.host,
      slug,
      locale: context.locale,
    }).toString();
  } catch (err) {
    console.error("[public-blog-preflight] bad-gateway: failed to build CODE endpoint URL", {
      apiUrl,
      err,
    });
    return { status: "bad-gateway" };
  }

  try {
    const response = await fetcher(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) {
      console.error("[public-blog-preflight] bad-gateway: CODE API returned non-ok status", {
        status: response.status,
        endpoint: endpoint.toString(),
      });
      return { status: "bad-gateway" };
    }
    return { status: "ok", context };
  } catch (err) {
    console.error("[public-blog-preflight] bad-gateway: fetch to CODE API threw", {
      endpoint: endpoint.toString(),
      err,
    });
    return { status: "bad-gateway" };
  }
}
