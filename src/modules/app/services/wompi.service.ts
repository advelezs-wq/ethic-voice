/**
 * Cliente de la API de Wompi (Bancolombia). Solo servidor: usa la llave privada.
 *
 * Variables:
 *  - NEXT_PUBLIC_WOMPI_PUBLIC_KEY  pub_test_… / pub_prod_…  (también en el navegador,
 *                                  para tokenizar la tarjeta directo con Wompi)
 *  - WOMPI_PRIVATE_KEY             prv_test_… / prv_prod_…
 *  - WOMPI_INTEGRITY_SECRET        test_integrity_… / prod_integrity_…
 *  - WOMPI_EVENTS_SECRET           test_events_… / prod_events_…
 * El ambiente (sandbox o producción) se deduce del prefijo de las llaves.
 */
import { createHash, timingSafeEqual } from "crypto";

export type WompiTransactionStatus = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";

export type WompiTransaction = {
  id: string;
  status: WompiTransactionStatus;
  status_message?: string | null;
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_source_id?: number | null;
  customer_email?: string;
  payment_method?: { extra?: { brand?: string; last_four?: string } };
};

export class WompiError extends Error {
  constructor(
    message: string,
    public status = 502,
    public detail?: unknown,
  ) {
    super(message);
  }
}

function keys() {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "";
  const privateKey = process.env.WOMPI_PRIVATE_KEY || "";
  return {
    publicKey,
    privateKey,
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET || "",
    eventsSecret: process.env.WOMPI_EVENTS_SECRET || "",
    baseUrl: publicKey.startsWith("pub_prod_") ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1",
  };
}

export function isWompiConfigured() {
  const k = keys();
  return Boolean(k.publicKey && k.privateKey && k.integritySecret);
}

export function isWompiSandbox() {
  return !keys().publicKey.startsWith("pub_prod_");
}

async function call<T>(path: string, init: RequestInit & { auth?: "public" | "private" } = {}): Promise<T> {
  const k = keys();
  if (!isWompiConfigured()) throw new WompiError("Los pagos no están configurados. Escríbenos a soporte.", 503);
  const token = init.auth === "public" ? k.publicKey : k.privateKey;
  const res = await fetch(`${k.baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: { type?: string; reason?: string; messages?: unknown } };
  if (!res.ok) {
    const reason = json?.error?.reason || json?.error?.type || `HTTP ${res.status}`;
    throw new WompiError(`Wompi rechazó la solicitud: ${reason}`, res.status >= 500 ? 502 : 400, json?.error);
  }
  return json.data as T;
}

/** Tokens de aceptación que el cliente debe aceptar explícitamente (con sus enlaces). */
export async function getAcceptanceTokens() {
  const k = keys();
  type Info = {
    presigned_acceptance: { acceptance_token: string; permalink: string };
    presigned_personal_data_auth: { acceptance_token: string; permalink: string };
  };
  let info: Info;
  try {
    info = await call<Info>("/merchants/info", { auth: "public", headers: { "x-merchant-public-key": k.publicKey } });
  } catch {
    // Endpoint anterior (Wompi lo retira el 31-oct-2026).
    info = await call<Info>(`/merchants/${k.publicKey}`, { auth: "public" });
  }
  return {
    acceptanceToken: info.presigned_acceptance.acceptance_token,
    acceptancePermalink: info.presigned_acceptance.permalink,
    personalAuthToken: info.presigned_personal_data_auth.acceptance_token,
    personalAuthPermalink: info.presigned_personal_data_auth.permalink,
  };
}

export async function createPaymentSource(input: {
  cardToken: string;
  customerEmail: string;
  acceptanceToken: string;
  personalAuthToken: string;
}) {
  const data = await call<{ id: number; status: string; public_data?: { type?: string } }>("/payment_sources", {
    method: "POST",
    body: JSON.stringify({
      type: "CARD",
      token: input.cardToken,
      customer_email: input.customerEmail,
      acceptance_token: input.acceptanceToken,
      accept_personal_auth: input.personalAuthToken,
    }),
  });
  if (data.status !== "AVAILABLE") throw new WompiError("Wompi no aceptó la tarjeta. Prueba con otra.", 400);
  return { id: String(data.id) };
}

export function integritySignature(reference: string, amountInCents: number, currency = "COP") {
  return createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${keys().integritySecret}`)
    .digest("hex");
}

export async function chargePaymentSource(input: {
  paymentSourceId: string;
  amountCop: number;
  customerEmail: string;
  reference: string;
  /**
   * Credential On File (solo Visa/Mastercard procesadas por RBM; si no aplica,
   * Wompi cobra igual sin COF). true = cobros periódicos por el mismo valor;
   * false = tarjeta guardada, montos variables sin periodicidad.
   */
  recurrent: boolean;
}) {
  const amountInCents = Math.round(input.amountCop * 100);
  return call<WompiTransaction>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      amount_in_cents: amountInCents,
      currency: "COP",
      customer_email: input.customerEmail,
      reference: input.reference,
      signature: integritySignature(input.reference, amountInCents),
      payment_source_id: Number(input.paymentSourceId),
      payment_method: { installments: 1 },
      recurrent: input.recurrent,
    }),
  });
}

export async function getTransaction(id: string) {
  return call<WompiTransaction>(`/transactions/${encodeURIComponent(id)}`, { auth: "public" });
}

/** Verifica el checksum de un evento de Wompi (propiedades + timestamp + secreto). */
export function verifyEventChecksum(event: {
  data?: Record<string, unknown>;
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number | string;
}, headerChecksum?: string | null) {
  const secret = keys().eventsSecret;
  const expected = event.signature?.checksum || headerChecksum || "";
  if (!secret || !expected || !event.signature?.properties?.length) return false;
  const values = event.signature.properties.map((path) =>
    String(path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], event.data) ?? ""),
  );
  const computed = createHash("sha256").update(`${values.join("")}${event.timestamp ?? ""}${secret}`).digest("hex");
  const a = Buffer.from(computed.toUpperCase());
  const b = Buffer.from(String(expected).toUpperCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
