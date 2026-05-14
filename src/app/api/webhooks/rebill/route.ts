import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import rebillService from "@/modules/app/services/rebill.service";
import subscriptionManager from "@/modules/app/services/subscription-manager.service";
import { EmailAccountService } from "@/modules/app/services/email-account.service";
import type { Prisma, SubscriptionStatus } from "@prisma/client";

const emailAccountService = new EmailAccountService();

// Enhanced webhook handler for all Rebill subscription events
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("rebill-signature") || "";

    console.log("🔔 Received Rebill webhook:", {
      hasSignature: !!signature,
      bodyLength: body.length,
    });

    // ✅ Add debugging to see exact webhook structure
    console.log("🔍 [WEBHOOK-DEBUG] Raw body:", body);
    console.log("🔍 [WEBHOOK-DEBUG] Signature:", signature);

    // Verify webhook signature
    console.log("🔐 Verifying Rebill webhook signature...");
    if (!rebillService.verifyWebhookSignature(body, signature)) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(body);
      console.log("✅ [WEBHOOK-DEBUG] Parsed event:", {
        fullEvent: event,
        keys: Object.keys(event),
        type: event.type,
        eventType: event.event_type, // Some APIs use event_type instead of type
        data: event.data,
      });
    } catch (parseError) {
      console.error("❌ [WEBHOOK-DEBUG] JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // ✅ Handle both 'type' and 'event_type' fields, and Rebill's webhook.event
    const eventType =
      event.type || event.event_type || event.eventType || event.webhook?.event;

    console.log("📥 Processing Rebill webhook event:", {
      type: eventType,
      webhookEvent: event.webhook?.event,
      subscriptionId: event.subscription?.id,
      paymentId: event.payment?.id,
      data: event.data?.id || event.data,
    });

    switch (eventType) {
      // ✅ Subscription Created
      case "subscription.created":
      case "new-subscription": // ← Rebill uses this event name
        return await handleSubscriptionCreated(event);

      // ✅ Subscription Activated (payment succeeded)
      case "subscription.activated":
      case "payment.succeeded":
        return await handleSubscriptionActivated(event);

      // ✅ Subscription Updated (plan changes)
      case "subscription.updated":
        return await handleSubscriptionUpdated(event);

      // ✅ Subscription Cancelled
      case "subscription.cancelled":
        return await handleSubscriptionCancelled(event);

      // ✅ Payment Failed
      case "payment.failed":
        return await handlePaymentFailed(event);

      // ✅ Subscription Renewed
      case "subscription.renewed":
      case "invoice.payment_succeeded":
        return await handleSubscriptionRenewed(event);

      // ✅ Subscription Paused
      case "subscription.paused":
        return await handleSubscriptionPaused(event);

      // ✅ Subscription Resumed
      case "subscription.resumed":
        return await handleSubscriptionResumed(event);

      // ✅ Customer Updated
      case "customer.updated":
        return await handleCustomerUpdated(event);

      default:
        console.log(`ℹ️ Unhandled webhook event type: ${eventType}`);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("❌ Error processing Rebill webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// ✅ Handle subscription creation
async function handleSubscriptionCreated(event: any) {
  try {
    // ✅ Use correct Rebill webhook structure
    const subscriptionData = event.subscription;
    const customerData = event.customer;

    console.log("🆕 Processing subscription created:", {
      rebillId: subscriptionData?.id,
      customerEmail: customerData?.email,
      title: subscriptionData?.title,
      webhookEvent: event.webhook?.event,
    });

    if (!subscriptionData?.id) {
      console.error("❌ Missing subscription ID in webhook");
      return NextResponse.json(
        { error: "Missing subscription data" },
        { status: 400 }
      );
    }

    // ✅ Enhanced subscription finding with multiple strategies
    let internalSubscription = null;

    // Strategy 1: Find by metadata (most reliable for Payment Links)
    // Note: Rebill Payment Links may include our metadata in the webhook
    if (event.metadata?.internalSubscriptionId) {
      internalSubscription = await prisma.subscription.findUnique({
        where: { id: parseInt(event.metadata.internalSubscriptionId) },
      });
      console.log(
        "📍 Found subscription via webhook metadata:",
        internalSubscription?.id
      );
    }

    // Strategy 2: Find by customer email and recent creation
    if (!internalSubscription && customerData?.email) {
      const user = await prisma.user.findFirst({
        where: { email: customerData.email },
      });

      if (user) {
        internalSubscription = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            providerSubscriptionId: null, // Looking for subscriptions awaiting Rebill UUID
            status: "TRIALING",
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          orderBy: { createdAt: "desc" },
        });
        console.log(
          "📍 Found subscription via customer email:",
          internalSubscription?.id
        );
      }
    }

    if (internalSubscription) {
      // ✅ Update subscription with Rebill UUID and activate
      await prisma.subscription.update({
        where: { id: internalSubscription.id },
        data: {
          providerSubscriptionId: subscriptionData.id, // ✅ Set the real Rebill UUID
          status: "ACTIVE", // ✅ Activate immediately on successful payment
          isTrialActive: false,
          metadata: {
            ...((internalSubscription.metadata as any) || {}),
            rebillSubscription: subscriptionData,
            rebillCustomer: customerData,
            webhookEvents: [
              ...((internalSubscription.metadata as any)?.webhookEvents || []),
              {
                type: event.webhook?.event || "subscription.created",
                receivedAt: new Date().toISOString(),
                rebillSubscriptionId: subscriptionData.id,
              },
            ],
          },
        },
      });

      console.log("✅ Subscription activated via webhook:", {
        internalId: internalSubscription.id,
        rebillId: subscriptionData.id,
        status: "ACTIVE",
      });
    } else {
      console.error(
        "❌ Could not find matching internal subscription for Rebill ID:",
        subscriptionData.id
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling subscription created:", error);
    throw error;
  }
}

// ✅ Handle subscription activation (payment succeeded)
async function handleSubscriptionActivated(event: any) {
  try {
    const subscriptionData = event.data;

    console.log("🎉 Processing subscription activation:", {
      rebillId: subscriptionData.id,
      amount: subscriptionData.price?.amount,
      currency: subscriptionData.price?.currency,
    });

    const subscription = await findSubscriptionByRebillId(subscriptionData.id);

    if (subscription) {
      // Check if this is an upgrade by looking at metadata
      const rawMetadata = subscription.metadata as unknown;
      const metadata:
        | Record<string, unknown>
        | undefined =
        rawMetadata && typeof rawMetadata === "object"
          ? (rawMetadata as Record<string, unknown>)
          : undefined;
      const isUpgrade =
        typeof metadata?.isUpgrade === "boolean"
          ? (metadata.isUpgrade as boolean)
          : false;
      const previousSubscriptionId =
        typeof metadata?.previousSubscriptionId === "string"
          ? (metadata.previousSubscriptionId as string)
          : undefined;

      console.log("📊 Subscription activation context:", {
        subscriptionId: subscription.id,
        isUpgrade,
        previousSubscriptionId,
        planType: subscription.planType,
      });

      // Update subscription status to ACTIVE
      const existingMetadataForActivation =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};
      const existingWebhookEventsForActivation = Array.isArray(
        (existingMetadataForActivation as any).webhookEvents
      )
        ? ((existingMetadataForActivation as any).webhookEvents as unknown[])
        : [];

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          startDate: new Date(),
          metadata: {
            ...existingMetadataForActivation,
            activatedAt: new Date().toISOString(),
            webhookEvents: ([
              ...existingWebhookEventsForActivation,
              {
                type: event.type,
                receivedAt: new Date().toISOString(),
                data: subscriptionData,
              },
            ] as unknown) as Prisma.JsonArray,
          } as Prisma.InputJsonValue,
        },
      });

      // If this is an upgrade, cancel the previous subscription
      if (isUpgrade && previousSubscriptionId) {
        console.log(
          "⬆️ Processing upgrade - cancelling previous subscription:",
          previousSubscriptionId
        );

        try {
          await prisma.subscription.update({
            where: { id: parseInt(previousSubscriptionId) },
            data: {
              status: "CANCELED",
              endDate: new Date(),
              updatedAt: new Date(),
            },
          });

          console.log("✅ Previous subscription cancelled for upgrade");
        } catch (cancelError) {
          console.error(
            "❌ Failed to cancel previous subscription:",
            cancelError
          );
          // Don't fail the entire activation
        }
      }

      // Update organization with new plan features
      if (subscription.orgId) {
        console.log("🏢 Updating organization with new plan features");

        await prisma.organization.update({
          where: { id: subscription.orgId },
          data: {
            currentPlan: subscription.planType,
            hasActivePlan: true,
            isEmailChannelActive: subscription.hasEmailChannel,
            isAiProcessingActive: subscription.hasAiProcessing,
            isChatbotActive: subscription.hasChatbotChannel,
            isPhoneChannelActive: subscription.hasPhoneChannel,
            currentUsers: subscription.maxUsers,
            currentInvestigators: subscription.maxInvestigators,
            subscriptionSetupCompleted: true,
          },
        });

        // If this was an upgrade, enforce new plan limits
        if (isUpgrade) {
          console.log("🛡️ Enforcing new plan limits after upgrade");

          try {
            const { enforcePlanLimits } = await import(
              "@/modules/core/utils/plan-enforcement.utils"
            );
            const enforcementResult = await enforcePlanLimits(
              subscription.orgId,
              subscription.userId ?? undefined
            );

            console.log("✅ Plan limits enforced after upgrade:", {
              unblockedUsers: enforcementResult.unblockedUsers.length,
            });
          } catch (enforcementError) {
            console.error(
              "❌ Plan enforcement error after upgrade:",
              enforcementError
            );
            // Don't fail activation
          }
        }

        await emailAccountService.enforceEmailChannelPlanCompliance(
          subscription.orgId
        );
      }

      // Create payment transaction record
      if (subscription.orgId && subscriptionData.price?.amount) {
        await prisma.paymentTransaction.create({
          data: {
            orgId: subscription.orgId, // Correct field name
            subscriptionId: subscription.id,
            amount: Number(subscriptionData.price.amount),
            currency: subscriptionData.price.currency || "COP",
            status: "SUCCEEDED", // Correct enum value
            gateway: "REBILL", // Correct enum value
            providerTransactionId: subscriptionData.id, // Rebill transaction ID
            // Note: metadata field doesn't exist in current schema
            // Additional data would need to be stored elsewhere or schema updated
          },
        });
      }

      console.log("✅ Subscription activated successfully");
    } else {
      console.log(
        "⚠️ No subscription found for Rebill ID:",
        subscriptionData.id
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling subscription activation:", error);
    throw error;
  }
}

// ✅ Handle subscription updates (plan changes)
async function handleSubscriptionUpdated(event: any) {
  try {
    const subscriptionData = event.data;

    console.log("🔄 Processing subscription update:", {
      rebillId: subscriptionData.id,
      status: subscriptionData.status,
      amount: subscriptionData.price?.amount,
    });

    const subscription = await findSubscriptionByRebillId(subscriptionData.id);

    if (subscription) {
      const existingMetadataForUpdate =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};
      const existingWebhookEventsForUpdate = Array.isArray(
        (existingMetadataForUpdate as any).webhookEvents
      )
        ? ((existingMetadataForUpdate as any).webhookEvents as unknown[])
        : [];

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status:
            (mapRebillStatusToInternal(
              subscriptionData.status
            ) as unknown) as SubscriptionStatus,
          updatedAt: new Date(),
          metadata: {
            ...existingMetadataForUpdate,
            lastRebillUpdate: new Date().toISOString(),
            webhookEvents: ([
              ...existingWebhookEventsForUpdate,
              {
                type: "subscription.updated",
                receivedAt: new Date().toISOString(),
                data: subscriptionData,
              },
            ] as unknown) as Prisma.JsonArray,
          } as Prisma.InputJsonValue,
        },
      });

      if (subscription.orgId) {
        await emailAccountService.enforceEmailChannelPlanCompliance(
          subscription.orgId
        );
      }

      console.log("✅ Subscription update processed");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling subscription update:", error);
    throw error;
  }
}

// ✅ Handle subscription cancellation
async function handleSubscriptionCancelled(event: any) {
  try {
    const subscriptionData = event.data;

    console.log("❌ Processing subscription cancellation:", {
      rebillId: subscriptionData.id,
      reason: subscriptionData.cancellation_reason,
    });

    const subscription = await findSubscriptionByRebillId(subscriptionData.id);

    if (subscription) {
      const existingMetadataForCancel =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};
      const existingWebhookEventsForCancel = Array.isArray(
        (existingMetadataForCancel as any).webhookEvents
      )
        ? ((existingMetadataForCancel as any).webhookEvents as unknown[])
        : [];

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "CANCELED",
          endDate: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...existingMetadataForCancel,
            cancelledAt: new Date().toISOString(),
            cancellationReason:
              subscriptionData.cancellation_reason || "Cancelled via Rebill",
            webhookEvents: ([
              ...existingWebhookEventsForCancel,
              {
                type: "subscription.cancelled",
                receivedAt: new Date().toISOString(),
                data: subscriptionData,
              },
            ] as unknown) as Prisma.JsonArray,
          } as Prisma.InputJsonValue,
        },
      });

      if (subscription.orgId) {
        await emailAccountService.enforceEmailChannelPlanCompliance(
          subscription.orgId
        );
      }

      console.log("✅ Subscription cancellation processed");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling subscription cancellation:", error);
    throw error;
  }
}

// ✅ Handle payment failures
async function handlePaymentFailed(event: any) {
  try {
    const paymentData = event.data;

    console.log("💳❌ Processing payment failure:", {
      paymentId: paymentData.id,
      subscriptionId: paymentData.subscription_id,
      reason: paymentData.failure_reason,
    });

    if (paymentData.subscription_id) {
      const subscription = await findSubscriptionByRebillId(
        paymentData.subscription_id
      );

      if (subscription) {
        const existingMetadataForFailure =
          subscription.metadata &&
          typeof subscription.metadata === "object" &&
          !Array.isArray(subscription.metadata)
            ? (subscription.metadata as Record<string, unknown>)
            : {};
        const existingWebhookEventsForFailure = Array.isArray(
          (existingMetadataForFailure as any).webhookEvents
        )
          ? ((existingMetadataForFailure as any).webhookEvents as unknown[])
          : [];

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
          status: "PAST_DUE",
            updatedAt: new Date(),
            metadata: {
              ...existingMetadataForFailure,
              lastPaymentFailure: {
                failedAt: new Date().toISOString(),
                reason: paymentData.failure_reason,
                amount: paymentData.amount,
              },
              webhookEvents: ([
                ...existingWebhookEventsForFailure,
                {
                  type: "payment.failed",
                  receivedAt: new Date().toISOString(),
                  data: paymentData,
                },
              ] as unknown) as Prisma.JsonArray,
            } as Prisma.InputJsonValue,
          },
        });

        if (subscription.orgId) {
          await emailAccountService.enforceEmailChannelPlanCompliance(
            subscription.orgId
          );
        }

        console.log("✅ Payment failure processed");
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling payment failure:", error);
    throw error;
  }
}

// ✅ Handle subscription renewals
async function handleSubscriptionRenewed(event: any) {
  try {
    const renewalData = event.data;

    console.log("🔄 Processing subscription renewal:", {
      subscriptionId: renewalData.subscription_id || renewalData.id,
      amount: renewalData.amount,
      nextChargeDate: renewalData.next_charge_date,
    });

    const subscriptionId = renewalData.subscription_id || renewalData.id;
    const subscription = await findSubscriptionByRebillId(subscriptionId);

    if (subscription) {
      // Calculate next billing date
      const nextBillingDate = renewalData.next_charge_date
        ? new Date(renewalData.next_charge_date)
        : new Date();

      if (!renewalData.next_charge_date) {
        if (subscription.billingCycle === "YEARLY") {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
      }

      const existingMetadataForRenewal =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};
      const existingWebhookEventsForRenewal = Array.isArray(
        (existingMetadataForRenewal as any).webhookEvents
      )
        ? ((existingMetadataForRenewal as any).webhookEvents as unknown[])
        : [];

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          endDate: nextBillingDate,
          updatedAt: new Date(),
          metadata: {
            ...existingMetadataForRenewal,
            lastRenewal: new Date().toISOString(),
            renewalHistory: ([
              ...(
                Array.isArray(
                  (existingMetadataForRenewal as any).renewalHistory
                )
                  ? ((existingMetadataForRenewal as any)
                      .renewalHistory as unknown[])
                  : []
              ),
              {
                renewedAt: new Date().toISOString(),
                amount: renewalData.amount,
                nextBillingDate: nextBillingDate.toISOString(),
              },
            ] as unknown) as Prisma.JsonArray,
            webhookEvents: ([
              ...existingWebhookEventsForRenewal,
              {
                type: event.type,
                receivedAt: new Date().toISOString(),
                data: renewalData,
              },
            ] as unknown) as Prisma.JsonArray,
          } as Prisma.InputJsonValue,
        },
      });

      // Create payment transaction for renewal
      if (subscription.orgId && renewalData.amount) {
        await prisma.paymentTransaction.create({
          data: {
            orgId: subscription.orgId,
            subscriptionId: subscription.id,
            userId: subscription.userId,
            amount: Number(renewalData.amount),
            currency: renewalData.currency || subscription.currency || "COP",
          status: "SUCCEEDED",
            providerTransactionId: renewalData.payment_id || renewalData.id,
            gateway: "REBILL",
          },
        });
      }

      console.log("✅ Subscription renewal processed");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling subscription renewal:", error);
    throw error;
  }
}

// ✅ Handle subscription pause
async function handleSubscriptionPaused(event: any) {
  try {
    const subscriptionData = event.data;

    const subscription = await findSubscriptionByRebillId(subscriptionData.id);

    if (subscription) {
      const existingMetadataForPause =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};
      const existingWebhookEventsForPause = Array.isArray(
        (existingMetadataForPause as any).webhookEvents
      )
        ? ((existingMetadataForPause as any).webhookEvents as unknown[])
        : [];

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "PAUSED" as unknown as SubscriptionStatus,
          updatedAt: new Date(),
          metadata: {
            ...existingMetadataForPause,
            pausedAt: new Date().toISOString(),
            webhookEvents: ([
              ...existingWebhookEventsForPause,
              {
                type: "subscription.paused",
                receivedAt: new Date().toISOString(),
                data: subscriptionData,
              },
            ] as unknown) as Prisma.JsonArray,
          } as Prisma.InputJsonValue,
        },
      });

      if (subscription.orgId) {
        await emailAccountService.enforceEmailChannelPlanCompliance(
          subscription.orgId
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling subscription pause:", error);
    throw error;
  }
}

// ✅ Handle subscription resume
async function handleSubscriptionResumed(event: any) {
  try {
    const subscriptionData = event.data;

    const subscription = await findSubscriptionByRebillId(subscriptionData.id);

    if (subscription) {
      const existingMetadataForResume =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};
      const existingWebhookEventsForResume = Array.isArray(
        (existingMetadataForResume as any).webhookEvents
      )
        ? ((existingMetadataForResume as any).webhookEvents as unknown[])
        : [];

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE" as unknown as SubscriptionStatus,
          updatedAt: new Date(),
          metadata: {
            ...existingMetadataForResume,
            resumedAt: new Date().toISOString(),
            webhookEvents: ([
              ...existingWebhookEventsForResume,
              {
                type: "subscription.resumed",
                receivedAt: new Date().toISOString(),
                data: subscriptionData,
              },
            ] as unknown) as Prisma.JsonArray,
          } as Prisma.InputJsonValue,
        },
      });

      if (subscription.orgId) {
        await emailAccountService.enforceEmailChannelPlanCompliance(
          subscription.orgId
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling subscription resume:", error);
    throw error;
  }
}

// ✅ Handle customer updates
async function handleCustomerUpdated(event: any) {
  try {
    const customerData = event.data;

    console.log("👤 Processing customer update:", {
      customerId: customerData.id,
      email: customerData.email,
    });

    // Update all subscriptions for this customer
    await prisma.subscription.updateMany({
      where: {
        providerCustomerId: customerData.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error handling customer update:", error);
    throw error;
  }
}

// ✅ Helper functions
async function findInternalSubscription(rebillSubscription: any) {
  // Try to find by metadata first
  if (rebillSubscription.metadata?.internalSubscriptionId) {
    return await prisma.subscription.findUnique({
      where: {
        id: parseInt(rebillSubscription.metadata.internalSubscriptionId),
      },
    });
  }

  // Try to find by user email and recent creation
  if (rebillSubscription.userEmail) {
    const user = await prisma.user.findFirst({
      where: { email: rebillSubscription.userEmail },
    });

    if (user) {
      return await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: "TRIALING",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return null;
}

async function findSubscriptionByRebillId(rebillId: string) {
  return await prisma.subscription.findFirst({
    where: { providerSubscriptionId: rebillId },
  });
}

function mapRebillStatusToInternal(rebillStatus: string): string {
  switch (rebillStatus?.toUpperCase()) {
    case "ACTIVE":
      return "ACTIVE";
    case "PAUSED":
      return "PAUSED";
    case "CANCELLED":
    case "CANCELED":
      return "CANCELED";
    case "PAST_DUE":
      return "PAST_DUE";
    case "TRIALING":
      return "TRIALING";
    default:
      return "ACTIVE"; // Default fallback
  }
}

export async function GET() {
  return NextResponse.json({ message: "Rebill webhook endpoint" });
}
