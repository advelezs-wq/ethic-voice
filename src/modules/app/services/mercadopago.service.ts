export interface MercadoPagoConfig {
  accessToken: string;
  publicKey?: string;
  apiBaseUrl: string; // https://api.mercadopago.com
}

export interface MpCreatePlanRequest {
  reason: string;
  frequency: 1 | 3 | 6 | 12;
  frequencyType: "days" | "months";
  transactionAmount: number;
  currencyId: string; // e.g. "ARS", "COP", "USD"
  backUrl?: string;
  billingDay?: number; // 1-28 recommended
  billingDayProportional?: boolean; // charge proportionally until billing day
}

export interface MpCreatePlanResponse {
  id?: string; // preapproval_plan_id
  success: boolean;
  error?: string;
}

export interface MpCreatePreapprovalRequest {
  preapprovalPlanId: string;
  payerEmail: string;
  backUrl: string;
  externalReference: string; // internal subscription id
  cardTokenId?: string; // optional if using direct card tokenization
  status?: "authorized" | "pending";
}

export interface MpCreatePreapprovalResponse {
  success: boolean;
  id?: string; // preapproval id
  initPoint?: string; // URL to redirect user for authorization
  error?: string;
}

// No-plan preapproval request (dynamic auto_recurring)
export interface MpAutoRecurringConfig {
  frequency: 1 | 3 | 6 | 12;
  frequencyType: "days" | "months";
  transactionAmount: number;
  currencyId: string; // e.g. "COP"
  billingDay?: number; // Only supported when creating preapproval_plan
  billingDayProportional?: boolean; // Only supported on preapproval_plan
  startDate?: string; // ISO string
  endDate?: string; // ISO string
}

export interface MpCreatePreapprovalNoPlanRequest {
  payerEmail: string;
  backUrl: string;
  externalReference: string;
  reason: string;
  autoRecurring: MpAutoRecurringConfig;
  status?: "authorized" | "pending";
}

export interface MpCreatePreferenceRequest {
  payerEmail: string;
  amount: number;
  currencyId: string; // e.g. COP
  title: string;
  externalReference: string;
  backUrls: { success: string; pending?: string; failure?: string };
  metadata?: Record<string, unknown>;
}

export interface MpCreatePreferenceResponse {
  success: boolean;
  id?: string;
  initPoint?: string;
  error?: string;
}

class MercadoPagoService {
  private config: MercadoPagoConfig;

  constructor() {
    this.config = {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
      publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
      apiBaseUrl: "https://api.mercadopago.com",
    };
    this.validateConfig();
  }

  isConfigured(): boolean {
    return !!this.config.accessToken;
  }

  private headersJson(): HeadersInit {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  // Map internal plan types to Mercado Pago preapproval plan IDs via env vars
  getPlanId(planType: string, billingCycle: "MONTHLY" | "YEARLY"): string {
    const planMap: Record<string, Record<string, string>> = {
      STARTER: {
        MONTHLY: process.env.MP_STARTER_MONTHLY_PLAN_ID || "",
        YEARLY: process.env.MP_STARTER_YEARLY_PLAN_ID || "",
      },
      GROW: {
        MONTHLY: process.env.MP_GROW_MONTHLY_PLAN_ID || "",
        YEARLY: process.env.MP_GROW_YEARLY_PLAN_ID || "",
      },
      GROW_PRO: {
        MONTHLY: process.env.MP_GROW_PRO_MONTHLY_PLAN_ID || "",
        YEARLY: process.env.MP_GROW_PRO_YEARLY_PLAN_ID || "",
      },
      PREMIUM: {
        MONTHLY: process.env.MP_PREMIUM_MONTHLY_PLAN_ID || "",
        YEARLY: process.env.MP_PREMIUM_YEARLY_PLAN_ID || "",
      },
    };

    const planId = planMap[planType]?.[billingCycle];
    if (!planId) {
      throw new Error(
        `MercadoPago plan ID not found for ${planType} ${billingCycle}. Configure MP_*_PLAN_ID env vars.`
      );
    }
    return planId;
  }

  async createPlan(req: MpCreatePlanRequest): Promise<MpCreatePlanResponse> {
    if (!this.isConfigured()) return { success: false, error: "MercadoPago not configured" };

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/preapproval_plan`, {
        method: "POST",
        headers: this.headersJson(),
        body: JSON.stringify({
          reason: req.reason,
          auto_recurring: {
            frequency: req.frequency,
            frequency_type: req.frequencyType,
            transaction_amount: req.transactionAmount,
            currency_id: req.currencyId,
            ...(typeof req.billingDay === "number"
              ? { billing_day: req.billingDay }
              : {}),
            ...(typeof req.billingDayProportional === "boolean"
              ? { billing_day_proportional: req.billingDayProportional }
              : {}),
          },
          back_url: req.backUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.message || "Failed to create plan" };
      }
      return { success: true, id: data?.id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async createPreapproval(req: MpCreatePreapprovalRequest): Promise<MpCreatePreapprovalResponse> {
    if (!this.isConfigured()) return { success: false, error: "MercadoPago not configured" };
    try {
      const payload: any = {
        preapproval_plan_id: req.preapprovalPlanId,
        payer_email: req.payerEmail,
        back_url: req.backUrl,
        external_reference: req.externalReference,
      };
      if (req.cardTokenId) payload.card_token_id = req.cardTokenId;
      if (req.status) payload.status = req.status;

      const response = await fetch(`${this.config.apiBaseUrl}/preapproval`, {
        method: "POST",
        headers: this.headersJson(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = (data?.message || data?.error || "Failed to create subscription") as string;
        // Fallback: some accounts require card_token_id on API, but allow hosted checkout URL
        if (/card_token_id/i.test(message)) {
          const overrideBase = process.env.NEXT_PUBLIC_MP_CHECKOUT_BASE || process.env.MP_CHECKOUT_BASE;
          const fallbackBase = overrideBase || "https://www.mercadopago.com.co";
          const url = `${fallbackBase}/subscriptions/checkout?preapproval_plan_id=${encodeURIComponent(
            req.preapprovalPlanId
          )}&back_url=${encodeURIComponent(req.backUrl)}&external_reference=${encodeURIComponent(
            req.externalReference
          )}&auto_return=approved`;
          return { success: true, initPoint: url };
        }
        return { success: false, error: message };
      }
      return {
        success: true,
        id: data?.id,
        initPoint: data?.init_point || data?.sandbox_init_point || undefined,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async createPreapprovalNoPlan(req: MpCreatePreapprovalNoPlanRequest): Promise<MpCreatePreapprovalResponse> {
    if (!this.isConfigured()) return { success: false, error: "MercadoPago not configured" };
    try {
      const payload: any = {
        reason: req.reason,
        payer_email: req.payerEmail,
        back_url: req.backUrl,
        external_reference: req.externalReference,
        auto_recurring: {
          frequency: req.autoRecurring.frequency,
          frequency_type: req.autoRecurring.frequencyType,
          transaction_amount: req.autoRecurring.transactionAmount,
          currency_id: req.autoRecurring.currencyId,
          ...(req.autoRecurring.startDate ? { start_date: req.autoRecurring.startDate } : {}),
          ...(req.autoRecurring.endDate ? { end_date: req.autoRecurring.endDate } : {}),
          // Note: Mercado Pago does not accept billing_day/_proportional on /preapproval (no-plan)
        },
      };
      if (req.status) payload.status = req.status;

      const response = await fetch(`${this.config.apiBaseUrl}/preapproval`, {
        method: "POST",
        headers: this.headersJson(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.message || data?.error || "Failed to create subscription" };
      }
      return {
        success: true,
        id: data?.id,
        initPoint: data?.init_point || data?.sandbox_init_point || undefined,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async createCheckoutPreference(req: MpCreatePreferenceRequest): Promise<MpCreatePreferenceResponse> {
    if (!this.isConfigured()) return { success: false, error: "MercadoPago not configured" };
    try {
      const payload: any = {
        items: [
          {
            title: req.title,
            quantity: 1,
            unit_price: req.amount,
            currency_id: req.currencyId,
          },
        ],
        payer: { email: req.payerEmail },
        external_reference: req.externalReference,
        back_urls: req.backUrls,
        auto_return: "approved",
        binary_mode: true,
        metadata: { type: "proration", ...(req.metadata || {}) },
        // Important for webhook linkage when MP omite external_reference on payments
        statement_descriptor: "EthicVoice Plan Change",
      };
      const response = await fetch(`${this.config.apiBaseUrl}/checkout/preferences`, {
        method: "POST",
        headers: this.headersJson(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.message || data?.error || "Failed to create preference" };
      }
      return {
        success: true,
        id: data?.id,
        initPoint: data?.init_point || data?.sandbox_init_point,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async getPreapproval(preapprovalId: string): Promise<any> {
    const resp = await fetch(`${this.config.apiBaseUrl}/preapproval/${preapprovalId}`, {
      method: "GET",
      headers: this.headersJson(),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.message || "Failed to fetch preapproval");
    return data;
  }

  async getPayment(paymentId: string): Promise<any> {
    const resp = await fetch(`${this.config.apiBaseUrl}/v1/payments/${paymentId}`, {
      method: "GET",
      headers: this.headersJson(),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.message || "Failed to fetch payment");
    return data;
  }

  async searchAuthorizedPayments(preapprovalId: string): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const url = `${this.config.apiBaseUrl}/authorized_payments/search?preapproval_id=${encodeURIComponent(preapprovalId)}`;
      const resp = await fetch(url, { method: "GET", headers: this.headersJson() });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data?.message || "Failed to search authorized payments" };
      const results = Array.isArray(data?.results) ? data.results : [];
      return { success: true, results };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }

  async searchPaymentsByExternalReference(externalReference: string): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const url = `${this.config.apiBaseUrl}/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}`;
      const resp = await fetch(url, { method: "GET", headers: this.headersJson() });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data?.message || data?.error || "Failed to search payments" };
      const results = Array.isArray(data?.results) ? data.results : [];
      return { success: true, results };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.isConfigured()) return { success: false, error: "MercadoPago not configured" };
    try {
      const payload: any = {};
      if (typeof amount === "number" && amount > 0) payload.amount = amount;
      const resp = await fetch(`${this.config.apiBaseUrl}/v1/payments/${paymentId}/refunds`, {
        method: "POST",
        headers: this.headersJson(),
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data?.message || data?.error || "Failed to refund payment" };
      return { success: true, id: data?.id };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }

  async updatePreapproval(
    preapprovalId: string,
    updates: {
      status?: "authorized" | "paused" | "cancelled";
      preapproval_plan_id?: string;
      auto_recurring?: Partial<{
        frequency: 1 | 3 | 6 | 12;
        frequency_type: "days" | "months";
        transaction_amount: number;
        currency_id: string;
        billing_day?: number;
        billing_day_proportional?: boolean;
      }>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) return { success: false, error: "MercadoPago not configured" };
    try {
      const resp = await fetch(`${this.config.apiBaseUrl}/preapproval/${preapprovalId}`, {
        method: "PUT",
        headers: this.headersJson(),
        body: JSON.stringify(updates),
      });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data?.message || "Failed to update preapproval" };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async cancelPreapproval(preapprovalId: string): Promise<{ success: boolean; error?: string }> {
    return this.updatePreapproval(preapprovalId, { status: "cancelled" });
  }

  private validateConfig() {
    if (!this.isConfigured()) {
      // eslint-disable-next-line no-console
      console.warn("MercadoPago service not configured. Set MERCADOPAGO_ACCESS_TOKEN");
    }
  }
}

const mercadoPagoService = new MercadoPagoService();
export default mercadoPagoService;


