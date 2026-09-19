/**
 * Thin client for ImprovMX's v4 REST API — used to keep each organization's
 * `{slug}@ethicvoice.co` inbound alias in sync with our own EmailConfiguration
 * records, instead of requiring someone to manually add/remove the rule in
 * the ImprovMX dashboard every time an org activates or deactivates its
 * email channel. See https://improvmx.com/api/ for the full reference.
 */

const IMPROVMX_BASE_URL = "https://api.improvmx.com/v4";

export interface ImprovMxAlias {
  id: string;
  alias: string;
  forward: string;
}

function getApiKey(): string {
  const apiKey = process.env.IMPROVMX_API_KEY;
  if (!apiKey) {
    throw new Error(
      "IMPROVMX_API_KEY no está configurada — no se puede gestionar el alias de correo automáticamente"
    );
  }
  return apiKey;
}

function authHeader(): string {
  return "Basic " + Buffer.from(`api:${getApiKey()}`).toString("base64");
}

async function improvMxFetch(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${IMPROVMX_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // 204 No Content and similar have no body.
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * Finds an existing alias by its exact local part (e.g. "finanzclub-ogsinl"),
 * since ImprovMX's query param only filters by substring — an org whose
 * slug is a substring of another's would otherwise match the wrong alias.
 */
export async function findImprovMxAlias(
  domain: string,
  alias: string
): Promise<ImprovMxAlias | null> {
  const { ok, data } = await improvMxFetch(
    `/domains/${domain}/aliases?query=${encodeURIComponent(alias)}&limit=200`
  );
  if (!ok) return null;
  const match = (data?.aliases || []).find((a: any) => a.alias === alias);
  return match ? { id: match.id, alias: match.alias, forward: match.forward } : null;
}

/**
 * Creates the alias if it doesn't exist yet, or updates its forward target
 * if it does — idempotent, so activating an already-configured org's email
 * channel again (e.g. after a plan lapse and renewal) just re-points the
 * existing alias instead of erroring on a duplicate.
 */
export async function upsertImprovMxAlias(
  domain: string,
  alias: string,
  forward: string
): Promise<ImprovMxAlias> {
  const existing = await findImprovMxAlias(domain, alias);

  if (existing) {
    if (existing.forward === forward) {
      return existing;
    }
    const { ok, data } = await improvMxFetch(
      `/domains/${domain}/aliases/${existing.id}`,
      { method: "PUT", body: JSON.stringify({ forward }) }
    );
    if (!ok) {
      throw new Error(
        `No se pudo actualizar el alias de ImprovMX: ${data?.message || "error desconocido"}`
      );
    }
    return { id: existing.id, alias, forward };
  }

  const { ok, data } = await improvMxFetch(`/domains/${domain}/aliases`, {
    method: "POST",
    body: JSON.stringify({ alias, forward }),
  });
  if (!ok) {
    throw new Error(
      `No se pudo crear el alias de ImprovMX: ${data?.message || "error desconocido"}`
    );
  }
  return { id: data.alias.id, alias, forward };
}

/**
 * Removes an org's alias entirely (rather than just leaving it pointed at
 * the webhook) when its email channel is deactivated — the webhook itself
 * already checks plan compliance and no-ops, but an orphaned alias sitting
 * in the ImprovMX dashboard forever is confusing and unnecessary attack
 * surface. Safe to call even if the alias was already removed or never
 * existed.
 */
export async function deleteImprovMxAliasByName(
  domain: string,
  alias: string
): Promise<void> {
  const existing = await findImprovMxAlias(domain, alias);
  if (!existing) return;

  const { ok, status, data } = await improvMxFetch(
    `/domains/${domain}/aliases/${existing.id}`,
    { method: "DELETE" }
  );
  if (!ok && status !== 404) {
    throw new Error(
      `No se pudo eliminar el alias de ImprovMX: ${data?.message || "error desconocido"}`
    );
  }
}
