import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { EmailAccountService } from "@/modules/app/services/email-account.service";

const emailAccountService = new EmailAccountService();

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const debug = String(process.env.MP_WEBHOOK_DEBUG || "1").toLowerCase() === "1" || String(process.env.MP_WEBHOOK_DEBUG).toLowerCase() === "true";
    const reqId = `mpwh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const raw = await req.clone().text().catch(() => "");
    if (debug) {
      console.log(`🛰️ [MP-WEBHOOK][${reqId}] Incoming request`, {
        method: "POST",
        url: req.url,
        headers: {
          'content-type': req.headers.get('content-type'),
          'x-meli-event-id': req.headers.get('x-meli-event-id'),
          'x-forwarded-for': req.headers.get('x-forwarded-for'),
          'user-agent': req.headers.get('user-agent'),
        },
        rawBodyPreview: raw?.slice(0, 2000) || null,
      });
    }
    // Mercado Pago envía a veces JSON y a veces x-www-form-urlencoded
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};
    if (contentType.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      body = await req.json().catch(async () => {
        const t = await req.text().catch(() => "");
        try {
          return JSON.parse(t);
        } catch {
          return {};
        }
      });
    }
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());
    if (debug) {
      console.log(`🛰️ [MP-WEBHOOK][${reqId}] Parsed payload`, {
        topic: body?.type || body?.topic || query?.topic,
        action: body?.action,
        data: body?.data,
        query,
      });
    }

    // Identify resource and topic
    const topic = body?.type || body?.topic || query?.topic || query?.type || "";
    const action = body?.action || "";
    // Try extracting ids for both payment and preapproval flows
    const possibleId =
      (body?.data && (body.data.id || body.data.preapproval_id || body.data.payment_id)) ||
      body?.id ||
      query?.id ||
      (typeof body?.resource === "string" && body.resource.split("/").pop()) ||
      null;

    // If no id, acknowledge
    if (!possibleId) {
      return NextResponse.json({ ok: true, note: "no id" });
    }

    // If it is a payment event, fetch payment and try to find linked subscription
    if (String(topic).includes("payment") || String(action).includes("payment")) {
      try {
        const payment = await mercadoPagoService.getPayment(String(possibleId));
        if (debug) {
          console.log(`🧾 [MP-WEBHOOK][${reqId}] Payment fetched`, {
            id: payment?.id,
            status: payment?.status,
            extRef: payment?.external_reference,
            preapproval_id: payment?.preapproval_id,
            metadata: payment?.metadata,
          });
        }
        const externalReference = payment?.external_reference || payment?.metadata?.external_reference;
        // Metadata can carry explicit subscriptionId for proration
        const metaSubId = payment?.metadata?.subscriptionId;
        let internalSubscriptionId = Number.isFinite(Number(metaSubId)) ? Number(metaSubId) : Number.parseInt(String(externalReference ?? ""), 10);
        // Fallback: look up by providerSubscriptionId when external_reference is missing
        if (!Number.isFinite(internalSubscriptionId) && payment?.preapproval_id) {
          const sub = await prisma.subscription.findFirst({ where: { providerSubscriptionId: String(payment.preapproval_id) } });
          if (sub) internalSubscriptionId = Number(sub.id);
        }
        if (!Number.isFinite(internalSubscriptionId)) {
          // Try fetching related preapproval from payment to infer subscription
          if (payment?.preapproval_id) {
            const pre = await mercadoPagoService.getPreapproval(String(payment.preapproval_id));
            const ext = parseInt(String(pre?.external_reference), 10);
            if (Number.isFinite(ext)) internalSubscriptionId = ext;
          }
          if (!Number.isFinite(internalSubscriptionId)) {
            return NextResponse.json({ ok: true, note: "no internal sub id from payment" });
          }
        }
        const status = payment?.status; // approved, rejected, in_process, etc.
        const isProration = payment?.metadata?.type === "proration";
        const updates: any = {
          updatedAt: new Date(),
          metadata: {
            ...(await (async () => {
              const s = await prisma.subscription.findUnique({ where: { id: internalSubscriptionId } });
              const m = s?.metadata && typeof s.metadata === "object" && !Array.isArray(s.metadata) ? (s.metadata as Record<string, unknown>) : {};
              return m;
            })()),
            mpPayment: {
              id: payment?.id,
              status: payment?.status,
              preapproval_id: payment?.preapproval_id,
            },
          },
        };
        // Do not flip status based on one-time proration payments
        if (!isProration && status === "approved") updates.status = "ACTIVE";
        if (status === "rejected") updates.status = "PAST_DUE";

        // If this is a proration payment and was approved, apply the pending change atomically
        if (isProration && status === "approved") {
          const subscription = await prisma.subscription.findUnique({ where: { id: internalSubscriptionId } });
          const m = (subscription?.metadata as any) || {};
          const pending = m?.pendingChange;
          if (pending?.type === "upgrade") {
            const newPlanType = pending.newPlanType as string;
            const newPlanConfig = PLAN_CONFIGS[newPlanType as PlanType];
            const billingCycleToUse = pending.newBillingCycle as "MONTHLY" | "YEARLY";
            if (debug) {
              console.log(`⬆️ [MP-WEBHOOK][${reqId}] Applying pending upgrade`, {
                subscriptionId: internalSubscriptionId,
                newPlanType,
                billingCycleToUse,
              });
            }
            try {
              // Update provider preapproval now to new amount/plan
              if (subscription?.providerSubscriptionId) {
                const useNoPlan = String(process.env.MP_USE_NO_PLAN || "false").toLowerCase() === "true";
                const update = await mercadoPagoService.updatePreapproval(
                  String(subscription.providerSubscriptionId),
                  useNoPlan
                    ? {
                        auto_recurring: {
                          frequency: billingCycleToUse === "YEARLY" ? 12 : 1,
                          frequency_type: "months",
                          transaction_amount: pending.newMonthlyPrice || pending.newYearlyPrice || newPlanConfig.price.monthly,
                          currency_id: newPlanConfig.price.currency,
                        },
                      }
                    : {
                        preapproval_plan_id: mercadoPagoService.getPlanId(newPlanType, billingCycleToUse),
                      }
                );
                if (!update.success) {
                  console.warn("⚠️ Failed to update preapproval on webhook apply");
                }
              }
              await prisma.subscription.update({
                where: { id: internalSubscriptionId },
                data: {
                  planType: pending.newPlanType,
                  planName: pending.newPlanName,
                  billingCycle: billingCycleToUse,
                  monthlyPrice: billingCycleToUse === "MONTHLY" ? pending.newMonthlyPrice : null,
                  yearlyPrice: billingCycleToUse === "YEARLY" ? pending.newYearlyPrice : null,
                  metadata: {
                    ...(subscription?.metadata as any),
                    pendingPayment: false,
                    pendingChange: null,
                  } as any,
                  updatedAt: new Date(),
                },
              });
              // Also update organization limits/features immediately
              if (subscription?.orgId) {
                const cfg = PLAN_CONFIGS[newPlanType as PlanType];
                await prisma.organization.update({
                  where: { id: subscription.orgId },
                  data: {
                    currentPlan: newPlanType as unknown as PlanType,
                    isEmailChannelActive: cfg.features.hasEmailChannel,
                    isAiProcessingActive: cfg.features.hasAiProcessing,
                    isChatbotActive: cfg.features.hasChatbotChannel,
                    isPhoneChannelActive: cfg.features.hasPhoneChannel,
                    currentUsers: cfg.features.maxUsers,
                    currentInvestigators: cfg.features.maxInvestigators,
                  },
                });
                await emailAccountService.enforceEmailChannelPlanCompliance(
                  subscription.orgId
                );
              }
              if (debug) {
                console.log(`✅ [MP-WEBHOOK][${reqId}] Pending upgrade applied`);
              }
            } catch (e) {
              console.error("❌ Failed to apply pending upgrade on webhook", e);
            }
          }
        }

        const updatedSubscription = await prisma.subscription.update({
          where: { id: internalSubscriptionId },
          data: updates,
        });
        if (updatedSubscription.orgId) {
          await emailAccountService.enforceEmailChannelPlanCompliance(
            updatedSubscription.orgId
          );
        }
        if (debug) {
          console.log(`💾 [MP-WEBHOOK][${reqId}] Subscription updated from payment`, {
            subscriptionId: internalSubscriptionId,
            isProration,
            status,
          });
        }
        return NextResponse.json({ ok: true });
      } catch (e) {
        console.error("Failed to handle payment webhook", e);
        return NextResponse.json({ ok: true, note: "payment fetch failed" });
      }
    }

    // Default: treat as preapproval event
    try {
      const preapproval = await mercadoPagoService.getPreapproval(String(possibleId));
      const externalReference = preapproval?.external_reference;
      const status: string = preapproval?.status || "";
      if (debug) {
        console.log(`📄 [MP-WEBHOOK][${reqId}] Preapproval fetched`, {
          id: preapproval?.id,
          status,
          externalReference,
          plan: preapproval?.preapproval_plan_id,
        });
      }
      if (!externalReference) {
        return NextResponse.json({ ok: true, note: "no external_reference" });
      }
      const internalSubscriptionId = parseInt(String(externalReference), 10);
      if (!Number.isFinite(internalSubscriptionId)) {
        return NextResponse.json({ ok: true, note: "invalid external_reference" });
      }
      const updates: any = {
        providerSubscriptionId: preapproval.id,
        updatedAt: new Date(),
        metadata: {
          ...(await (async () => {
            const s = await prisma.subscription.findUnique({ where: { id: internalSubscriptionId } });
            const m = s?.metadata && typeof s.metadata === "object" && !Array.isArray(s.metadata) ? (s.metadata as Record<string, unknown>) : {};
            return m;
          })()),
          mpPreapproval: {
            id: preapproval.id,
            status: preapproval.status,
            payer: preapproval.payer_email,
            plan: preapproval.preapproval_plan_id,
          },
        },
      };
      if (status === "authorized") {
        updates.status = "ACTIVE";
      } else if (status === "paused") {
        updates.status = "PAST_DUE";
      } else if (status === "cancelled") {
        updates.status = "CANCELED";
      }
      const updatedSubscription = await prisma.subscription.update({
        where: { id: internalSubscriptionId },
        data: updates,
      });
      if (updatedSubscription.orgId) {
        await emailAccountService.enforceEmailChannelPlanCompliance(
          updatedSubscription.orgId
        );
      }
      if (debug) {
        console.log(`💾 [MP-WEBHOOK][${reqId}] Subscription updated from preapproval`, {
          subscriptionId: internalSubscriptionId,
          status,
        });
      }
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("Failed to fetch MP preapproval", e);
      return NextResponse.json({ ok: true, note: "preapproval fetch failed" });
    }
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    // Nunca devolver 5xx para evitar reintentos masivos; MP reintenta igual con 200/204
    return NextResponse.json({ ok: true, note: "handler error" });
  }
}


