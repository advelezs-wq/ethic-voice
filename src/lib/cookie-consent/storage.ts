import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  type ConsentRecord,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function parseStoredConsent(raw: string | null): ConsentRecord | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!isRecord(data)) return null;
    if (data.policyVersion !== CONSENT_POLICY_VERSION) return null;
    if (data.necessary !== true) return null;
    if (typeof data.updatedAt !== "string") return null;
    if (!["all", "essential", "custom"].includes(String(data.source)))
      return null;

    return {
      necessary: true,
      functional: Boolean(data.functional),
      analytics: Boolean(data.analytics),
      marketing: Boolean(data.marketing),
      saleOptOut: Boolean(data.saleOptOut),
      policyVersion: CONSENT_POLICY_VERSION,
      updatedAt: data.updatedAt,
      source: data.source as ConsentRecord["source"],
    };
  } catch {
    return null;
  }
}

export function readConsentFromStorage(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  return parseStoredConsent(localStorage.getItem(CONSENT_STORAGE_KEY));
}

export function writeConsentToStorage(record: ConsentRecord): void {
  if (typeof window === "undefined") return;
  const payload: ConsentRecord = {
    ...record,
    policyVersion: CONSENT_POLICY_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
}

export function clearConsentStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_STORAGE_KEY);
}

/** Consentimiento caducado por nueva versión de política */
export function needsRenewal(stored: ConsentRecord | null): boolean {
  if (!stored) return true;
  return stored.policyVersion !== CONSENT_POLICY_VERSION;
}
