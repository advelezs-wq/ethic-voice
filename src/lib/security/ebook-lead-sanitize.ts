/**
 * Validación y saneo de entradas para /api/public/ebook-lead (campos de texto plano en BD).
 */

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const PHONE_RE = /^\+?[0-9][0-9\s().-]{5,38}$/;

const INJECTION_MARKERS = [
  "<script",
  "javascript:",
  "onerror=",
  "onclick=",
  "onload=",
  "<iframe",
  "data:text/html",
  "vbscript:",
  "expression(",
  "\\x3c",
  "&#60;",
  "&#x3c;",
  "eval(",
  "fromcharcode",
  "document.cookie",
  "document.write",
];

function hasSuspiciousPatterns(value: string): boolean {
  const lower = value.toLowerCase();
  return INJECTION_MARKERS.some((m) => lower.includes(m));
}

/** Recorta, quita NUL, normaliza espacios y rechaza patrones típicos de inyección / HTML. */
export function sanitizePlainLeadField(raw: string, maxLen: number, minLen = 2): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.replace(/\0/g, "").trim();
  s = s.replace(/\s+/g, " ");
  if (s.length < minLen || s.length > maxLen) return null;
  if (hasSuspiciousPatterns(s)) return null;
  if (/[<>]/.test(s)) return null;
  return s;
}

export function sanitizePhone(raw: string): string | null {
  const s = sanitizePlainLeadField(raw, 40, 7);
  if (!s) return null;
  if (!PHONE_RE.test(s)) return null;
  return s;
}

export function sanitizeEmail(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase().replace(/\0/g, "").slice(0, 320);
  if (!e || e.length < 5 || e.length > 320) return null;
  if (hasSuspiciousPatterns(e)) return null;
  if (!EMAIL_RE.test(e)) return null;
  return e;
}

export function parseOptionalUtm(raw: unknown, max: number): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().replace(/\0/g, "").slice(0, max);
  if (!s) return undefined;
  if (hasSuspiciousPatterns(s) || /[<>]/.test(s)) return undefined;
  return s;
}

/** Slug de campaña: solo letras, números, guiones y guión bajo. */
export function sanitizeCampaignSlug(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim().replace(/\0/g, "").slice(0, 80) : "";
  if (s && /^[\w-]{1,80}$/.test(s)) return s;
  return "guia_canal_denuncias";
}

/** Ruta interna reportada por el cliente (pathname). */
export function sanitizeSourcePath(raw: unknown): string | undefined {
  const s = parseOptionalUtm(raw, 500);
  if (!s || !s.startsWith("/")) return undefined;
  if (s.includes("..")) return undefined;
  if (!/^\/[\w\-./?&=%+#:]*$/.test(s)) return undefined;
  return s;
}

export function parseHcaptchaToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t || t.length > 4096) return null;
  return t;
}
