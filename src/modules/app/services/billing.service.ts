/**
 * Cobro de suscripciones con Wompi.
 *
 * Wompi no tiene un motor de suscripciones: guarda la tarjeta (fuente de pago)
 * y nosotros cobramos cada periodo. El ciclo completo vive aquí:
 *  - startSubscription: checkout. Crea la organización si el cliente no tiene,
 *    guarda la tarjeta y hace el primer cobro. El plan se activa solo cuando
 *    Wompi aprueba el pago.
 *  - applyTransaction: resultado de un cobro (webhook, consulta del navegador o
 *    cron). Es idempotente.
 *  - runDueCharges: cron diario. Renueva los periodos vencidos, reintenta los
 *    cobros rechazados (a los 1 y 3 días) y, tras 3 intentos, suspende el
 *    plan (PAST_DUE). También cierra las cancelaciones al fin del periodo.
 *  - cancelAtPeriodEnd / resume / updateCard: autogestión desde Facturación.
 *
 * Datos (sin cambios de esquema):
 *  Subscription.providerCustomerId = id de la fuente de pago en Wompi
 *  Subscription.metadata.gateway = "WOMPI" + periodo, próximo cobro, tarjeta
 *  PaymentTransaction (gateway WOMPI) = un registro por cada cobro
 */
import prisma from "@/modules/prisma/lib/prisma";
import type { Prisma, Subscription } from "@prisma/client";
import { BillingCycle, PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { ClientAdminError } from "@/modules/app/services/client-admin.service";
import { createOrganizationForUser, findAdminOrganizationId } from "@/modules/app/services/organization-setup.service";
import { syncOrganizationWithSubscription } from "@/modules/app/services/subscription-sync.service";
import {
  chargePaymentSource,
  createPaymentSource,
  getTransaction,
  isWompiConfigured,
  WompiError,
  type WompiTransaction,
} from "@/modules/app/services/wompi.service";

export type WompiMeta = {
  gateway: "WOMPI";
  chargeAmountCop: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextChargeAt?: string;
  failedAttempts?: number;
  pendingTransactionId?: string | null;
  lastError?: string | null;
  cancelAtPeriodEnd?: boolean;
  customerEmail: string;
  card?: { brand?: string; last4?: string; expMonth?: string; expYear?: string };
  creditAppliedCop?: number;
  /** El próximo cobro aprobado abre un periodo nuevo desde hoy (reactivación). */
  restartPeriod?: boolean;
  [k: string]: unknown;
};

const RETRY_DAYS = [1, 3];
const MAX_ATTEMPTS = 3;
const DAY = 24 * 60 * 60 * 1000;

export const metaOf = (s: Pick<Subscription, "metadata">) =>
  ((s.metadata as Record<string, unknown> | null) ?? {}) as Partial<WompiMeta>;
export const isWompi = (s: Pick<Subscription, "metadata">) => metaOf(s).gateway === "WOMPI";

function addPeriod(from: Date, cycle: BillingCycle) {
  const d = new Date(from);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + (cycle === BillingCycle.YEARLY ? 12 : 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export function planPriceCop(planType: PlanType, cycle: BillingCycle) {
  const p = PLAN_CONFIGS[planType]?.priceCop;
  return cycle === BillingCycle.YEARLY ? p?.yearly ?? 0 : p?.monthly ?? 0;
}

function reference(subId: number) {
  return `EV-${subId}-${Date.now().toString(36).toUpperCase()}`;
}

function friendlyDecline(tx: WompiTransaction) {
  if (tx.status === "DECLINED") return "El banco rechazó el pago. Revisa los datos o usa otra tarjeta.";
  if (tx.status === "VOIDED") return "El pago fue anulado.";
  return "El pago no se pudo procesar. Intenta de nuevo o usa otra tarjeta.";
}

async function recordCharge(sub: Subscription, amountCop: number, meta: Partial<WompiMeta>, recurrent: boolean) {
  if (!sub.orgId || !sub.providerCustomerId) throw new Error("Suscripción sin organización o sin tarjeta");
  const tx = await chargePaymentSource({
    paymentSourceId: sub.providerCustomerId,
    amountCop,
    customerEmail: String(meta.customerEmail || ""),
    reference: reference(sub.id),
    recurrent,
  });
  await prisma.paymentTransaction.create({
    data: {
      orgId: sub.orgId,
      subscriptionId: sub.id,
      userId: sub.userId,
      amount: amountCop,
      currency: "COP",
      status: "PENDING",
      gateway: "WOMPI",
      providerTransactionId: tx.id,
      transactionDate: new Date(),
    },
  });
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { metadata: { ...meta, pendingTransactionId: tx.id } as Prisma.InputJsonValue },
  });
  // En sandbox (y a veces en producción) Wompi responde ya con el resultado.
  if (tx.status !== "PENDING") await applyTransaction(tx);
  return tx;
}

/** Crédito por los días no usados del plan pagado actual (cambio de plan). */
async function unusedCreditCop(orgId: string) {
  const current = await prisma.subscription.findFirst({
    where: { orgId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!current || !isWompi(current)) return 0;
  const m = metaOf(current);
  if (!m.currentPeriodStart || !m.currentPeriodEnd || m.cancelAtPeriodEnd) return 0;
  const lastPaid = await prisma.paymentTransaction.findFirst({
    where: { subscriptionId: current.id, status: "SUCCEEDED" },
    orderBy: { transactionDate: "desc" },
  });
  if (!lastPaid) return 0;
  const start = new Date(m.currentPeriodStart).getTime();
  const end = new Date(m.currentPeriodEnd).getTime();
  const left = Math.max(0, end - Date.now());
  if (end <= start || left === 0) return 0;
  return Math.floor((Number(lastPaid.amount) * left) / (end - start));
}

export async function startSubscription(input: {
  userId: string;
  email: string;
  planType: unknown;
  billingCycle: unknown;
  organizationName?: unknown;
  cardToken: unknown;
  card?: WompiMeta["card"];
  acceptanceToken: unknown;
  personalAuthToken: unknown;
}) {
  // Antes de crear nada (organización incluida): sin llaves no hay cobro posible.
  if (!isWompiConfigured()) throw new ClientAdminError("Los pagos en línea no están disponibles en este momento. Escríbenos a soporte.", 503);
  const planType = String(input.planType || "").toUpperCase() as PlanType;
  const cycle = String(input.billingCycle || "MONTHLY").toUpperCase() === "YEARLY" ? BillingCycle.YEARLY : BillingCycle.MONTHLY;
  const cfg = PLAN_CONFIGS[planType];
  if (!cfg) throw new ClientAdminError("Plan no válido.");
  const price = planPriceCop(planType, cycle);
  if (!price) throw new ClientAdminError("Este plan se contrata con nuestro equipo comercial.", 400);
  if (!input.cardToken || !input.acceptanceToken || !input.personalAuthToken) {
    throw new ClientAdminError("Faltan los datos de la tarjeta o la aceptación de términos de Wompi.");
  }
  if (!input.email) throw new ClientAdminError("Tu cuenta no tiene un correo registrado.");

  // Organización: la que administra, o una nueva (sin plan hasta que se pague).
  let orgId = await findAdminOrganizationId(input.userId);
  if (!orgId) {
    const member = await prisma.organizationMembership.findFirst({ where: { userId: input.userId }, select: { orgId: true } });
    if (member) throw new ClientAdminError("Solo el administrador de la organización puede contratar o cambiar el plan.", 403);
    orgId = (await createOrganizationForUser({ userId: input.userId, email: input.email, name: input.organizationName })).id;
  }

  // No duplicar: el mismo plan ya activo no se vuelve a cobrar.
  const active = await prisma.subscription.findFirst({ where: { orgId, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
  if (active && active.planType === planType && active.billingCycle === cycle && !metaOf(active).cancelAtPeriodEnd) {
    throw new ClientAdminError("Tu organización ya tiene este plan activo.", 409);
  }

  // Intentos de pago anteriores sin completar: se cierran.
  await prisma.subscription.updateMany({
    where: { orgId, status: "TRIALING" },
    data: { status: "CANCELED", endDate: new Date() },
  });

  const source = await createPaymentSource({
    cardToken: String(input.cardToken),
    customerEmail: input.email,
    acceptanceToken: String(input.acceptanceToken),
    personalAuthToken: String(input.personalAuthToken),
  });

  const credit = await unusedCreditCop(orgId);
  const amount = Math.max(0, price - credit);
  const f = cfg.features;
  const meta: WompiMeta = {
    gateway: "WOMPI",
    chargeAmountCop: price,
    customerEmail: input.email,
    card: input.card,
    failedAttempts: 0,
    creditAppliedCop: Math.min(credit, price),
  };
  const sub = await prisma.subscription.create({
    data: {
      userId: input.userId,
      orgId,
      planType,
      planName: cfg.displayName,
      billingCycle: cycle,
      status: "TRIALING",
      startDate: new Date(),
      currency: "COP",
      monthlyPrice: cycle === BillingCycle.MONTHLY ? price : null,
      yearlyPrice: cycle === BillingCycle.YEARLY ? price : null,
      trialDays: null,
      isTrialActive: false,
      providerCustomerId: source.id,
      hasEmailChannel: f.hasEmailChannel,
      hasAiProcessing: f.hasAiProcessing,
      hasChatbotChannel: f.hasChatbotChannel,
      hasPhoneChannel: f.hasPhoneChannel,
      hasExternalManager: f.hasExternalManager || false,
      hasBilingualSupport: f.hasBilingualSupport || false,
      hasUnlimitedUsers: f.hasUnlimitedUsers || false,
      hasAdvancedAnalytics: f.hasAdvancedAnalytics || false,
      hasCustomization: f.hasCustomization || false,
      hasColorThemes: f.hasColorThemes || false,
      hasUnlimitedCustomization: f.hasUnlimitedCustomization || false,
      maxUsers: f.maxUsers,
      maxInvestigators: f.maxInvestigators,
      maxEmployees: f.maxEmployees,
      metadata: meta as Prisma.InputJsonValue,
    },
  });

  if (amount === 0) {
    // El crédito del plan anterior cubre el cambio: se activa sin cobro.
    await activate(sub.id, new Date());
    return { subscriptionId: sub.id, organizationId: orgId, transactionId: null, status: "APPROVED" as const, amountCop: 0 };
  }

  try {
    const tx = await recordCharge(sub, amount, meta, false);
    const fresh = await prisma.paymentTransaction.findFirst({ where: { providerTransactionId: tx.id } });
    return {
      subscriptionId: sub.id,
      organizationId: orgId,
      transactionId: tx.id,
      status: fresh?.status === "SUCCEEDED" ? "APPROVED" : fresh?.status === "FAILED" ? "DECLINED" : "PENDING",
      amountCop: amount,
    };
  } catch (e) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "CANCELED", endDate: new Date(), metadata: { ...meta, lastError: e instanceof Error ? e.message : String(e) } as Prisma.InputJsonValue },
    });
    throw e instanceof WompiError ? new ClientAdminError(e.message, e.status) : e;
  }
}

async function activate(subscriptionId: number, periodStart: Date, card?: WompiMeta["card"]) {
  const sub = await prisma.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  const meta = metaOf(sub);
  const end = addPeriod(periodStart, sub.billingCycle as BillingCycle);
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "ACTIVE",
      endDate: null,
      metadata: {
        ...meta,
        currentPeriodStart: periodStart.toISOString(),
        currentPeriodEnd: end.toISOString(),
        nextChargeAt: end.toISOString(),
        failedAttempts: 0,
        pendingTransactionId: null,
        lastError: null,
        restartPeriod: false,
        card: card?.last4 ? card : meta.card,
      } as Prisma.InputJsonValue,
    },
  });
  await syncOrganizationWithSubscription(sub.id);
}

/** Aplica el resultado de un cobro. Idempotente: un cobro se procesa una sola vez. */
export async function applyTransaction(tx: WompiTransaction) {
  if (tx.status === "PENDING") return { changed: false };
  const pt = await prisma.paymentTransaction.findFirst({
    where: { providerTransactionId: tx.id, gateway: "WOMPI" },
    include: { subscription: true },
  });
  if (!pt?.subscription) return { changed: false };

  // Reclamo atómico del registro PENDING para que dos avisos simultáneos no lo apliquen dos veces.
  const claimed = await prisma.paymentTransaction.updateMany({
    where: { id: pt.id, status: "PENDING" },
    data: { status: tx.status === "APPROVED" ? "SUCCEEDED" : "FAILED", updatedAt: new Date() },
  });
  if (claimed.count === 0) return { changed: false };

  const sub = pt.subscription;
  const meta = metaOf(sub);

  // Cobro que Wompi resolvió después de que la suscripción se cerrara (p. ej. un
  // primer intento que quedó en proceso y el cliente volvió a pagar). No se
  // reactiva: quedaría cobrando en paralelo a la vigente. Si se aprobó, queda
  // marcado para reembolsarlo desde el panel de Wompi.
  if (sub.status === "CANCELED") {
    if (tx.status === "APPROVED") {
      console.error(`[billing] Cobro ${tx.id} aprobado sobre la suscripción cerrada ${sub.id}: reembolsar en Wompi`);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { metadata: { ...meta, refundTransactionId: tx.id } as Prisma.InputJsonValue },
      });
    }
    return { changed: false };
  }

  const isInitial = sub.status === "TRIALING";
  const card = tx.payment_method?.extra?.last_four
    ? { ...meta.card, brand: tx.payment_method.extra.brand, last4: tx.payment_method.extra.last_four }
    : undefined;

  if (tx.status === "APPROVED") {
    const start = !isInitial && !meta.restartPeriod && meta.currentPeriodEnd ? new Date(meta.currentPeriodEnd) : new Date();
    await activate(sub.id, start, card);
    return { changed: true, approved: true };
  }

  const reason = tx.status_message || friendlyDecline(tx);
  if (isInitial) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "CANCELED", endDate: new Date(), metadata: { ...meta, pendingTransactionId: null, lastError: reason } as Prisma.InputJsonValue },
    });
    return { changed: true, approved: false, reason: friendlyDecline(tx) };
  }

  const attempts = (meta.failedAttempts ?? 0) + 1;
  const giveUp = attempts >= MAX_ATTEMPTS;
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: giveUp ? "PAST_DUE" : sub.status,
      metadata: {
        ...meta,
        failedAttempts: attempts,
        pendingTransactionId: null,
        lastError: reason,
        nextChargeAt: giveUp ? null : new Date(Date.now() + RETRY_DAYS[attempts - 1] * DAY).toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
  if (giveUp) await syncOrganizationWithSubscription(sub.id);
  return { changed: true, approved: false, reason: friendlyDecline(tx) };
}

/** Consulta a Wompi el estado real de un cobro y lo aplica. */
export async function refreshTransaction(transactionId: string) {
  const tx = await getTransaction(transactionId);
  await applyTransaction(tx);
  return tx;
}

/** Cron diario: renovaciones, reintentos, cobros pendientes y cancelaciones al fin del periodo. */
export async function runDueCharges(now = new Date()) {
  const summary = { renewed: 0, pendingChecked: 0, canceledAtPeriodEnd: 0, expired: 0, errors: [] as string[] };
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ["ACTIVE", "TRIALING"] }, providerCustomerId: { not: null } },
  });
  for (const sub of subs) {
    if (!isWompi(sub)) continue;
    const meta = metaOf(sub);
    try {
      if (meta.pendingTransactionId) {
        await refreshTransaction(meta.pendingTransactionId);
        summary.pendingChecked++;
        continue;
      }
      if (sub.status !== "ACTIVE") continue;
      const periodEnd = meta.currentPeriodEnd ? new Date(meta.currentPeriodEnd) : null;
      if (meta.cancelAtPeriodEnd) {
        if (periodEnd && periodEnd <= now) {
          await prisma.subscription.update({ where: { id: sub.id }, data: { status: "CANCELED", endDate: periodEnd } });
          if (sub.orgId) await prisma.organization.update({ where: { id: sub.orgId }, data: { planExpiresAt: periodEnd } });
          await syncOrganizationWithSubscription(sub.id);
          summary.canceledAtPeriodEnd++;
        }
        continue;
      }
      if (meta.nextChargeAt && new Date(meta.nextChargeAt) <= now) {
        const amount = planPriceCop(sub.planType as PlanType, sub.billingCycle as BillingCycle) || meta.chargeAmountCop || 0;
        if (amount > 0) {
          await recordCharge(sub, amount, meta, true);
          summary.renewed++;
        }
      }
    } catch (e) {
      summary.errors.push(`sub ${sub.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Planes cancelados cuyo periodo pagado ya terminó: se retira el acceso.
  // Antes nada lo hacía y una organización que cancelaba conservaba el plan
  // para siempre.
  const lapsed = await prisma.organization.findMany({
    where: { hasActivePlan: true, planExpiresAt: { lt: now } },
    select: { id: true },
  });
  for (const org of lapsed) {
    const stillPaying = await prisma.subscription.count({ where: { orgId: org.id, status: "ACTIVE" } });
    if (stillPaying > 0) continue;
    await prisma.organization.update({
      where: { id: org.id },
      data: { hasActivePlan: false, isEmailChannelActive: false, isAiProcessingActive: false, isChatbotActive: false, isPhoneChannelActive: false },
    });
    summary.expired++;
  }
  return summary;
}

async function activeWompiSubscription(orgId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { orgId, status: { in: ["ACTIVE", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!sub || !isWompi(sub)) throw new ClientAdminError("Tu organización no tiene una suscripción con pago en línea.", 404);
  return sub;
}

export async function cancelAtPeriodEnd(orgId: string) {
  const sub = await activeWompiSubscription(orgId);
  const meta = metaOf(sub);
  const end = meta.currentPeriodEnd ? new Date(meta.currentPeriodEnd) : new Date();
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { metadata: { ...meta, cancelAtPeriodEnd: true } as Prisma.InputJsonValue },
  });
  await prisma.organization.update({ where: { id: orgId }, data: { planExpiresAt: end } });
  return { accessUntil: end.toISOString() };
}

export async function resumeSubscription(orgId: string) {
  const sub = await activeWompiSubscription(orgId);
  const meta = metaOf(sub);
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { metadata: { ...meta, cancelAtPeriodEnd: false } as Prisma.InputJsonValue },
  });
  await prisma.organization.update({ where: { id: orgId }, data: { planExpiresAt: null } });
}

export async function updateCard(input: {
  orgId: string;
  email: string;
  cardToken: unknown;
  card?: WompiMeta["card"];
  acceptanceToken: unknown;
  personalAuthToken: unknown;
}) {
  const sub = await activeWompiSubscription(input.orgId);
  const source = await createPaymentSource({
    cardToken: String(input.cardToken || ""),
    customerEmail: input.email,
    acceptanceToken: String(input.acceptanceToken || ""),
    personalAuthToken: String(input.personalAuthToken || ""),
  });
  const meta = { ...metaOf(sub), card: input.card, customerEmail: input.email };
  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { providerCustomerId: source.id, metadata: meta as Prisma.InputJsonValue },
  });
  // Si el plan estaba suspendido por falta de pago, se cobra de inmediato con la nueva tarjeta.
  if (sub.status === "PAST_DUE") {
    const amount = planPriceCop(sub.planType as PlanType, sub.billingCycle as BillingCycle) || meta.chargeAmountCop || 0;
    const retryMeta = { ...meta, failedAttempts: MAX_ATTEMPTS - 1, restartPeriod: true };
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: "ACTIVE", metadata: retryMeta as Prisma.InputJsonValue } });
    const tx = await recordCharge({ ...updated, status: "ACTIVE" }, amount, retryMeta, true);
    return { retriedTransactionId: tx.id };
  }
  return { retriedTransactionId: null };
}

/** Resumen para la página de Facturación. */
export async function billingSummary(orgId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { orgId, status: { in: ["ACTIVE", "PAST_DUE", "INACTIVE", "TRIALING"] } },
    orderBy: { createdAt: "desc" },
  });
  const payments = await prisma.paymentTransaction.findMany({
    where: { orgId },
    orderBy: { transactionDate: "desc" },
    take: 24,
    select: { id: true, amount: true, currency: true, status: true, gateway: true, transactionDate: true, providerTransactionId: true },
  });
  const meta = sub ? metaOf(sub) : {};
  return {
    subscription: sub
      ? {
          id: sub.id,
          planType: sub.planType,
          planName: PLAN_CONFIGS[sub.planType as PlanType]?.displayName ?? sub.planName,
          billingCycle: sub.billingCycle,
          status: sub.status,
          billing: isWompi(sub) ? "wompi" : "manual",
          priceCop: isWompi(sub) ? planPriceCop(sub.planType as PlanType, sub.billingCycle as BillingCycle) : null,
          currentPeriodEnd: meta.currentPeriodEnd ?? null,
          nextChargeAt: meta.cancelAtPeriodEnd ? null : meta.nextChargeAt ?? null,
          cancelAtPeriodEnd: Boolean(meta.cancelAtPeriodEnd),
          failedAttempts: meta.failedAttempts ?? 0,
          lastError: meta.lastError ?? null,
          card: meta.card ?? null,
        }
      : null,
    payments: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
  };
}
