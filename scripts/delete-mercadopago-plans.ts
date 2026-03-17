/*
  Deletes (or deactivates) existing Mercado Pago preapproval plans by IDs from env

  Reads the following env vars if present and attempts to delete each:
    MP_STARTER_MONTHLY_PLAN_ID
    MP_STARTER_YEARLY_PLAN_ID
    MP_GROW_MONTHLY_PLAN_ID
    MP_GROW_YEARLY_PLAN_ID
    MP_GROW_PRO_MONTHLY_PLAN_ID
    MP_GROW_PRO_YEARLY_PLAN_ID
    MP_PREMIUM_MONTHLY_PLAN_ID
    MP_PREMIUM_YEARLY_PLAN_ID

  If DELETE is not supported by the API/account, falls back to PUT { status: "cancelled" }.

  Run:
    npx tsx scripts/delete-mercadopago-plans.ts
*/

import 'dotenv/config';

const apiBase = 'https://api.mercadopago.com';

function requireToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN is required');
  return token;
}

function headers() {
  return {
    Authorization: `Bearer ${requireToken()}`,
    'Content-Type': 'application/json',
  } as const;
}

const ENV_KEYS = [
  'MP_STARTER_MONTHLY_PLAN_ID',
  'MP_STARTER_YEARLY_PLAN_ID',
  'MP_GROW_MONTHLY_PLAN_ID',
  'MP_GROW_YEARLY_PLAN_ID',
  'MP_GROW_PRO_MONTHLY_PLAN_ID',
  'MP_GROW_PRO_YEARLY_PLAN_ID',
  'MP_PREMIUM_MONTHLY_PLAN_ID',
  'MP_PREMIUM_YEARLY_PLAN_ID',
];

async function tryDelete(planId: string) {
  const url = `${apiBase}/preapproval_plan/${planId}`;
  const resp = await fetch(url, { method: 'DELETE', headers: headers() });
  if (resp.ok) return { ok: true, action: 'deleted' as const };
  const body = await resp.text();
  return { ok: false, body };
}

async function tryCancel(planId: string) {
  const url = `${apiBase}/preapproval_plan/${planId}`;
  const resp = await fetch(url, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ status: 'cancelled' }),
  });
  const json = await resp.json().catch(() => ({}));
  return { ok: resp.ok, json };
}

async function main() {
  const found: Array<{ key: string; id: string }> = [];
  for (const key of ENV_KEYS) {
    const id = (process.env as any)[key];
    if (id) found.push({ key, id });
  }

  if (found.length === 0) {
    console.log('No MP_*_PLAN_ID env vars found. Nothing to delete.');
    return;
  }

  for (const { key, id } of found) {
    try {
      console.log(`🗑️  Removing plan ${key}: ${id}`);
      const del = await tryDelete(id);
      if (del.ok) {
        console.log(`✅ Deleted ${id}`);
        continue;
      }
      console.warn(`⚠️  DELETE failed for ${id}. Fallback to cancel.`, del.body);
      const cancel = await tryCancel(id);
      if (cancel.ok) console.log(`✅ Cancelled ${id}`);
      else console.error(`❌ Failed to cancel ${id}`, cancel.json);
    } catch (e) {
      console.error(`❌ Error removing plan ${id}`, e);
    }
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});


