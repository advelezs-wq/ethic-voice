// Rebill Types for Subscription Management
// Based on standard payment gateway patterns

export interface RebillConfig {
  apiKey: string;
  secretKey: string;
  environment: "sandbox" | "production";
  apiUrl: string;
  webhookSecret: string;
}

export interface RebillCustomer {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  document?: {
    type: "CC" | "NIT" | "CE" | "PP";
    number: string;
  };
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  metadata?: Record<string, any>;
}

export interface RebillProduct {
  id?: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RebillPrice {
  id?: string;
  productId: string;
  amount: number;
  currency: "COP";
  interval: "month" | "year";
  intervalCount: number;
  trialPeriodDays?: number;
  metadata?: Record<string, any>;
}

export interface RebillSubscription {
  id?: string;
  customerId: string;
  priceId: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialStart?: string;
  trialEnd?: string;
  canceledAt?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, any>;
}

export interface RebillPaymentMethod {
  id?: string;
  type: "card" | "pse" | "nequi" | "cash";
  card?: {
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  };
  metadata?: Record<string, any>;
}

export interface RebillCreateSubscriptionRequest {
  customer: RebillCustomer;
  priceId: string;
  paymentMethod?: RebillPaymentMethod;
  trialPeriodDays?: number;
  metadata?: Record<string, any>;
  returnUrl?: string;
}

export interface RebillCreateSubscriptionResponse {
  subscription: RebillSubscription;
  customer: RebillCustomer;
  checkoutUrl?: string;
  clientSecret?: string;
}

export interface RebillWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  apiVersion: string;
}

export interface RebillError {
  type: string;
  code: string;
  message: string;
  param?: string;
}

// Plan Configuration for EthicVoice
export interface EthicVoicePlan {
  rebillPriceId: string;
  planType: "STARTER" | "GROW" | "GROW_PRO" | "PREMIUM";
  name: string;
  amount: number;
  currency: "COP";
  interval: "month";
  trialDays: number;
  features: {
    maxUsers: number;
    maxInvestigators: number;
    maxEmployees: number;
    hasEmailChannel: boolean;
    hasAiProcessing: boolean;
    hasChatbotChannel: boolean;
    hasPhoneChannel: boolean;
    hasExternalManager: boolean;
    hasBilingualSupport: boolean;
    hasUnlimitedUsers: boolean;
    hasAdvancedAnalytics: boolean;
    hasLogoCustomization: boolean;
    hasColorThemes: boolean;
    hasUnlimitedCustomization: boolean;
  };
}

// Rebill Plans Configuration
export const REBILL_PLANS: Record<string, EthicVoicePlan> = {
  STARTER: {
    rebillPriceId: "price_starter_cop_monthly", // To be replaced with actual Rebill price IDs
    planType: "STARTER",
    name: "Starter Plan",
    amount: 150000,
    currency: "COP",
    interval: "month",
    trialDays: 14,
    features: {
      maxUsers: 1,
      maxInvestigators: 4,
      maxEmployees: 50,
      hasEmailChannel: false,
      hasAiProcessing: false,
      hasChatbotChannel: false,
      hasPhoneChannel: false,
      hasExternalManager: false,
      hasBilingualSupport: false,
      hasUnlimitedUsers: false,
      hasAdvancedAnalytics: false,
      hasLogoCustomization: true,
      hasColorThemes: false,
      hasUnlimitedCustomization: false,
    },
  },
  GROW: {
    rebillPriceId: "price_grow_cop_monthly",
    planType: "GROW",
    name: "Grow Plan",
    amount: 420000,
    currency: "COP",
    interval: "month",
    trialDays: 14,
    features: {
      maxUsers: 1,
      maxInvestigators: 10,
      maxEmployees: 200,
      hasEmailChannel: true,
      hasAiProcessing: true,
      hasChatbotChannel: false,
      hasPhoneChannel: false,
      hasExternalManager: false,
      hasBilingualSupport: false,
      hasUnlimitedUsers: false,
      hasAdvancedAnalytics: false,
      hasLogoCustomization: true,
      hasColorThemes: true,
      hasUnlimitedCustomization: false,
    },
  },
  GROW_PRO: {
    rebillPriceId: "price_grow_pro_cop_monthly",
    planType: "GROW_PRO",
    name: "Grow Pro Plan",
    amount: 1200000,
    currency: "COP",
    interval: "month",
    trialDays: 14,
    features: {
      maxUsers: 1,
      maxInvestigators: 25,
      maxEmployees: 1000,
      hasEmailChannel: true,
      hasAiProcessing: true,
      hasChatbotChannel: true,
      hasPhoneChannel: true,
      hasExternalManager: true,
      hasBilingualSupport: true,
      hasUnlimitedUsers: false,
      hasAdvancedAnalytics: true,
      hasLogoCustomization: true,
      hasColorThemes: true,
      hasUnlimitedCustomization: true,
    },
  },
  PREMIUM: {
    rebillPriceId: "price_premium_cop_monthly",
    planType: "PREMIUM",
    name: "Premium Plan",
    amount: 0, // Custom pricing
    currency: "COP",
    interval: "month",
    trialDays: 14,
    features: {
      maxUsers: -1, // Unlimited
      maxInvestigators: -1,
      maxEmployees: -1,
      hasEmailChannel: true,
      hasAiProcessing: true,
      hasChatbotChannel: true,
      hasPhoneChannel: true,
      hasExternalManager: true,
      hasBilingualSupport: true,
      hasUnlimitedUsers: true,
      hasAdvancedAnalytics: true,
      hasLogoCustomization: true,
      hasColorThemes: true,
      hasUnlimitedCustomization: true,
    },
  },
};

export default REBILL_PLANS;
