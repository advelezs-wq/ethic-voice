export interface RebillConfig {
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  environment: "sandbox" | "production";
  apiUrl: string;
}

export interface RebillCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  document?: {
    type: "CC" | "NIT" | "CE" | "PP";
    number: string;
  };
}

export interface RebillSubscriptionRequest {
  planId: string; // Plan ID from Rebill (created via Plans API)
  customerData: RebillCustomerData;
  metadata?: Record<string, any>;
  returnUrl?: string;
  webhookUrl?: string;
}

export interface RebillSubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  paymentUrl?: string;
  error?: string;
}

export class RebillService {
  private config: RebillConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REBILL_API_KEY_TEST || "",
      secretKey: process.env.REBILL_SECRET_KEY || "",
      webhookSecret: process.env.REBILL_WEBHOOK_SECRET || "",
      environment:
        (process.env.REBILL_ENVIRONMENT as "sandbox" | "production") ||
        "sandbox",
      apiUrl: "https://api.rebill.com/v2",
    };

    this.validateConfig();
  }

  isConfigured(): boolean {
    return (
      !!this.config.apiKey &&
      !!this.config.secretKey &&
      !!this.config.webhookSecret
    );
  }

  getEnvironmentInfo() {
    return {
      environment: this.config.environment,
      isConfigured: this.isConfigured(),
      hasApiKey: !!this.config.apiKey,
      hasSecretKey: !!this.config.secretKey,
      hasWebhookSecret: !!this.config.webhookSecret,
    };
  }

  // ✅ Get plan ID based on plan type and billing cycle (from environment variables)
  getPlanId(planType: string, billingCycle: "MONTHLY" | "YEARLY"): string {
    // Map your internal plan types to Rebill plan IDs (created via script)
    const planMap: Record<string, Record<string, string>> = {
      STARTER: {
        MONTHLY: process.env.REBILL_STARTER_MONTHLY_PLAN_ID || "",
        YEARLY: process.env.REBILL_STARTER_YEARLY_PLAN_ID || "",
      },
      GROW: {
        MONTHLY: process.env.REBILL_GROW_MONTHLY_PLAN_ID || "",
        YEARLY: process.env.REBILL_GROW_YEARLY_PLAN_ID || "",
      },
      GROW_PRO: {
        MONTHLY: process.env.REBILL_GROW_PRO_MONTHLY_PLAN_ID || "",
        YEARLY: process.env.REBILL_GROW_PRO_YEARLY_PLAN_ID || "",
      },
      PREMIUM: {
        MONTHLY: process.env.REBILL_PREMIUM_MONTHLY_PLAN_ID || "",
        YEARLY: process.env.REBILL_PREMIUM_YEARLY_PLAN_ID || "",
      },
    };

    const planId = planMap[planType]?.[billingCycle];
    if (!planId) {
      throw new Error(
        `Plan ID not found for ${planType} ${billingCycle}. Make sure to run the create-rebill-plans script first.`
      );
    }

    return planId;
  }

  // ✅ Create Payment Link URL for Rebill Checkout Landing (RECOMMENDED APPROACH)
  async createCheckoutSession(
    request: RebillSubscriptionRequest
  ): Promise<RebillSubscriptionResponse> {
    if (!this.isConfigured()) {
      console.error("❌ Rebill service not configured");
      return { success: false, error: "Rebill service not configured" };
    }

    try {
      console.log("🔄 Creating Rebill Payment Link checkout:", {
        planId: request.planId,
        email: request.customerData.email,
      });

      // ✅ Get the Payment Link ID for this plan from environment variables
      const paymentLinkId = this.getPaymentLinkIdForPlan(
        request.planId,
        request.metadata?.billingCycle || "MONTHLY"
      );

      if (!paymentLinkId) {
        console.error("❌ Payment Link not found for plan:", request.planId);
        return {
          success: false,
          error: `Payment Link not configured for plan ${request.planId}. Please create Payment Links in Rebill dashboard.`,
        };
      }

      // ✅ Build query parameters for auto-filling user data
      const queryParams = new URLSearchParams();

      // Basic user info
      if (request.customerData.firstName)
        queryParams.set("firstName", request.customerData.firstName);
      if (request.customerData.lastName)
        queryParams.set("lastName", request.customerData.lastName);
      if (request.customerData.email)
        queryParams.set("email", request.customerData.email);
      if (request.customerData.phone)
        queryParams.set("phoneNumber", request.customerData.phone);

      // Document info (for Colombia)
      if (request.customerData.document?.type)
        queryParams.set("documentType", request.customerData.document.type);
      if (request.customerData.document?.number)
        queryParams.set("documentNumber", request.customerData.document.number);

      // Address info (default Colombia)
      queryParams.set("addressCountry", "CO");

      // Language
      queryParams.set("lang", "es");

      // Custom metadata for linking back to our subscription
      if (request.metadata?.internalSubscriptionId) {
        queryParams.set(
          "internalSubscriptionId",
          request.metadata.internalSubscriptionId
        );
      }
      if (request.metadata?.userId) {
        queryParams.set("userId", request.metadata.userId);
      }
      if (request.metadata?.planType) {
        queryParams.set("planType", request.metadata.planType);
      }

      // ✅ Build the complete Payment Link URL
      const orgAlias =
        process.env.REBILL_ORGANIZATION_ALIAS ||
        (process.env.REBILL_ENVIRONMENT === "sandbox"
          ? "ethicvoice-sandbox"
          : "ethicvoice");
      const baseUrl =
        process.env.REBILL_CHECKOUT_URL || "https://pay.rebill.com";
      const paymentUrl = `${baseUrl}/${orgAlias}/${paymentLinkId}?${queryParams.toString()}`;

      console.log("✅ Rebill Payment Link created:", {
        paymentLinkId,
        paymentUrl,
        queryParams: Object.fromEntries(queryParams.entries()),
      });

      return {
        success: true,
        subscriptionId: request.metadata?.internalSubscriptionId || "pending", // Will be updated via webhook
        paymentUrl: paymentUrl, // ✅ Direct redirect to Rebill's hosted checkout
      };
    } catch (error) {
      console.error("❌ Error creating Rebill Payment Link:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // ✅ Helper: Get Payment Link ID for a specific plan
  private getPaymentLinkIdForPlan(
    planId: string,
    billingCycle: string
  ): string | null {
    // Map Rebill Plan IDs to Payment Link IDs
    // You need to create these Payment Links in your Rebill dashboard first
    const paymentLinkMap: Record<string, string> = {
      // STARTER Plans
      [process.env.REBILL_STARTER_MONTHLY_PLAN_ID || ""]:
        process.env.REBILL_STARTER_MONTHLY_PAYMENT_LINK_ID || "",
      [process.env.REBILL_STARTER_YEARLY_PLAN_ID || ""]:
        process.env.REBILL_STARTER_YEARLY_PAYMENT_LINK_ID || "",

      // GROW Plans
      [process.env.REBILL_GROW_MONTHLY_PLAN_ID || ""]:
        process.env.REBILL_GROW_MONTHLY_PAYMENT_LINK_ID || "",
      [process.env.REBILL_GROW_YEARLY_PLAN_ID || ""]:
        process.env.REBILL_GROW_YEARLY_PAYMENT_LINK_ID || "",

      // GROW PRO Plans
      [process.env.REBILL_GROW_PRO_MONTHLY_PLAN_ID || ""]:
        process.env.REBILL_GROW_PRO_MONTHLY_PAYMENT_LINK_ID || "",
      [process.env.REBILL_GROW_PRO_YEARLY_PLAN_ID || ""]:
        process.env.REBILL_GROW_PRO_YEARLY_PAYMENT_LINK_ID || "",

      // PREMIUM Plans
      [process.env.REBILL_PREMIUM_MONTHLY_PLAN_ID || ""]:
        process.env.REBILL_PREMIUM_MONTHLY_PAYMENT_LINK_ID || "",
      [process.env.REBILL_PREMIUM_YEARLY_PLAN_ID || ""]:
        process.env.REBILL_PREMIUM_YEARLY_PAYMENT_LINK_ID || "",
    };

    // ✅ Add debug logging to see what's happening
    console.log("🔍 [PAYMENT-LINK-DEBUG] Looking for Payment Link:", {
      planId,
      billingCycle,
      availableKeys: Object.keys(paymentLinkMap).filter((key) => key), // Non-empty keys
      paymentLinkMap: Object.fromEntries(
        Object.entries(paymentLinkMap).filter(([key, value]) => key && value)
      ),
    });

    const foundLinkId = paymentLinkMap[planId] || null;

    console.log("🔍 [PAYMENT-LINK-DEBUG] Result:", {
      planId,
      foundLinkId,
      isFound: !!foundLinkId,
    });

    return foundLinkId;
  }

  // ✅ Alternative: Create subscription via direct plan subscription (using documented API)
  async createPlanSubscription(
    request: RebillSubscriptionRequest
  ): Promise<RebillSubscriptionResponse> {
    if (!this.isConfigured()) {
      console.error("❌ Rebill service not configured");
      return { success: false, error: "Rebill service not configured" };
    }

    try {
      console.log("🔄 Creating Rebill plan subscription:", {
        planId: request.planId,
        email: request.customerData.email,
      });

      // First, create a customer if needed
      const customer = await this.createOrGetCustomer(request.customerData);
      if (!customer.success) {
        return { success: false, error: customer.error };
      }

      // Create subscription for the customer using the plan
      const subscriptionData = {
        planId: request.planId,
        customerId: customer.customerId,
        quantity: 1,
        metadata: {
          ...request.metadata,
          source: "ethicvoice-platform",
        },
      };

      const response = await fetch(`${this.config.apiUrl}/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
          "X-API-KEY": this.config.apiKey,
        },
        body: JSON.stringify(subscriptionData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Rebill subscription created successfully:", {
          subscriptionId: result.id,
          status: result.status,
        });

        // Generate checkout URL for the subscription
        const checkoutUrl = `${this.config.apiUrl.replace("/v2", "")}/checkout/${result.id}`;

        return {
          success: true,
          subscriptionId: result.id,
          paymentUrl: checkoutUrl,
        };
      } else {
        console.error("❌ Rebill subscription creation failed:", result);
        return {
          success: false,
          error: result.message || result.error || "Unknown error from Rebill",
        };
      }
    } catch (error) {
      console.error("❌ Error creating Rebill subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // ✅ Helper: Create or get customer in Rebill
  private async createOrGetCustomer(customerData: RebillCustomerData): Promise<{
    success: boolean;
    customerId?: string;
    error?: string;
  }> {
    try {
      console.log("👤 Creating/getting Rebill customer:", customerData.email);

      const customerPayload = {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone || "",
        documentType: customerData.document?.type || "",
        documentNumber: customerData.document?.number || "",
      };

      const response = await fetch(`${this.config.apiUrl}/customers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
          "X-API-KEY": this.config.apiKey,
        },
        body: JSON.stringify(customerPayload),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Rebill customer created/found:", result.id);
        return {
          success: true,
          customerId: result.id,
        };
      } else {
        console.error("❌ Failed to create Rebill customer:", result);
        return {
          success: false,
          error: result.message || "Failed to create customer",
        };
      }
    } catch (error) {
      console.error("❌ Error creating Rebill customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // ✅ Get all plans from Rebill
  async getPlans(): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error("Rebill service not configured");
    }

    try {
      console.log("🔍 Getting Rebill plans");

      const response = await fetch(`${this.config.apiUrl}/plans`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "X-API-KEY": this.config.apiKey,
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Rebill plans retrieved:", result.data?.length || 0);
        return result.data || [];
      } else {
        console.error("❌ Failed to get Rebill plans:", result);
        return [];
      }
    } catch (error) {
      console.error("❌ Error getting Rebill plans:", error);
      return [];
    }
  }

  // ✅ Get plan by ID from Rebill
  async getPlanById(planId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error("Rebill service not configured");
    }

    try {
      console.log("🔍 Getting Rebill plan:", planId);

      const response = await fetch(`${this.config.apiUrl}/plans/${planId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "X-API-KEY": this.config.apiKey,
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Rebill plan retrieved:", {
          id: result.id,
          name: result.name,
          prices: result.prices?.length || 0,
        });
        return result;
      } else {
        console.error("❌ Failed to get Rebill plan:", result);
        throw new Error(result.message || "Failed to get plan");
      }
    } catch (error) {
      console.error("❌ Error getting Rebill plan:", error);
      throw error;
    }
  }

  // ✅ Get subscription status from Rebill (existing subscriptions)
  async getSubscriptionStatus(subscriptionId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error("Rebill service not configured");
    }

    try {
      console.log("🔍 Getting Rebill subscription status:", subscriptionId);

      const response = await fetch(
        `${this.config.apiUrl}/subscriptions/${subscriptionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            "X-API-KEY": this.config.apiKey,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Rebill subscription status:", {
          id: result.id,
          status: result.status,
          nextChargeDate: result.nextChargeDate,
        });
        return result;
      } else {
        console.error("❌ Failed to get Rebill subscription status:", result);
        throw new Error(result.message || "Failed to get subscription status");
      }
    } catch (error) {
      console.error("❌ Error getting Rebill subscription status:", error);
      throw error;
    }
  }

  // ✅ Get all subscriptions for a customer
  async getCustomerSubscriptions(customerEmail: string): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error("Rebill service not configured");
    }

    try {
      console.log("🔍 Getting customer subscriptions:", customerEmail);

      const response = await fetch(
        `${this.config.apiUrl}/subscriptions/customer/${encodeURIComponent(customerEmail)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            "X-API-KEY": this.config.apiKey,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Customer subscriptions found:", result.length || 0);
        return Array.isArray(result) ? result : [result];
      } else {
        console.error("❌ Failed to get customer subscriptions:", result);
        return [];
      }
    } catch (error) {
      console.error("❌ Error getting customer subscriptions:", error);
      return [];
    }
  }

  // ✅ List payments (basic wrapper). Filters are optional and depend on Rebill API support
  async getPayments(options?: {
    status?: string;
    search?: string;
    page?: number;
    take?: number;
  }): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error("Rebill service not configured");
    }

    try {
      const url = new URL(`${this.config.apiUrl}/payments`);
      if (options?.status) url.searchParams.set("status", options.status);
      if (options?.search) url.searchParams.set("search", options.search);
      if (options?.page) url.searchParams.set("page", String(options.page));
      if (options?.take) url.searchParams.set("take", String(options.take));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "X-API-KEY": this.config.apiKey,
        },
      });

      const result = await response.json();
      if (response.ok) {
        return Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      }

      console.error("❌ Failed to get Rebill payments:", result);
      return [];
    } catch (error) {
      console.error("❌ Error getting Rebill payments:", error);
      return [];
    }
  }

  // ✅ Update subscription status
  async updateSubscription(
    subscriptionId: string,
    updates: {
      status?: "ACTIVE" | "PAUSED" | "CANCELLED";
      nextChargeDate?: string;
      amount?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Rebill service not configured" };
    }

    try {
      console.log("🔄 Updating Rebill subscription:", subscriptionId, updates);

      const response = await fetch(
        `${this.config.apiUrl}/subscriptions/${subscriptionId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            "Content-Type": "application/json",
            "X-API-KEY": this.config.apiKey,
          },
          body: JSON.stringify(updates),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Rebill subscription updated successfully");
        return { success: true };
      } else {
        console.error("❌ Failed to update Rebill subscription:", result);
        return {
          success: false,
          error: result.message || "Failed to update subscription",
        };
      }
    } catch (error) {
      console.error("❌ Error updating Rebill subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // ✅ Cancel a subscription
  async cancelSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateSubscription(subscriptionId, { status: "CANCELLED" });
  }

  // ✅ Process subscription payment manually
  async processSubscriptionPayment(
    subscriptionId: string,
    nextChargeDate?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Rebill service not configured" };
    }

    try {
      console.log("💳 Processing Rebill subscription payment:", subscriptionId);

      const paymentData: any = {};
      if (nextChargeDate) {
        paymentData.date = nextChargeDate;
      }

      const response = await fetch(
        `${this.config.apiUrl}/subscriptions/${subscriptionId}/pay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            "Content-Type": "application/json",
            "X-API-KEY": this.config.apiKey,
          },
          body: JSON.stringify(paymentData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Subscription payment processed successfully");
        return { success: true };
      } else {
        console.error("❌ Failed to process subscription payment:", result);
        return {
          success: false,
          error: result.message || "Failed to process payment",
        };
      }
    } catch (error) {
      console.error("❌ Error processing subscription payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // Get plan configuration by plan type (for reference)
  getPlanByType(
    planType: string
  ): import("@/types/rebill.types").EthicVoicePlan | null {
    const { REBILL_PLANS } = require("@/types/rebill.types");
    return REBILL_PLANS[planType] || null;
  }

  // Webhook signature verification
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implementation would depend on Rebill's webhook signature method
    // This is a placeholder - need to check Rebill's webhook documentation
    console.log("🔐 Verifying Rebill webhook signature...");

    if (!this.config.webhookSecret) {
      console.warn("⚠️ Webhook secret not configured");
      return false;
    }

    // TODO: Implement actual signature verification based on Rebill docs
    // This would typically involve HMAC verification
    return true; // Placeholder
  }

  private validateConfig() {
    if (!this.isConfigured()) {
      console.warn(
        "⚠️ Rebill service not fully configured. Check environment variables:",
        this.getEnvironmentInfo()
      );
    } else {
      console.log("✅ Rebill service configured successfully:", {
        environment: this.config.environment,
        apiUrl: this.config.apiUrl,
      });
    }
  }
}

// Export singleton instance
const rebillService = new RebillService();
export default rebillService;
