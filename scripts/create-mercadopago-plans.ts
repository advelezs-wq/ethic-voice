/*
  Creates Mercado Pago preapproval plans for all billable plans/cycles

  Requirements:
  - MERCADOPAGO_ACCESS_TOKEN
  - NEXT_PUBLIC_APP_URL (used for back_url)

  Run:
    npx tsx scripts/create-mercadopago-plans.ts
*/

import 'dotenv/config';
import { PLAN_CONFIGS, PlanType } from "../src/types/subscription.types";

type Cycle = "MONTHLY" | "YEARLY";

interface CreatedPlan {
  key: string; // e.g., MP_STARTER_MONTHLY_PLAN_ID
  id: string;
}

const apiBase = "https://api.mercadopago.com";

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN is required");
  return token;
}

function getBackUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
  return `${base}/app/onboarding/payment-success`;
}

function cycleToFrequency(cycle: Cycle) {
  if (cycle === "MONTHLY") return { frequency: 1 as const, frequency_type: "months" as const };
  return { frequency: 12 as const, frequency_type: "months" as const };
}

function planEnvKey(plan: PlanType, cycle: Cycle): string {
  return `MP_${plan}_${cycle}_PLAN_ID`;
}

function getTestAmountOverride(): number | null {
  const raw = process.env.MERCADOPAGO_TEST_PLAN_AMOUNT || process.env.MP_TEST_PLAN_AMOUNT;
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function getPerPlanMonthlyOverrides(): Partial<Record<PlanType, number>> {
  const map: Partial<Record<PlanType, number>> = {};
  const entries: Array<[PlanType, string | undefined]> = [
    ["STARTER" as PlanType, process.env.MP_TEST_STARTER_MONTHLY],
    ["GROW" as PlanType, process.env.MP_TEST_GROW_MONTHLY],
    ["GROW_PRO" as PlanType, process.env.MP_TEST_GROW_PRO_MONTHLY],
  ];
  for (const [plan, raw] of entries) {
    if (!raw) continue;
    const num = Number(raw);
    if (Number.isFinite(num) && num > 0) map[plan] = num;
  }
  return map;
}

function getBillingDaySettings(): { billing_day?: number; billing_day_proportional?: boolean } {
  const settings: { billing_day?: number; billing_day_proportional?: boolean } = {};
  const bdRaw = process.env.MP_TEST_BILLING_DAY;
  if (bdRaw) {
    const n = Number(bdRaw);
    if (Number.isFinite(n) && n >= 1 && n <= 28) settings.billing_day = n;
  }
  if ((process.env.MP_TEST_BILLING_DAY_PROP || "").toLowerCase() === "true") {
    settings.billing_day_proportional = true;
  }
  return settings;
}

async function createPlan(params: {
  reason: string;
  amount: number;
  currency: string;
  cycle: Cycle;
}): Promise<string> {
  const token = getAccessToken();
  const { frequency, frequency_type } = cycleToFrequency(params.cycle);
  const billing = getBillingDaySettings();

  const res = await fetch(`${apiBase}/preapproval_plan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: params.reason,
      auto_recurring: {
        frequency,
        frequency_type,
        transaction_amount: params.amount,
        currency_id: params.currency,
        ...(typeof billing.billing_day === "number" ? { billing_day: billing.billing_day } : {}),
        ...(typeof billing.billing_day_proportional === "boolean"
          ? { billing_day_proportional: billing.billing_day_proportional }
          : {}),
      },
      payment_methods_allowed: {
        payment_types: [{}],
        payment_methods: [{}],
      },
      back_url: getBackUrl(),
    }),
  });

  const data: any = await res.json();
  if (!res.ok || !data?.id) {
    throw new Error(`Failed to create plan ${params.reason}: ${data?.message || data?.error || res.status}`);
  }
  return data.id as string;
}

async function main() {
  const created: CreatedPlan[] = [];
  const entries = Object.entries(PLAN_CONFIGS) as [PlanType, typeof PLAN_CONFIGS[PlanType]][];
  const perPlanMonthly = getPerPlanMonthlyOverrides();

  for (const [planType, config] of entries) {
    // Skip non-billable/enterprise (price 0)
    const override = getTestAmountOverride();
    const monthly = (perPlanMonthly[planType] ?? override ?? config.price.monthly) as number | undefined;
    const yearly = perPlanMonthly[planType]
      ? (perPlanMonthly[planType] as number) * 12
      : (override ?? config.price.yearly);
    const currency = config.price.currency || "COP";

    if (monthly && monthly > 0) {
      const reason = `${config.displayName} Mensual`;
      const id = await createPlan({ reason, amount: monthly, currency, cycle: "MONTHLY" });
      created.push({ key: planEnvKey(planType, "MONTHLY"), id });
      // eslint-disable-next-line no-console
      console.log(`✅ ${reason}: ${id}`);
    }

    if (yearly && yearly > 0) {
      const reason = `${config.displayName} Anual`;
      const id = await createPlan({ reason, amount: yearly, currency, cycle: "YEARLY" });
      created.push({ key: planEnvKey(planType, "YEARLY"), id });
      // eslint-disable-next-line no-console
      console.log(`✅ ${reason}: ${id}`);
    }
  }

  // Print .env lines
  // eslint-disable-next-line no-console
  console.log("\nAdd these to your .env.local:\n");
  for (const c of created) {
    // eslint-disable-next-line no-console
    console.log(`${c.key}=${c.id}`);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Error:", err);
  process.exit(1);
});


