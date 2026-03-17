import prisma from "@/modules/prisma/lib/prisma";
import type { Prisma } from "@prisma/client";
import rebillService from "./rebill.service";
import {
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
} from "@/types/subscription.types";
import { clerkClient } from "@clerk/nextjs/server";

export interface SubscriptionChangeRequest {
  subscriptionId: number;
  newPlanType: PlanType;
  newBillingCycle?: BillingCycle;
  effectiveDate?: Date;
  prorationMode?: "immediate" | "next_cycle";
}

export interface SubscriptionChangeResult {
  success: boolean;
  subscription?: any;
  prorationAmount?: number;
  nextBillingDate?: Date;
  error?: string;
}

export interface CancellationRequest {
  subscriptionId: number;
  reason?: string;
  effectiveDate?: Date;
  cancelMode?: "immediate" | "end_of_period";
}

export interface CancellationResult {
  success: boolean;
  subscription?: any;
  refundAmount?: number;
  effectiveDate?: Date;
  error?: string;
}

class SubscriptionManagerService {
  // ✅ Upgrade/Downgrade subscription
  async changeSubscriptionPlan(
    request: SubscriptionChangeRequest
  ): Promise<SubscriptionChangeResult> {
    try {
      console.log("🔄 Processing subscription plan change:", {
        subscriptionId: request.subscriptionId,
        newPlan: request.newPlanType,
        newBilling: request.newBillingCycle,
      });

      // Get current subscription
      const currentSubscription = await prisma.subscription.findUnique({
        where: { id: request.subscriptionId },
        include: { organization: true, paymentTransactions: true },
      });

      if (!currentSubscription) {
        return { success: false, error: "Subscription not found" };
      }

      if (currentSubscription.status !== "ACTIVE") {
        return {
          success: false,
          error: "Can only change active subscriptions",
        };
      }

      // Get new plan configuration
      const newPlanConfig = PLAN_CONFIGS[request.newPlanType];
      if (!newPlanConfig) {
        return { success: false, error: "Invalid plan type" };
      }

      const newBillingCycle: BillingCycle = (request.newBillingCycle ||
        (currentSubscription.billingCycle as unknown)) as BillingCycle;
      const newPrice =
        newBillingCycle === "YEARLY"
          ? newPlanConfig.price.yearly
          : newPlanConfig.price.monthly;

      if (!newPrice) {
        return {
          success: false,
          error: "Price not available for selected billing cycle",
        };
      }

      // Calculate proration if immediate change
      let prorationAmount = 0;
      let nextBillingDate = currentSubscription.endDate || new Date();

      if (request.prorationMode === "immediate") {
        prorationAmount = await this.calculateProration(
          currentSubscription,
          newPlanConfig,
          newBillingCycle as BillingCycle
        );
        nextBillingDate = new Date();
        if (newBillingCycle === "YEARLY") {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
      }

      // Prepare safe metadata merges
      const existingMetadataForPlanChange =
        currentSubscription.metadata &&
        typeof currentSubscription.metadata === "object" &&
        !Array.isArray(currentSubscription.metadata)
          ? (currentSubscription.metadata as Record<string, unknown>)
          : {};
      const existingPlanChangeHistory: Prisma.JsonArray = Array.isArray(
        (existingMetadataForPlanChange as any).planChangeHistory
      )
        ? (((existingMetadataForPlanChange as any).planChangeHistory as unknown[]) as Prisma.JsonArray)
        : ([] as unknown as Prisma.JsonArray);

      // Update subscription in database
      const updatedSubscription = await prisma.subscription.update({
        where: { id: request.subscriptionId },
        data: {
          planType: request.newPlanType,
          planName: newPlanConfig.name,
          billingCycle: newBillingCycle,
          monthlyPrice: newBillingCycle === "MONTHLY" ? newPrice : null,
          yearlyPrice: newBillingCycle === "YEARLY" ? newPrice : null,
          endDate: nextBillingDate,

          // Update plan features
          hasEmailChannel: newPlanConfig.features.hasEmailChannel,
          hasAiProcessing: newPlanConfig.features.hasAiProcessing,
          hasChatbotChannel: newPlanConfig.features.hasChatbotChannel,
          hasPhoneChannel: newPlanConfig.features.hasPhoneChannel,
          maxUsers: newPlanConfig.features.maxUsers || 1,
          maxInvestigators: newPlanConfig.features.maxInvestigators || 5,
          maxEmployees: newPlanConfig.features.maxEmployees || 50,
          hasExternalManager:
            newPlanConfig.features.hasExternalManager || false,
          hasBilingualSupport:
            newPlanConfig.features.hasBilingualSupport || false,
          hasUnlimitedUsers: newPlanConfig.features.hasUnlimitedUsers || false,
          hasAdvancedAnalytics:
            newPlanConfig.features.hasAdvancedAnalytics || false,
          hasCustomization: newPlanConfig.features.hasCustomization || false,
          hasColorThemes: newPlanConfig.features.hasColorThemes || false,
          hasUnlimitedCustomization:
            newPlanConfig.features.hasUnlimitedCustomization || false,

          updatedAt: new Date(),
          metadata: {
            ...existingMetadataForPlanChange,
            planChangeHistory: [
              ...existingPlanChangeHistory,
              {
                fromPlan: currentSubscription.planType,
                toPlan: request.newPlanType,
                fromBilling: currentSubscription.billingCycle,
                toBilling: newBillingCycle,
                changedAt: new Date().toISOString(),
                prorationAmount,
                reason: "Plan change requested by user",
              },
            ],
            lastPlanChange: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
        include: { organization: true },
      });

      // Update subscription in Rebill if provider ID exists
      if (currentSubscription.providerSubscriptionId) {
        try {
          const newPlanId = rebillService.getPlanId(
            request.newPlanType,
            newBillingCycle
          );
          await rebillService.updateSubscription(
            currentSubscription.providerSubscriptionId,
            {
              amount: newPrice.toString(),
              nextChargeDate: nextBillingDate.toISOString(),
            }
          );

          console.log("✅ Updated subscription in Rebill:", {
            rebillId: currentSubscription.providerSubscriptionId,
            newAmount: newPrice,
            nextBillingDate,
          });
        } catch (rebillError) {
          console.error(
            "⚠️ Failed to update Rebill subscription:",
            rebillError
          );
          // Don't fail the entire operation if Rebill update fails
        }
      }

      // Create payment transaction for proration if applicable
      if (prorationAmount !== 0 && currentSubscription.orgId) {
        await prisma.paymentTransaction.create({
          data: {
            orgId: currentSubscription.orgId,
            subscriptionId: currentSubscription.id,
            userId: currentSubscription.userId,
            amount: Math.abs(prorationAmount),
            currency: newPlanConfig.price.currency,
            status: prorationAmount > 0 ? "SUCCEEDED" : "REFUNDED",
            gateway: "OTHER",
          },
        });
      }

      // Send notification about plan change
      await this.sendPlanChangeNotification(
        updatedSubscription,
        prorationAmount
      );

      console.log("✅ Subscription plan changed successfully:", {
        subscriptionId: updatedSubscription.id,
        newPlan: updatedSubscription.planType,
        prorationAmount,
        nextBillingDate,
      });

      return {
        success: true,
        subscription: updatedSubscription,
        prorationAmount,
        nextBillingDate,
      };
    } catch (error) {
      console.error("❌ Error changing subscription plan:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ✅ Cancel subscription
  async cancelSubscription(
    request: CancellationRequest
  ): Promise<CancellationResult> {
    try {
      console.log("🔄 Processing subscription cancellation:", {
        subscriptionId: request.subscriptionId,
        reason: request.reason,
        cancelMode: request.cancelMode,
      });

      // Get current subscription
      const currentSubscription = await prisma.subscription.findUnique({
        where: { id: request.subscriptionId },
        include: { organization: true, paymentTransactions: true },
      });

      if (!currentSubscription) {
        return { success: false, error: "Subscription not found" };
      }

      if (currentSubscription.status === "CANCELED") {
        return { success: false, error: "Subscription is already cancelled" };
      }

      // Determine effective date
      const effectiveDate =
        request.effectiveDate ||
        (request.cancelMode === "immediate"
          ? new Date()
          : currentSubscription.endDate || new Date());

      // Calculate refund amount for immediate cancellation
      let refundAmount = 0;
      if (request.cancelMode === "immediate") {
        refundAmount =
          await this.calculateCancellationRefund(currentSubscription);
      }

      // Prepare safe metadata for cancellation
      const existingMetadataForCancellation =
        currentSubscription.metadata &&
        typeof currentSubscription.metadata === "object" &&
        !Array.isArray(currentSubscription.metadata)
          ? (currentSubscription.metadata as Record<string, unknown>)
          : {};

      // Update subscription status
      const cancelledSubscription = await prisma.subscription.update({
        where: { id: request.subscriptionId },
        data: {
          status:
            request.cancelMode === "immediate"
              ? "CANCELED"
              : currentSubscription.status,
          endDate: effectiveDate,
          updatedAt: new Date(),
          metadata: {
            ...existingMetadataForCancellation,
            cancellation: {
              cancelledAt: new Date().toISOString(),
              reason: request.reason || "User requested cancellation",
              effectiveDate: effectiveDate.toISOString(),
              cancelMode: request.cancelMode || "end_of_period",
              refundAmount,
            },
            lastStatusChange: new Date().toISOString(),
          },
        },
        include: { organization: true },
      });

      // Cancel subscription in Rebill
      if (currentSubscription.providerSubscriptionId) {
        try {
          await rebillService.cancelSubscription(
            currentSubscription.providerSubscriptionId
          );
          console.log(
            "✅ Cancelled subscription in Rebill:",
            currentSubscription.providerSubscriptionId
          );
        } catch (rebillError) {
          console.error(
            "⚠️ Failed to cancel Rebill subscription:",
            rebillError
          );
          // Don't fail the entire operation if Rebill cancellation fails
        }
      }

      // Process refund if applicable
      if (refundAmount > 0 && currentSubscription.orgId) {
        await prisma.paymentTransaction.create({
          data: {
            orgId: currentSubscription.orgId,
            subscriptionId: currentSubscription.id,
            userId: currentSubscription.userId,
            amount: refundAmount,
            currency: currentSubscription.currency || "COP",
            status: "REFUNDED",
            gateway: "OTHER",
          },
        });
      }

      // Send cancellation notification
      await this.sendCancellationNotification(
        cancelledSubscription,
        refundAmount
      );

      console.log("✅ Subscription cancelled successfully:", {
        subscriptionId: cancelledSubscription.id,
        status: cancelledSubscription.status,
        effectiveDate,
        refundAmount,
      });

      return {
        success: true,
        subscription: cancelledSubscription,
        refundAmount,
        effectiveDate,
      };
    } catch (error) {
      console.error("❌ Error cancelling subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ✅ Reactivate cancelled subscription
  async reactivateSubscription(
    subscriptionId: number,
    newPlanType?: PlanType
  ): Promise<SubscriptionChangeResult> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { organization: true },
      });

      if (!subscription) {
        return { success: false, error: "Subscription not found" };
      }

      if (subscription.status === "ACTIVE") {
        return { success: false, error: "Subscription is already active" };
      }

      const planType = newPlanType || subscription.planType;
      const planConfig = PLAN_CONFIGS[planType];

      const existingMetadataForReactivation =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};

      const reactivatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          planType,
          planName: planConfig.name,
          startDate: new Date(),
          endDate: null,
          updatedAt: new Date(),
          metadata: {
            ...existingMetadataForReactivation,
            reactivation: {
              reactivatedAt: new Date().toISOString(),
              previousStatus: subscription.status,
              newPlan: planType,
            },
            lastStatusChange: new Date().toISOString(),
          },
        },
        include: { organization: true },
      });

      await this.sendReactivationNotification(reactivatedSubscription);

      return {
        success: true,
        subscription: reactivatedSubscription,
      };
    } catch (error) {
      console.error("❌ Error reactivating subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ✅ Get subscription billing history
  async getBillingHistory(subscriptionId: number) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          paymentTransactions: {
            orderBy: { createdAt: "desc" },
          },
          organization: true,
        },
      });

      if (!subscription) {
        throw new Error("Subscription not found");
      }

      const safeMetadata =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};
      const planChangeHistory = Array.isArray(
        (safeMetadata as any).planChangeHistory
      )
        ? ((safeMetadata as any).planChangeHistory as unknown[])
        : [];

      return {
        subscription,
        transactions: subscription.paymentTransactions,
        planChangeHistory,
        totalPaid: subscription.paymentTransactions
          .filter((t) => t.status === "SUCCEEDED")
          .reduce((sum, t) => sum + Number(t.amount), 0),
        totalRefunded: subscription.paymentTransactions
          .filter((t) => t.status === "REFUNDED")
          .reduce((sum, t) => sum + Number(t.amount), 0),
      };
    } catch (error) {
      console.error("❌ Error getting billing history:", error);
      throw error;
    }
  }

  // ✅ Process automatic renewals
  async processRenewal(subscriptionId: number) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { organization: true },
      });

      if (!subscription || subscription.status !== "ACTIVE") {
        return {
          success: false,
          error: "Subscription not eligible for renewal",
        };
      }

      // Process payment via Rebill
      if (subscription.providerSubscriptionId) {
        const paymentResult = await rebillService.processSubscriptionPayment(
          subscription.providerSubscriptionId
        );

        if (paymentResult.success) {
          // Update next billing date
          const nextBillingDate = new Date();
          if (subscription.billingCycle === "YEARLY") {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          } else {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          }

          const existingMetadataForRenewal =
            subscription.metadata &&
            typeof subscription.metadata === "object" &&
            !Array.isArray(subscription.metadata)
              ? (subscription.metadata as Record<string, unknown>)
              : {};
          const existingRenewalHistory = Array.isArray(
            (existingMetadataForRenewal as any).renewalHistory
          )
            ? ((existingMetadataForRenewal as any)
                .renewalHistory as unknown[])
            : [];

          await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
              endDate: nextBillingDate,
              updatedAt: new Date(),
              metadata: {
                ...existingMetadataForRenewal,
                lastRenewal: new Date().toISOString(),
                renewalHistory: [
                  ...existingRenewalHistory,
                  {
                    renewedAt: new Date().toISOString(),
                    nextBillingDate: nextBillingDate.toISOString(),
                    amount:
                      subscription.billingCycle === "YEARLY"
                        ? subscription.yearlyPrice
                        : subscription.monthlyPrice,
                  },
                ],
              } as unknown as Prisma.InputJsonValue,
            },
          });

          await this.sendRenewalNotification(subscription);

          return { success: true, nextBillingDate };
        }
      }

      return { success: false, error: "Payment processing failed" };
    } catch (error) {
      console.error("❌ Error processing renewal:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ✅ Private helper methods
  private async calculateProration(
    currentSubscription: any,
    newPlanConfig: any,
    newBillingCycle: BillingCycle
  ): Promise<number> {
    const currentPrice =
      currentSubscription.billingCycle === "YEARLY"
        ? currentSubscription.yearlyPrice
        : currentSubscription.monthlyPrice;

    const newPrice =
      newBillingCycle === "YEARLY"
        ? newPlanConfig.price.yearly
        : newPlanConfig.price.monthly;

    // Simple proration: difference in price
    // In a real implementation, this would consider the remaining days in the current period
    return Number(newPrice) - Number(currentPrice);
  }

  private async calculateCancellationRefund(
    subscription: any
  ): Promise<number> {
    // Simple refund calculation - in a real implementation, this would be more complex
    // considering the remaining days in the current billing period
    const currentPrice =
      subscription.billingCycle === "YEARLY"
        ? subscription.yearlyPrice
        : subscription.monthlyPrice;

    // For demo purposes, refund 50% if cancelled immediately
    return Number(currentPrice) * 0.5;
  }

  private async sendPlanChangeNotification(
    subscription: any,
    prorationAmount: number
  ) {
    // Implementation would send email/in-app notification
    console.log("📧 Sending plan change notification:", {
      subscriptionId: subscription.id,
      newPlan: subscription.planType,
      prorationAmount,
    });
  }

  private async sendCancellationNotification(
    subscription: any,
    refundAmount: number
  ) {
    // Implementation would send email/in-app notification
    console.log("📧 Sending cancellation notification:", {
      subscriptionId: subscription.id,
      status: subscription.status,
      refundAmount,
    });
  }

  private async sendReactivationNotification(subscription: any) {
    // Implementation would send email/in-app notification
    console.log("📧 Sending reactivation notification:", {
      subscriptionId: subscription.id,
      planType: subscription.planType,
    });
  }

  private async sendRenewalNotification(subscription: any) {
    // Implementation would send email/in-app notification
    console.log("📧 Sending renewal notification:", {
      subscriptionId: subscription.id,
      nextBillingDate: subscription.endDate,
    });
  }
}

// Export singleton instance
const subscriptionManager = new SubscriptionManagerService();
export default subscriptionManager;
