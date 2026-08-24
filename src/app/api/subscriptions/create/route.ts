import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import { z } from "zod";
import {
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
} from "@/types/subscription.types";
import { fetchFxRates } from "@/modules/core/hooks/useExchangeRate";

const createSubscriptionBody = z.object({
  planType: z.nativeEnum(PlanType),
  billingCycle: z.nativeEnum(BillingCycle).default(BillingCycle.MONTHLY),
  returnUrl: z.string().max(500).optional(),
  openSidebar: z.boolean().optional().default(false),
  // Only the public marketing pricing page sets this. In-app billing/upgrade
  // flows intentionally create a new subscription while one is already
  // active (that's how a plan change happens) and must not be redirected.
  fromLanding: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json();
    const parsed = createSubscriptionBody.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { planType, billingCycle, returnUrl, openSidebar, fromLanding } =
      parsed.data;

    // Get plan configuration
    const planConfig = PLAN_CONFIGS[planType as PlanType];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }
    if (planType === PlanType.PREMIUM) {
      return NextResponse.json(
        {
          error:
            "El plan Premium requiere contacto comercial y no se procesa en checkout automático",
        },
        { status: 400 },
      );
    }

    console.log("🔄 Creating subscription for user:", {
      userId,
      planType,
      billingCycle,
      openSidebar,
    });

    // Check for existing active subscriptions tied directly to this user
    const existingSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] }, // Check both active and any pending payments
      },
      orderBy: { createdAt: "desc" },
    });

    // A user invited into an org (e.g. as an ADMIN or MEMBER) has no personal
    // Subscription row of their own — the org's subscription was created by
    // whoever activated it — so the check above alone misses them entirely
    // and they could start a second, unrelated checkout from the landing
    // page for an org they already belong to. Pull in org-level
    // subscriptions for every org this user is a member of as well.
    const membershipOrgIds = (
      await prisma.organizationMembership.findMany({
        where: { userId },
        select: { orgId: true },
      })
    ).map((m) => m.orgId);

    const orgSubscriptions = membershipOrgIds.length
      ? await prisma.subscription.findMany({
          where: {
            orgId: { in: membershipOrgIds },
            status: { in: ["ACTIVE", "TRIALING"] },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const allRelevantSubscriptions = [
      ...existingSubscriptions,
      ...orgSubscriptions,
    ];

    // Check if user already has the same plan in active status
    const samePlanSubscription = allRelevantSubscriptions.find(
      (sub) =>
        sub.status === "ACTIVE" &&
        sub.planType === planType &&
        sub.billingCycle === billingCycle,
    );

    if (samePlanSubscription) {
      console.log("✅ User already has active subscription for this plan");

      if (openSidebar) {
        const price =
          billingCycle === "YEARLY"
            ? planConfig.price.yearly
            : planConfig.price.monthly;

        return NextResponse.json({
          alreadyActive: true,
          redirectUrl: "/app/billing",
          subscription: {
            id: samePlanSubscription.id,
            planName: samePlanSubscription.planName,
            price: Number(price),
            currency: samePlanSubscription.currency,
            returnUrl: returnUrl || "/app",
          },
          message: "La suscripción ya está activa para este plan",
        });
      }
    }

    // A user with any other active/trialing subscription shouldn't start a
    // brand-new checkout from the marketing pricing page (that would create a
    // second, parallel subscription) — send them to in-app billing to change
    // plan instead. In-app upgrade/downgrade flows use this same endpoint
    // while a subscription is active by design, so this only applies when
    // the request came from the landing page.
    const otherActiveSubscription = allRelevantSubscriptions.find(
      (sub) => sub.status === "ACTIVE" || sub.status === "TRIALING",
    );
    if (fromLanding && otherActiveSubscription && !samePlanSubscription) {
      return NextResponse.json({
        alreadyActive: true,
        redirectUrl: "/app/billing",
        message:
          "Ya tienes una suscripción activa. Cambia de plan desde Facturación.",
      });
    }

    // Create new subscription with PENDING status (wait for payment confirmation)
    const price =
      billingCycle === "YEARLY"
        ? planConfig.price.yearly
        : planConfig.price.monthly;

    if (!price) {
      return NextResponse.json(
        { error: "Price not available for selected billing cycle" },
        { status: 400 },
      );
    }

    // ✅ For sidebar checkout: Create as TRIALING (pending payment)
    // ✅ Only activate to ACTIVE when payment is confirmed
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planType,
        planName: planConfig.name,
        status: openSidebar ? "TRIALING" : "ACTIVE", // Sidebar = pending payment, direct = active
        billingCycle: billingCycle as BillingCycle,
        startDate: new Date(),
        monthlyPrice: billingCycle === "MONTHLY" ? price : null,
        yearlyPrice: billingCycle === "YEARLY" ? price : null,
        currency: "COP",
        // Remove trial days - not needed for our business model
        trialDays: null,
        isTrialActive: false, // This tracks actual trials, not payment pending
        metadata: {
          returnUrl: returnUrl || "/app",
          activationReason: openSidebar
            ? "Pending payment confirmation"
            : "Direct activation",
          createdAt: new Date().toISOString(),
        },
        // Plan features
        hasEmailChannel: planConfig.features.hasEmailChannel,
        hasAiProcessing: planConfig.features.hasAiProcessing,
        hasChatbotChannel: planConfig.features.hasChatbotChannel,
        hasPhoneChannel: planConfig.features.hasPhoneChannel,
        maxUsers: planConfig.features.maxUsers || 1,
        maxInvestigators: planConfig.features.maxInvestigators || 5,
        maxEmployees: planConfig.features.maxEmployees || 50,
        hasExternalManager: planConfig.features.hasExternalManager || false,
        hasBilingualSupport: planConfig.features.hasBilingualSupport || false,
        hasUnlimitedUsers: planConfig.features.hasUnlimitedUsers || false,
        hasAdvancedAnalytics: planConfig.features.hasAdvancedAnalytics || false,
        hasCustomization: planConfig.features.hasCustomization || false,
        hasColorThemes: planConfig.features.hasColorThemes || false,
        hasUnlimitedCustomization:
          planConfig.features.hasUnlimitedCustomization || false,
      },
    });

    console.log("✅ Subscription created successfully:", {
      id: subscription.id,
      status: subscription.status,
      planType: subscription.planType,
    });

    // For sidebar checkout, integrate with Mercado Pago Subscriptions
    if (openSidebar) {
      try {
        console.log(
          "🔄 Preparing MercadoPago hosted checkout for sidebar checkout",
        );

        // Build absolute back URL
        const appBase =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.APP_URL ||
          "https://www.ethicvoice.co";
        // Send users back directly to the success page including our internal subscription id
        const successUrl = new URL("/app/onboarding/payment-success", appBase);
        successUrl.searchParams.set("subscription_id", String(subscription.id));
        const absoluteBackUrl = successUrl.toString();
        const useNoPlan =
          String(process.env.MP_USE_NO_PLAN || "false").toLowerCase() ===
          "true";

        if (useNoPlan) {
          // Dynamic (no associated plan) subscription
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (!user?.email) throw new Error("Missing payer email");
          const now = new Date();
          const startISO = new Date(
            now.getTime() + 60 * 60 * 1000,
          ).toISOString();
          // Convert USD plan price -> COP using live FX (fallback env)
          let copAmount = 0;
          try {
            const fx = await fetchFxRates("USD", "COP");
            const rate = Number((fx as any)?.COP || 0);
            if (Number.isFinite(rate) && rate > 0) {
              copAmount = Math.max(1, Math.round(Number(price) * rate));
            }
          } catch {}
          if (!copAmount) {
            const fallback = Number(process.env.USD_TO_COP_RATE || 4000);
            copAmount = Math.max(1, Math.round(Number(price) * fallback));
          }
          const mp = await mercadoPagoService.createPreapprovalNoPlan({
            payerEmail: user.email,
            backUrl: absoluteBackUrl,
            externalReference: String(subscription.id),
            reason: planConfig.displayName,
            // pending → MP shows hosted checkout to capture card
            status: "pending",
            autoRecurring: {
              frequency: billingCycle === "YEARLY" ? 12 : 1,
              frequencyType: "months",
              transactionAmount: copAmount,
              currencyId: "COP",
              billingDayProportional: true,
              startDate: startISO,
            },
          });
          if (!mp.success || !mp.initPoint) {
            throw new Error(mp.error || "Failed to create dynamic preapproval");
          }
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              providerSubscriptionId: mp.id || null,
              metadata: {
                ...((subscription.metadata as Record<string, unknown> | null) ??
                  {}),
                internalSubscriptionId: subscription.id.toString(),
                paymentUrl: mp.initPoint,
                activationReason:
                  "Awaiting authorization via MP dynamic subscription",
                updatedAt: new Date().toISOString(),
              },
            },
          });
          return NextResponse.json({
            subscription: {
              id: subscription.id,
              planName: subscription.planName,
              price: Number(price),
              currency: subscription.currency,
              returnUrl: absoluteBackUrl,
              paymentUrl: mp.initPoint,
            },
            message:
              "Subscription created, redirecting to MercadoPago dynamic subscription",
          });
        }

        // Plan-associated subscription (default)
        const preapprovalPlanId = mercadoPagoService.getPlanId(
          planType,
          billingCycle,
        );
        // Determine correct hosted checkout base by region/currency or env override
        const overrideBase =
          process.env.NEXT_PUBLIC_MP_CHECKOUT_BASE ||
          process.env.MP_CHECKOUT_BASE;
        const currency = "COP";
        const countryBase =
          currency === "COP"
            ? "https://www.mercadopago.com.co"
            : currency === "MXN"
              ? "https://www.mercadopago.com.mx"
              : currency === "ARS"
                ? "https://www.mercadopago.com.ar"
                : currency === "CLP"
                  ? "https://www.mercadopago.cl"
                  : currency === "PEN"
                    ? "https://www.mercadopago.com.pe"
                    : currency === "UYU"
                      ? "https://www.mercadopago.com.uy"
                      : currency === "BRL"
                        ? "https://www.mercadopago.com.br"
                        : "https://www.mercadopago.com"; // fallback

        const hostedBase = `${overrideBase || countryBase}/subscriptions/checkout`;
        const hostedUrl = `${hostedBase}?preapproval_plan_id=${encodeURIComponent(
          preapprovalPlanId,
        )}&back_url=${encodeURIComponent(absoluteBackUrl)}&external_reference=${encodeURIComponent(
          subscription.id.toString(),
        )}`;

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            metadata: {
              ...((subscription.metadata as Record<string, unknown> | null) ??
                {}),
              internalSubscriptionId: subscription.id.toString(),
              paymentUrl: hostedUrl,
              activationReason: "Awaiting authorization via MP hosted checkout",
              updatedAt: new Date().toISOString(),
            },
          },
        });

        console.log("✅ Hosted checkout URL generated", { hostedUrl });

        return NextResponse.json({
          subscription: {
            id: subscription.id,
            planName: subscription.planName,
            price: Number(price),
            currency: subscription.currency,
            returnUrl: absoluteBackUrl,
            paymentUrl: hostedUrl,
          },
          message:
            "Subscription created, redirecting to MercadoPago hosted checkout",
        });
      } catch (mpError) {
        console.error("❌ MercadoPago integration error:", mpError);

        // Delete the local subscription since MercadoPago integration failed
        await prisma.subscription.delete({
          where: { id: subscription.id },
        });

        if (mpError instanceof Error && mpError.message.includes("plan ID")) {
          return NextResponse.json(
            {
              error: "Plan configuration incomplete",
              details:
                "Configure MercadoPago preapproval plan IDs (MP_*_PLAN_ID) in env.",
            },
            { status: 500 },
          );
        }

        return NextResponse.json(
          {
            error: "Payment system unavailable",
            details:
              mpError instanceof Error ? mpError.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    }

    // For direct subscriptions (non-sidebar), just return success and let client route
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planType: subscription.planType,
        planName: subscription.planName,
        returnUrl: returnUrl || "/app",
      },
      redirect: {
        url: returnUrl || "/app",
        params: {
          payment: "success",
          subscription_id: subscription.id,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
