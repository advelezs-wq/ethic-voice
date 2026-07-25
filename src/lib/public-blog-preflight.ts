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
  if (
    !context ||
    !apiKey ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
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
      return { status: "bad-gateway" };
    }

    endpoint = new URL(CODE_PAGE_PATH, base.origin);
    const slug = pathname.slice(`/${context.locale}/blogs/`.length);
    endpoint.search = new URLSearchParams({
      host: context.host,
      slug,
      locale: context.locale,
    }).toString();
  } catch {
    return { status: "bad-gateway" };
  }

  try {
    const response = await fetcher(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) return { status: "bad-gateway" };
    return { status: "ok", context };
  } catch {
    return { status: "bad-gateway" };
  }
}
