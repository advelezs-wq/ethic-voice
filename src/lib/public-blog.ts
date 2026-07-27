export const PUBLIC_BLOG_REQUEST_HEADER = "x-ethicvoice-public-blog";
export const PUBLIC_BLOG_PATH_HEADER = "x-ethicvoice-public-blog-path";

export type PublicBlogContext = {
  host: string;
  locale: "en" | "es";
  pathname: string;
};

const encoder = new TextEncoder();

function normalizeHost(rawHost: string | null): string | null {
  const host = rawHost?.split(",", 1)[0]?.trim();
  if (
    !host ||
    host.endsWith(":") ||
    /[\\/%?#@\s\u0000-\u001f\u007f]/.test(host)
  ) {
    return null;
  }

  try {
    const parsed = new URL(`http://${host}`);
    if (
      !parsed.host ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }

    return parsed.host;
  } catch {
    return null;
  }
}

export function getRequestHost(headers: Headers): string | null {
  return normalizeHost(
    headers.get("x-forwarded-host") || headers.get("host"),
  );
}

export function createPublicBlogContext(
  pathname: string,
  host: string | null,
): PublicBlogContext | null {
  const match = pathname.match(/^\/(en|es)\/blogs\/(.+)$/);
  const normalizedHost = normalizeHost(host);
  const parts = match?.[2]?.split("/") ?? [];

  if (
    !match ||
    !normalizedHost ||
    parts.some((part) => !part || part === "." || part === "..")
  ) {
    return null;
  }

  return {
    host: normalizedHost,
    locale: match[1] as "en" | "es",
    pathname,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function getSigningKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signPublicBlogMarker(
  context: PublicBlogContext,
  secret: string | undefined,
): Promise<string | null> {
  if (!secret) return null;

  const payload = toBase64Url(encoder.encode(JSON.stringify(context)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(secret),
    encoder.encode(payload),
  );

  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyPublicBlogMarker(
  marker: string | null,
  requestPathname: string | null,
  requestHost: string | null,
  secret: string | undefined,
): Promise<PublicBlogContext | null> {
  if (!marker || !secret) return null;

  const parts = marker.split(".");
  if (parts.length !== 2) return null;

  const payloadBytes = fromBase64Url(parts[0]);
  const signature = fromBase64Url(parts[1]);
  if (!payloadBytes || !signature) return null;

  const validSignature = await crypto.subtle.verify(
    "HMAC",
    await getSigningKey(secret),
    signature,
    encoder.encode(parts[0]),
  );
  if (!validSignature) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as {
      host?: unknown;
      locale?: unknown;
      pathname?: unknown;
    };
    if (
      typeof parsed.host !== "string" ||
      typeof parsed.locale !== "string" ||
      typeof parsed.pathname !== "string"
    ) {
      return null;
    }

    const context = createPublicBlogContext(parsed.pathname, parsed.host);
    const normalizedRequestHost = normalizeHost(requestHost);
    if (
      !context ||
      context.locale !== parsed.locale ||
      context.pathname !== requestPathname ||
      context.host !== normalizedRequestHost
    ) {
      return null;
    }

    return context;
  } catch {
    return null;
  }
}
