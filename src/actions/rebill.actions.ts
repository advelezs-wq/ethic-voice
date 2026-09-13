"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { RebillService } from "@/modules/app/services/rebill.service";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

// None of this file's functions are currently imported into any client
// component, so they aren't reachable as Server Actions today — but they're
// exported from a "use server" file with no auth check at all, and two of
// them are genuinely dangerous the moment that changes: this one creates a
// real Rebill subscription/payment link as a side effect (manual dev/QA
// tool, never meant for a real customer to trigger), and getRebillPayments
// below returns platform-wide payment records. Gating on superadmin now,
// before either is wired into any UI.
async function assertSuperAdmin(): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const email = (await currentUser())?.primaryEmailAddress?.emailAddress;
  if (!email || !isSuperAdmin(email)) {
    throw new Error("No autorizado");
  }
}

export async function testRebillIntegration() {
  await assertSuperAdmin();
  try {
    console.log("🚀 Testing Rebill Integration...");

    const rebillService = new RebillService();

    // Check configuration
    if (!rebillService.isConfigured()) {
      console.error("❌ Rebill service not configured properly");
      return {
        success: false,
        error: "Rebill configuration missing",
        data: null,
      };
    }

    console.log("✅ Rebill service configured");

    // Test creating a subscription using Rebill's Plan + Payment Link flow
    const subscriptionData = {
      customerEmail: "test@ethicvoice.com",
      planName: "EthicVoice Premium",
      planDescription: "Monthly premium subscription for EthicVoice platform",
      amount: 29.99,
      currency: "USD",
      frequency: { type: "months" as const, quantity: 1 },
      successUrl: "https://ethicvoice.com/payment-success",
      organizationAlias: "ethicvoice", // You'll need to get this from Rebill dashboard
    };

    console.log("📋 Creating Rebill subscription with data:", subscriptionData);

    const subscription = await rebillService.createPlanSubscription(
      // @ts-expect-error align to RebillSubscriptionRequest shape
      subscriptionData
    );

    console.log("✅ Rebill subscription created successfully!", subscription);

    if (!subscription.success) {
      return {
        success: false,
        error: subscription.error || "Failed to create subscription",
        data: null,
      };
    }

    return {
      success: true,
      data: {
        subscriptionId: subscription.subscriptionId,
        paymentUrl: subscription.paymentUrl,
        message:
          "Subscription created successfully! Customer can pay at: " +
          (subscription.paymentUrl || ""),
      },
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Rebill integration test failed:", error);

    return {
      success: false,
      error: error.message || "Unknown error occurred",
      data: null,
    };
  }
}

export async function createRebillCustomer(customerData: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  await assertSuperAdmin();
  try {
    const rebillService = new RebillService();

    if (!rebillService.isConfigured()) {
      throw new Error("Rebill service not configured properly");
    }

    // Note: Rebill does not expose separate customer creation via our wrapper.
    // Return a stub indicating customers are created upon successful payment.
    const customer = {
      id: undefined,
      email: customerData.email,
      note: "Customer will be created upon successful checkout in Rebill",
    } as const;

    return {
      success: true,
      data: customer,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create Rebill customer:", error);

    return {
      success: false,
      error: error.message || "Failed to create customer",
      data: null,
    };
  }
}

export async function getRebillPayments(options?: {
  status?: "SUCCEEDED" | "PENDING" | "FAILED" | "REFUNDED" | "EXPIRED" | "ALL";
  search?: string;
  page?: number;
  take?: number;
}) {
  await assertSuperAdmin();
  try {
    const rebillService = new RebillService();

    if (!rebillService.isConfigured()) {
      throw new Error("Rebill service not configured properly");
    }

    const payments = await rebillService.getPayments(options);

    return {
      success: true,
      data: payments,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to get Rebill payments:", error);

    return {
      success: false,
      error: error.message || "Failed to get payments",
      data: null,
    };
  }
}
