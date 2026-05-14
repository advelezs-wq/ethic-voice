import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import { enforcePlanLimits } from "@/modules/core/utils/plan-enforcement.utils";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { subscriptionId, newPlanType, organizationId, newBillingCycle, prorationMode } = body;

    // Resolve subscription automatically if not provided
    if (!subscriptionId) {
      if (organizationId) {
        const s = await prisma.subscription.findFirst({
          where: { orgId: organizationId },
          orderBy: { createdAt: "desc" },
        });
        subscriptionId = s?.id;
      } else {
        const s = await prisma.subscription.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        subscriptionId = s?.id;
      }
    }

    if (!subscriptionId || !newPlanType) {
      return NextResponse.json(
        { error: "Subscription ID and new plan type are required" },
        { status: 400 }
      );
    }

    console.log("🔄 [CHANGE-PLAN] Starting plan change:", {
      subscriptionId,
      newPlanType,
      organizationId,
      userId,
    });

    // Validate new plan type
    if (!PLAN_CONFIGS[newPlanType as PlanType]) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // Get the current subscription
    const currentSubscription = await prisma.subscription.findUnique({
      where: { id: parseInt(String(subscriptionId)) },
      include: {
        organization: true,
      },
    });

    if (!currentSubscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Verify user has permission to change this subscription
    if (currentSubscription.userId !== userId) {
      // Check if user is admin of the organization
      if (currentSubscription.orgId) {
        const membership = await prisma.organizationMembership.findFirst({
          where: {
            userId: userId,
            orgId: currentSubscription.orgId,
            role: "ADMIN",
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "Unauthorized to modify this subscription" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Unauthorized to modify this subscription" },
          { status: 403 }
        );
      }
    }

    // Check if it's actually a change
    if (currentSubscription.planType === newPlanType) {
      return NextResponse.json(
        { error: "Already subscribed to this plan" },
        { status: 400 }
      );
    }

    const newPlanConfig = PLAN_CONFIGS[newPlanType as PlanType];
    const currentPlanConfig =
      PLAN_CONFIGS[currentSubscription.planType as PlanType];

    console.log("📊 [CHANGE-PLAN] Plan comparison:", {
      current: {
        plan: currentSubscription.planType,
        price: currentPlanConfig?.price.monthly,
      },
      new: {
        plan: newPlanType,
        price: newPlanConfig.price.monthly,
      },
    });

    // Determine price points using selected billing cycle when provided
    const billingCycleToUse: "MONTHLY" | "YEARLY" = (newBillingCycle || (currentSubscription.billingCycle as any) || "MONTHLY") as "MONTHLY" | "YEARLY";
    // Robust current price resolution with fallbacks to PLAN_CONFIGS
    const rawMonthly = Number((currentSubscription as any).monthlyPrice ?? 0);
    const rawYearly = Number((currentSubscription as any).yearlyPrice ?? 0);
    let currentPriceToUse = (currentSubscription.billingCycle === "YEARLY" ? rawYearly : rawMonthly) || 0;
    if (!currentPriceToUse || currentPriceToUse <= 0) {
      const fallback = currentSubscription.billingCycle === "YEARLY"
        ? Number(PLAN_CONFIGS[currentSubscription.planType as PlanType]?.price?.yearly || 0)
        : Number(PLAN_CONFIGS[currentSubscription.planType as PlanType]?.price?.monthly || 0);
      currentPriceToUse = fallback;
    }
    const newPriceToUse = billingCycleToUse === "YEARLY"
      ? Number(newPlanConfig.price.yearly || 0)
      : Number(newPlanConfig.price.monthly || 0);

    // Determine if this is an upgrade or downgrade
    const isUpgrade = newPriceToUse > currentPriceToUse;
    const isDowngrade = newPriceToUse < currentPriceToUse;

    console.log("🎯 [CHANGE-PLAN] Change type:", {
      isUpgrade,
      isDowngrade,
      priceChange:
        newPlanConfig.price.monthly - (currentPlanConfig?.price.monthly || 0),
      billingCycleToUse,
      currentPriceToUse,
      newPriceToUse,
    });

    // For upgrades, we might need to redirect to Mercado Pago authorization
    // For downgrades, we can handle immediately with plan enforcement

    let paymentUrl = null;
    let requiresPayment = false;

    // Estimate proration based on remaining days of current cycle (robust)
    let prorationAmount = 0;
    try {
      const now = new Date();
      let cycleStart: Date | undefined;
      let cycleEnd: Date | undefined;

      // Prefer provider next payment date when available
      if (currentSubscription.providerSubscriptionId) {
        try {
          const pre = await mercadoPagoService.getPreapproval(
            String(currentSubscription.providerSubscriptionId)
          );
          const nextPayment = pre?.next_payment_date || pre?.auto_recurring?.next_payment_date;
          if (nextPayment) {
            cycleEnd = new Date(nextPayment);
          }
        } catch {
          // ignore provider lookup errors and fallback to local calc
        }
      }

      if (!cycleEnd) {
        // Derive cycleEnd from startDate + cycle
        const start = new Date(currentSubscription.startDate || now);
        // Find the current period start by advancing from start date until now
        const stepMonths = (currentSubscription.billingCycle as string) === "YEARLY" ? 12 : 1;
        cycleStart = new Date(start);
        while ((cycleStart as Date).getTime() <= now.getTime()) {
          const temp: Date = new Date(cycleStart as Date);
          temp.setMonth(temp.getMonth() + stepMonths);
          if (temp.getTime() > now.getTime()) {
            cycleEnd = temp;
            break;
          }
          cycleStart = temp;
        }
        if (!cycleEnd) {
          // Fallback: one full period from now
          const startFallback = new Date(now);
          startFallback.setMonth(startFallback.getMonth() - stepMonths);
          cycleStart = startFallback;
          cycleEnd = new Date(now);
        }
      } else {
        // If we only had cycleEnd from provider, derive start as one period before
        cycleStart = new Date(cycleEnd);
        if ((currentSubscription.billingCycle as string) === "YEARLY") {
          cycleStart.setFullYear(cycleStart.getFullYear() - 1);
        } else {
          cycleStart.setMonth(cycleStart.getMonth() - 1);
        }
      }

      const totalMs = Math.max(1, (cycleEnd as Date).getTime() - (cycleStart as Date).getTime());
      const remainingMs = Math.max(0, (cycleEnd as Date).getTime() - now.getTime());
      const remainingRatio = Math.min(1, Math.max(0, remainingMs / totalMs));
      const remainingValue = currentPriceToUse * remainingRatio;
      prorationAmount = Math.max(0, Math.round(newPriceToUse - remainingValue));
    } catch (e) {
      prorationAmount = Math.max(0, newPriceToUse - currentPriceToUse);
    }

    // Read existing credit balance from metadata (COP)
    const existingMetadata = (currentSubscription.metadata as Record<string, unknown> | null) ?? {};
    const credits = (existingMetadata as any)?.credits || {};
    const currentCreditBalance: number = Number(credits.balance || 0);

    // Support estimate-only mode to preview proration without applying changes
    const estimateOnly = Boolean((await req.json().catch(() => ({} as any))).estimate);
    if (estimateOnly) {
      const amountToCharge = Math.max(0, prorationAmount - currentCreditBalance);
      return NextResponse.json({
        success: true,
        estimate: {
          isUpgrade,
          isDowngrade,
          prorationAmount,
          amountToCharge,
          nextCycleAmount: newPriceToUse,
          currency: newPlanConfig.price.currency,
          credits: { currentBalance: currentCreditBalance },
        },
      });
    }

    if (isUpgrade) {
      console.log("⬆️ [CHANGE-PLAN] Processing upgrade - proration immediate charge + update preapproval");
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const useNoPlan = String(process.env.MP_USE_NO_PLAN || "false").toLowerCase() === "true";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://www.ethicvoice.co";

        // 1) NO actualizamos el preapproval todavía. Dejamos el cambio como pendiente
        //    y lo aplicamos en el webhook al recibir el pago aprobado para el prorrateo.

        // 2) Apply existing credits to proration
        let amountToCharge = Math.max(0, prorationAmount - currentCreditBalance);
        let newCreditBalance = Math.max(0, currentCreditBalance - prorationAmount);

        // 3) Create a one-time checkout preference for the remaining prorated difference (if any)
        if (amountToCharge > 0) {
          // Safety: never charge above the new plan price (should not happen, but cap it)
          amountToCharge = Math.min(amountToCharge, newPriceToUse);
          const preference = await mercadoPagoService.createCheckoutPreference({
            payerEmail: user.email,
            amount: Math.max(1, Math.round(amountToCharge)),
            currencyId: newPlanConfig.price.currency,
            title: `Prorrateo cambio de plan a ${newPlanConfig.displayName}`,
            externalReference: String(currentSubscription.id),
            backUrls: {
              success: `${appUrl}/app/onboarding/payment-success`,
              pending: `${appUrl}/app/onboarding/payment-success`,
              failure: `${appUrl}/app/onboarding/payment-success`,
            },
            metadata: {
              subscriptionId: currentSubscription.id,
              newPlanType,
              newBillingCycle: billingCycleToUse,
              prorationAmount,
            },
          });
          if (!preference.success || !preference.initPoint) {
            return NextResponse.json(
              { error: "Failed to create proration payment" },
              { status: 500 }
            );
          }
          paymentUrl = preference.initPoint;
          requiresPayment = true;
        } else {
          // Covered fully by credits
          console.log("💳 [CHANGE-PLAN] Upgrade proration fully covered by credits", {
            prorationAmount,
            currentCreditBalance,
          });
        }

        // Update local subscription: solo marcamos cambio pendiente
        await prisma.subscription.update({
          where: { id: currentSubscription.id },
          data: {
            metadata: {
              ...(currentSubscription.metadata as Record<string, unknown>),
              lastPlanChange: new Date().toISOString(),
              prorationAmount,
              changeType: "upgrade",
              pendingPayment: requiresPayment,
              pendingChange: {
                type: "upgrade",
                newPlanType,
                newPlanName: newPlanConfig.displayName,
                newBillingCycle: billingCycleToUse,
                newMonthlyPrice: billingCycleToUse === "MONTHLY" ? newPlanConfig.price.monthly : null,
                newYearlyPrice: billingCycleToUse === "YEARLY" ? (newPlanConfig.price.yearly || null) : null,
                createdAt: new Date().toISOString(),
              },
              credits: {
                balance: Math.max(0, (requiresPayment ? Math.max(0, currentCreditBalance - prorationAmount) : Math.max(0, currentCreditBalance - prorationAmount))),
                lastDelta: requiresPayment ? -Math.min(currentCreditBalance, prorationAmount) : -Math.min(currentCreditBalance, prorationAmount),
                updatedAt: new Date().toISOString(),
                lastReason: "upgrade_proration_consumed",
              },
            } as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
        });
      } catch (upgradeError) {
        console.error("❌ [CHANGE-PLAN] Upgrade error:", upgradeError);
        return NextResponse.json({ error: "Failed to process upgrade" }, { status: 500 });
      }
    } else if (isDowngrade) {
      // Handle downgrade immediately
      console.log("⬇️ [CHANGE-PLAN] Processing downgrade");

      // Compute credit for remaining period: difference between current and new plan for remaining days
      let downgradeCredit = 0;
      try {
        const now = new Date();
        let cycleStart: Date | undefined;
        let cycleEnd: Date | undefined;
        if (currentSubscription.providerSubscriptionId) {
          try {
            const pre = await mercadoPagoService.getPreapproval(String(currentSubscription.providerSubscriptionId));
            const nextPayment = pre?.next_payment_date || pre?.auto_recurring?.next_payment_date;
            if (nextPayment) cycleEnd = new Date(nextPayment);
          } catch {}
        }
        if (!cycleEnd) {
          const stepMonths = (currentSubscription.billingCycle as string) === "YEARLY" ? 12 : 1;
          const start = new Date(currentSubscription.startDate || now);
          cycleStart = new Date(start);
          while ((cycleStart as Date).getTime() <= now.getTime()) {
            const t: Date = new Date(cycleStart as Date);
            t.setMonth(t.getMonth() + stepMonths);
            if (t.getTime() > now.getTime()) { cycleEnd = t; break; }
            cycleStart = t;
          }
          if (!cycleEnd) {
            const sf = new Date(now); sf.setMonth(sf.getMonth() - stepMonths);
            cycleStart = sf; cycleEnd = new Date(now);
          }
        } else {
          cycleStart = new Date(cycleEnd);
          if ((currentSubscription.billingCycle as string) === "YEARLY") {
            cycleStart.setFullYear(cycleStart.getFullYear() - 1);
          } else {
            cycleStart.setMonth(cycleStart.getMonth() - 1);
          }
        }
        const totalMs = Math.max(1, (cycleEnd as Date).getTime() - (cycleStart as Date).getTime());
        const remainingMs = Math.max(0, (cycleEnd as Date).getTime() - now.getTime());
        const remainingRatio = Math.min(1, Math.max(0, remainingMs / totalMs));
        const valueCurrentRemaining = currentPriceToUse * remainingRatio;
        const valueNewRemaining = newPriceToUse * remainingRatio;
        downgradeCredit = Math.max(0, Math.round(valueCurrentRemaining - valueNewRemaining));
      } catch {}

      // Optional immediate refund threshold (COP)
      const refundThreshold = Number(process.env.MP_DOWNGRADE_REFUND_THRESHOLD || 0);
      let refundNow = 0;

      // Update current subscription to new plan
      const updatedSubscription = await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          planType: newPlanType,
          planName: newPlanConfig.displayName,
          billingCycle: billingCycleToUse,
          monthlyPrice: billingCycleToUse === "MONTHLY" ? newPlanConfig.price.monthly : null,
          yearlyPrice: billingCycleToUse === "YEARLY" ? (newPlanConfig.price.yearly || null) : null,

          // Update plan features
          hasEmailChannel: newPlanConfig.features.hasEmailChannel,
          hasAiProcessing: newPlanConfig.features.hasAiProcessing,
          hasChatbotChannel: newPlanConfig.features.hasChatbotChannel,
          hasPhoneChannel: newPlanConfig.features.hasPhoneChannel,
          hasAdvancedAnalytics: newPlanConfig.features.hasAdvancedAnalytics,
          hasColorThemes: newPlanConfig.features.hasColorThemes,
          hasCustomization: newPlanConfig.features.hasCustomization,
          hasBilingualSupport: newPlanConfig.features.hasBilingualSupport,
          hasExternalManager: newPlanConfig.features.hasExternalManager,
          hasUnlimitedUsers: newPlanConfig.features.hasUnlimitedUsers,

          maxUsers: newPlanConfig.features.maxUsers,
          maxInvestigators: newPlanConfig.features.maxInvestigators,
          maxEmployees: newPlanConfig.features.maxEmployees,

          updatedAt: new Date(),
          metadata: {
            ...(currentSubscription.metadata as Record<string, unknown>),
            lastPlanChange: new Date().toISOString(),
            changeType: "downgrade",
            credits: {
              balance: Number(currentCreditBalance + downgradeCredit),
              lastDelta: downgradeCredit,
              updatedAt: new Date().toISOString(),
              lastReason: "downgrade_credit_added",
            },
          } as Prisma.InputJsonValue,
        },
      });

      // Update organization with new plan features
      if (currentSubscription.orgId) {
        await prisma.organization.update({
          where: { id: currentSubscription.orgId },
          data: {
            currentPlan: newPlanType,

            // Update feature flags
            isEmailChannelActive: newPlanConfig.features.hasEmailChannel,
            isAiProcessingActive: newPlanConfig.features.hasAiProcessing,
            isChatbotActive: newPlanConfig.features.hasChatbotChannel,
            isPhoneChannelActive: newPlanConfig.features.hasPhoneChannel,
          },
        });

        // Enforce new plan limits (this will block excess users)
        console.log("🛡️ [CHANGE-PLAN] Enforcing new plan limits for downgrade");
        try {
          const enforcementResult = await enforcePlanLimits(
            currentSubscription.orgId,
            userId
          );
          console.log("✅ [CHANGE-PLAN] Plan limits enforced:", {
            blockedUsers: enforcementResult.blockedUsers.length,
            unblockedUsers: enforcementResult.unblockedUsers.length,
          });
        } catch (enforcementError) {
          console.error(
            "❌ [CHANGE-PLAN] Plan enforcement error:",
            enforcementError
          );
          // Don't fail the downgrade if enforcement fails
        }
      }

      // Provider subscription update to reflect new plan
      if (currentSubscription.providerSubscriptionId) {
        try {
          const newPlanId = mercadoPagoService.getPlanId(newPlanType, billingCycleToUse);
          await mercadoPagoService.updatePreapproval(currentSubscription.providerSubscriptionId, {
            preapproval_plan_id: newPlanId,
            status: "authorized",
          });
        } catch (e) {
          console.warn("⚠️ [CHANGE-PLAN] Failed to update provider preapproval on downgrade", e);
        }
      }

      // If downgrade credit is large, attempt an immediate partial refund of last payment (optional)
      if (
        refundThreshold > 0 &&
        downgradeCredit >= refundThreshold &&
        currentSubscription.providerSubscriptionId
      ) {
        try {
          const search = await mercadoPagoService.searchAuthorizedPayments(String(currentSubscription.providerSubscriptionId));
          const approved = (search.results || []).filter((r: any) => r.status === "approved").sort((a: any, b: any) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
          const last = approved[0];
          if (last?.id) {
            const refundAmount = Math.min(Number(downgradeCredit), Number(last.transaction_amount || 0));
            if (refundAmount > 0) {
              const r = await mercadoPagoService.refundPayment(String(last.id), refundAmount);
              if (r.success) {
                refundNow = refundAmount;
                // reduce credit balance by refunded amount
                await prisma.subscription.update({
                  where: { id: currentSubscription.id },
                  data: {
                    metadata: {
                      ...(updatedSubscription.metadata as any),
                      credits: {
                        balance: Math.max(0, Number(currentCreditBalance + downgradeCredit - refundAmount)),
                        lastDelta: -refundAmount,
                        updatedAt: new Date().toISOString(),
                        lastReason: "downgrade_immediate_refund",
                      },
                    } as any,
                  },
                });
                // Record refund
                if (currentSubscription.orgId) {
                  await prisma.paymentTransaction.create({
                    data: {
                      orgId: currentSubscription.orgId,
                      subscriptionId: currentSubscription.id,
                      userId: currentSubscription.userId,
                      amount: refundAmount,
                      currency: currentSubscription.currency || "COP",
                      status: "REFUNDED",
                      gateway: "OTHER",
                      providerTransactionId: String(r.id || last.id),
                    },
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn("⚠️ [CHANGE-PLAN] Immediate refund attempt failed", e);
        }
      }

      // Create transaction record for the downgrade
      try {
        await prisma.paymentTransaction.create({
          data: {
            orgId: currentSubscription.orgId || "",
            subscriptionId: currentSubscription.id,
            amount: newPriceToUse,
            currency: currentSubscription.currency || "COP",
            status: "SUCCEEDED",
            gateway: "OTHER",
            providerTransactionId: `downgrade-${currentSubscription.id}-${Date.now()}`,
            userId: userId,
          },
        });
      } catch (transactionError) {
        console.error(
          "❌ [CHANGE-PLAN] Failed to create downgrade record:",
          transactionError
        );
        // Don't fail the main operation
      }

      console.log("✅ [CHANGE-PLAN] Downgrade completed successfully", { refundNow });
    }

    return NextResponse.json({
      success: true,
      message: isUpgrade
        ? "Upgrade initiated. Complete payment to activate new plan."
        : "Plan downgrade completed successfully.",
      changeType: isUpgrade ? "upgrade" : "downgrade",
      subscription: {
        id: currentSubscription.id,
        previousPlan: currentSubscription.planType,
        newPlan: newPlanType,
        status: requiresPayment ? "PENDING_PAYMENT" : "ACTIVE",
      },
      payment: requiresPayment
        ? {
            required: true,
            paymentUrl: paymentUrl,
            message: "Redirect to complete payment for upgrade",
            prorationAmount,
          }
        : null,
      planChange: {
        previousPlan: {
          type: currentSubscription.planType,
          name: currentPlanConfig?.displayName || currentSubscription.planType,
          price: currentPriceToUse,
        },
        newPlan: {
          type: newPlanType,
          name: newPlanConfig.displayName,
          price: newPriceToUse,
        },
        priceDifference: newPriceToUse - currentPriceToUse,
        prorationAmount,
      },
    });
  } catch (error) {
    console.error("❌ [CHANGE-PLAN] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
