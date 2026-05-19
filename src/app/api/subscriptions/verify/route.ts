import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import {
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
} from "@/types/subscription.types";

async function updateOrganizationPlanFeatures(orgId: string, planType: string) {
  // Implementation for updating organization plan features
  // This would typically update the organization record with plan-specific features
  console.log(`Updating organization ${orgId} with plan ${planType} features`);
}

export async function POST(req: NextRequest) {
  console.log("🔍 Verifying subscription...");

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}) as any);
    let subscriptionId: number | undefined = body.subscriptionId
      ? parseInt(String(body.subscriptionId), 10)
      : undefined;
    const preapprovalId: string | undefined =
      body.preapprovalId || body.preapproval_id || undefined;
    const paymentId: string | undefined =
      body.paymentId || body.payment_id || undefined;

    if (!subscriptionId) {
      console.warn(
        "No subscriptionId provided; will try to resolve from preapprovalId or user context",
      );
    }

    console.log("📊 Verification request:", {
      subscriptionId,
      preapprovalId,
      userId,
    });

    // If paymentId is provided, resolve by payment → external_reference or preapproval linkage
    if (paymentId && !preapprovalId) {
      try {
        const payment = await mercadoPagoService.getPayment(String(paymentId));
        // Prefer external_reference for our internal subscription id
        const ext =
          payment?.external_reference || payment?.metadata?.external_reference;
        if (ext) {
          const parsed = parseInt(String(ext), 10);
          if (Number.isFinite(parsed)) subscriptionId = parsed;
        }
        // Try get preapproval id from payment to verify status downstream
        if (payment?.preapproval_id) {
          (body as any)._resolvedPreapprovalIdFromPayment = String(
            payment.preapproval_id,
          );
        }
        // If we still don't have subscriptionId, attempt by preapproval lookup
        if (!subscriptionId && payment?.preapproval_id) {
          try {
            const pre = await mercadoPagoService.getPreapproval(
              String(payment.preapproval_id),
            );
            const sid = parseInt(String(pre?.external_reference), 10);
            if (Number.isFinite(sid)) subscriptionId = sid;
          } catch {}
        }
      } catch (e) {
        console.warn(
          "⚠️ Could not fetch payment from MercadoPago during verify POST",
          e,
        );
      }
    }

    // If preapprovalId is provided, fetch preapproval and resolve internal subscription id
    if (preapprovalId) {
      try {
        const pre = await mercadoPagoService.getPreapproval(preapprovalId);
        const internalId = parseInt(String(pre?.external_reference), 10);
        if (!Number.isFinite(internalId)) {
          return NextResponse.json(
            { error: "Invalid external_reference in preapproval" },
            { status: 400 },
          );
        }
        const subscription = await prisma.subscription.findUnique({
          where: { id: internalId },
          include: { organization: true },
        });
        if (!subscription) {
          return NextResponse.json(
            { error: "Subscription not found" },
            { status: 404 },
          );
        }

        const updates: any = {
          providerSubscriptionId: pre.id,
          updatedAt: new Date(),
          metadata: {
            ...((subscription.metadata as Record<string, unknown> | null) ??
              {}),
            mpPreapproval: {
              id: pre.id,
              status: pre.status,
              payer: pre.payer_email,
              plan: pre.preapproval_plan_id,
            },
            verifiedAt: new Date().toISOString(),
          },
        };
        if (pre.status === "authorized") updates.status = "ACTIVE";
        else if (pre.status === "paused") updates.status = "PAST_DUE";
        else if (pre.status === "cancelled") updates.status = "CANCELED";

        const updated = await prisma.subscription.update({
          where: { id: subscription.id },
          data: updates,
          include: { organization: true },
        });

        if (updated.organization) {
          try {
            await updateOrganizationPlanFeatures(
              updated.organization.id,
              updated.planType,
            );
          } catch {}
        }

        return NextResponse.json({
          success: true,
          status: updated.status,
          subscription: {
            id: updated.id,
            planType: updated.planType,
            status: updated.status,
            organizationId: updated.orgId,
          },
        });
      } catch (e) {
        console.error("❌ Error verifying MP preapproval:", e);
        return NextResponse.json(
          { error: "Failed to verify MercadoPago preapproval" },
          { status: 500 },
        );
      }
    }

    // Legacy + user-context fallback: if no identifiers, use user's most recent subscription
    if (!subscriptionId) {
      if (userId) {
        const recent = await prisma.subscription.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        if (recent) {
          subscriptionId = recent.id;
          console.log("ℹ️ Using most recent subscription by user context", {
            subscriptionId,
          });
        }
      }
      if (!subscriptionId) {
        return NextResponse.json(
          { error: "Subscription ID or preapprovalId is required" },
          { status: 400 },
        );
      }
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { organization: true },
    });

    if (!subscription) {
      console.error("❌ Subscription not found in database:", subscriptionId);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    console.log("✅ Found subscription in database:", {
      id: subscription.id,
      status: subscription.status,
      userId: subscription.userId,
      orgId: subscription.orgId,
      providerSubscriptionId: subscription.providerSubscriptionId,
    });

    // Enforce ownership: user must own subscription or be ADMIN of the org.
    if (subscription.userId !== userId) {
      if (!subscription.orgId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId,
          orgId: subscription.orgId,
          role: "ADMIN",
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // If subscription is already active, return success
    if (subscription.status === "ACTIVE") {
      console.log("✅ Subscription already active");
      return NextResponse.json({
        success: true,
        status: "ACTIVE",
        message: "Subscription is already active",
        subscription: {
          id: subscription.id,
          planType: subscription.planType,
          status: subscription.status,
          organizationId: subscription.orgId,
        },
      });
    }

    // Without provider/preapproval confirmation we do not auto-activate.
    // Activation must come from verified preapproval/payment state.
    let shouldActivate = false;

    // If we do have a providerSubscriptionId but status still TRIALING, attempt live fetch to update
    if (!shouldActivate && subscription.providerSubscriptionId) {
      try {
        const pre = await mercadoPagoService.getPreapproval(
          String(subscription.providerSubscriptionId),
        );
        const updates: any = {
          updatedAt: new Date(),
          metadata: {
            ...((subscription.metadata as Record<string, unknown> | null) ??
              {}),
            mpPreapproval: {
              id: pre.id,
              status: pre.status,
              payer: pre.payer_email,
              plan: pre.preapproval_plan_id,
            },
            verifiedAt: new Date().toISOString(),
          },
        };
        if (pre.status === "authorized") updates.status = "ACTIVE";
        else if (pre.status === "paused") updates.status = "PAST_DUE";
        else if (pre.status === "cancelled") updates.status = "CANCELED";

        const updated = await prisma.subscription.update({
          where: { id: subscription.id },
          data: updates,
          include: { organization: true },
        });

        return NextResponse.json({
          success: true,
          status: updated.status,
          subscription: {
            id: updated.id,
            planType: updated.planType,
            status: updated.status,
            organizationId: updated.orgId,
          },
        });
      } catch (e) {
        console.warn(
          "⚠️ Live preapproval fetch failed in POST verify fallback",
          e,
        );
      }
    }

    if (shouldActivate) {
      // Reserved for future trusted/manual backoffice activation flows.
    }

    // If we reach this point, something went wrong
    console.log("❌ Could not verify subscription");
    return NextResponse.json({
      success: false,
      status: subscription.status,
      message: "Could not verify subscription payment",
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        organizationId: subscription.orgId,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const preapprovalId =
      url.searchParams.get("preapproval_id") || url.searchParams.get("id");
    const subscriptionIdFromQuery = url.searchParams.get("subscription_id");
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!preapprovalId) {
      return NextResponse.json(
        { error: "preapproval_id is required" },
        { status: 400 },
      );
    }

    // Fetch Mercado Pago preapproval and resolve internal subscription id
    const pre = await mercadoPagoService.getPreapproval(preapprovalId);

    // Try to resolve internal subscription id from multiple sources
    let internalId: number | undefined = undefined;

    // 1) Preferred: external_reference from Mercado Pago
    const extRef = pre?.external_reference;
    if (extRef != null) {
      const parsed = parseInt(String(extRef), 10);
      if (Number.isFinite(parsed)) internalId = parsed;
    }

    // 2) Fallback: match by providerSubscriptionId (preapproval id already stored)
    if (!internalId && pre?.id) {
      const byProvider = await prisma.subscription.findFirst({
        where: { providerSubscriptionId: String(pre.id) },
        orderBy: { createdAt: "desc" },
      });
      if (byProvider) internalId = byProvider.id;
    }

    // 3) Fallback: subscription_id passed back in the URL
    if (!internalId && subscriptionIdFromQuery) {
      const parsed = parseInt(String(subscriptionIdFromQuery), 10);
      if (Number.isFinite(parsed)) internalId = parsed;
    }

    // 4) Fallback: most recent TRIALING subscription for the logged-in user
    if (!internalId && userId) {
      const recent = await prisma.subscription.findFirst({
        where: { userId, status: "TRIALING" },
        orderBy: { createdAt: "desc" },
      });
      if (recent) internalId = recent.id;
    }

    // 5) Last-resort: find TRIALING subscription whose metadata.paymentUrl contains this preapproval plan id
    if (!internalId) {
      const planIdFromPreapproval: string | undefined =
        pre?.preapproval_plan_id;
      if (planIdFromPreapproval) {
        const candidates = await prisma.subscription.findMany({
          where: { status: "TRIALING" },
          orderBy: { createdAt: "desc" },
          take: 10,
        });
        const matched = candidates.find((s) => {
          const md = (s.metadata as Record<string, unknown> | null) ?? null;
          const url =
            typeof md?.paymentUrl === "string"
              ? (md.paymentUrl as string)
              : undefined;
          return url
            ? url.includes(encodeURIComponent(planIdFromPreapproval)) ||
                url.includes(planIdFromPreapproval)
            : false;
        });
        if (matched) internalId = matched.id;
      }
    }

    // 6) Reverse-map by preapproval_plan_id to planType/billingCycle and pick most recent TRIALING without provider id
    let matchedPlan:
      | { planType: string; billingCycle: "MONTHLY" | "YEARLY" }
      | undefined;
    if (!internalId && pre?.preapproval_plan_id) {
      const combos: Array<{
        planType: string;
        billingCycle: "MONTHLY" | "YEARLY";
      }> = [
        { planType: "STARTER", billingCycle: "MONTHLY" },
        { planType: "STARTER", billingCycle: "YEARLY" },
        { planType: "GROW", billingCycle: "MONTHLY" },
        { planType: "GROW", billingCycle: "YEARLY" },
        { planType: "GROW_PRO", billingCycle: "MONTHLY" },
        { planType: "GROW_PRO", billingCycle: "YEARLY" },
        { planType: "PREMIUM", billingCycle: "MONTHLY" },
        { planType: "PREMIUM", billingCycle: "YEARLY" },
      ];

      for (const c of combos) {
        try {
          const id = mercadoPagoService.getPlanId(c.planType, c.billingCycle);
          if (id && id === pre.preapproval_plan_id) {
            matchedPlan = c;
            break;
          }
        } catch {}
      }

      if (matchedPlan) {
        const recent = await prisma.subscription.findFirst({
          where: {
            status: "TRIALING",
            planType: matchedPlan.planType as any,
            billingCycle: matchedPlan.billingCycle as any,
            providerSubscriptionId: null,
          },
          orderBy: { createdAt: "desc" },
        });
        if (recent) internalId = recent.id;
      }
    }

    if (!internalId) {
      // As a last resort, if we can infer the plan and we have a user, create/link a subscription now
      if (matchedPlan && userId) {
        const planCfg = PLAN_CONFIGS[matchedPlan.planType as PlanType];
        const price =
          matchedPlan.billingCycle === "YEARLY"
            ? planCfg.price.yearly
            : planCfg.price.monthly;
        const currency = planCfg.price.currency;
        const status =
          pre.status === "authorized"
            ? "ACTIVE"
            : pre.status === "paused"
              ? "PAST_DUE"
              : pre.status === "cancelled"
                ? "CANCELED"
                : "TRIALING";

        const created = await prisma.subscription.create({
          data: {
            userId,
            planType: matchedPlan.planType as any,
            planName: planCfg.name,
            status,
            billingCycle: matchedPlan.billingCycle as BillingCycle,
            startDate: new Date(),
            monthlyPrice: matchedPlan.billingCycle === "MONTHLY" ? price : null,
            yearlyPrice: matchedPlan.billingCycle === "YEARLY" ? price : null,
            currency,
            trialDays: null,
            isTrialActive: false,
            providerSubscriptionId: pre.id,
            metadata: {
              verifiedAt: new Date().toISOString(),
              mpPreapproval: {
                id: pre.id,
                status: pre.status,
                payer: pre.payer_email,
                plan: pre.preapproval_plan_id,
              },
              activationReason: "Auto-linked via MP preapproval fallback",
            },
            hasEmailChannel: planCfg.features.hasEmailChannel,
            hasAiProcessing: planCfg.features.hasAiProcessing,
            hasChatbotChannel: planCfg.features.hasChatbotChannel,
            hasPhoneChannel: planCfg.features.hasPhoneChannel,
            maxUsers: planCfg.features.maxUsers || 1,
            maxInvestigators: planCfg.features.maxInvestigators || 5,
            maxEmployees: planCfg.features.maxEmployees || 50,
            hasExternalManager: planCfg.features.hasExternalManager || false,
            hasBilingualSupport: planCfg.features.hasBilingualSupport || false,
            hasUnlimitedUsers: planCfg.features.hasUnlimitedUsers || false,
            hasAdvancedAnalytics:
              planCfg.features.hasAdvancedAnalytics || false,
            hasCustomization: planCfg.features.hasCustomization || false,
            hasColorThemes: planCfg.features.hasColorThemes || false,
            hasUnlimitedCustomization:
              planCfg.features.hasUnlimitedCustomization || false,
          },
          include: { organization: true },
        });

        if (created.organization) {
          try {
            await updateOrganizationPlanFeatures(
              created.organization.id,
              created.planType,
            );
          } catch {}
        }

        return NextResponse.json({
          success: true,
          status: created.status,
          subscription: {
            id: created.id,
            planType: created.planType,
            status: created.status,
            organizationId: created.orgId,
          },
        });
      }

      return NextResponse.json(
        { error: "Invalid external_reference in preapproval" },
        { status: 400 },
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: internalId },
      include: { organization: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    // Enforce ownership: user must own subscription or be ADMIN of the org.
    if (subscription.userId !== userId) {
      if (!subscription.orgId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId,
          orgId: subscription.orgId,
          role: "ADMIN",
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updates: any = {
      providerSubscriptionId: pre.id,
      updatedAt: new Date(),
      metadata: {
        ...((subscription.metadata as Record<string, unknown> | null) ?? {}),
        mpPreapproval: {
          id: pre.id,
          status: pre.status,
          payer: pre.payer_email,
          plan: pre.preapproval_plan_id,
        },
        verifiedAt: new Date().toISOString(),
      },
    };

    if (pre.status === "authorized") updates.status = "ACTIVE";
    else if (pre.status === "paused") updates.status = "PAST_DUE";
    else if (pre.status === "cancelled") updates.status = "CANCELED";

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: updates,
      include: { organization: true },
    });

    if (updated.organization) {
      try {
        await updateOrganizationPlanFeatures(
          updated.organization.id,
          updated.planType,
        );
      } catch {}
    }

    return NextResponse.json({
      success: true,
      status: updated.status,
      subscription: {
        id: updated.id,
        planType: updated.planType,
        status: updated.status,
        organizationId: updated.orgId,
      },
    });
  } catch (e) {
    console.error("❌ Error verifying MP preapproval (GET):", e);
    return NextResponse.json(
      { error: "Failed to verify MercadoPago preapproval" },
      { status: 500 },
    );
  }
}
