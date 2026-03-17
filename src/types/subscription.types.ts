export enum PlanType {
  STARTER = "STARTER",
  GROW = "GROW",
  GROW_PRO = "GROW_PRO",
  PREMIUM = "PREMIUM",
}

export enum BillingCycle {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

// Lightweight subscription shape used by client providers and API responses
export interface Subscription {
  id: number | string;
  status: SubscriptionStatus | string;
  planType?: PlanType | string;
  organizationId?: string | null;
  organizationName?: string | null;
  createdAt?: Date | string;
  endDate?: Date | string | null;
  billingCycle?: BillingCycle;
}

export interface PlanFeatures {
  // Channel access
  hasWebForm: boolean;
  hasEmailChannel: boolean;
  hasChatbotChannel: boolean;
  hasPhoneChannel: boolean;

  // AI capabilities
  hasAiProcessing: boolean;
  hasAiAssistance: boolean;
  hasAdvancedAi: boolean;

  // User limits
  maxUsers: number;
  maxInvestigators: number;
  maxEmployees: number;
  hasUnlimitedUsers: boolean;

  // Analytics and reporting
  hasBasicAnalytics: boolean;
  hasAdvancedAnalytics: boolean;
  hasResponseTimeTracking: boolean;
  hasSegmentedReports: boolean;

  // Customization
  hasLogoCustomization: boolean;
  hasColorThemes: boolean;
  // General customization flag used across the app
  hasCustomization: boolean;
  hasUnlimitedCustomization: boolean;
  hasPersonalizedLanding: boolean;

  // Support and management
  hasExternalManager: boolean;
  hasBilingualSupport: boolean;
  hasSharedSupport: boolean;
  hasPersonalizedSupport: boolean;
  hasPrioritySupport: boolean;

  // Training and consulting
  hasBasicTraining: boolean;
  hasAdvancedTraining: boolean;
  hasInvestigationTraining: boolean;
  hasConsulting: boolean;
  hasLegalSupport: boolean;

  // Display features for pricing page
  highlights: string[];
  additionalFeatures?: string[];
}

export interface PlanConfig {
  type: PlanType;
  name: string;
  displayName: string;
  price: {
    monthly: number;
    yearly?: number;
    currency: string;
  };
  description: string;
  targetAudience: string;
  features: PlanFeatures;
  badge?: string;
  isPopular?: boolean;
  isEnterprise?: boolean;
}

export interface SubscriptionPermissions {
  // Channel permissions
  canAccessWebForm: boolean;
  canAccessEmailChannel: boolean;
  canAccessChatbot: boolean;
  canAccessPhone: boolean;

  // User management permissions
  canCreateUsers: boolean;
  canCreateUnlimitedUsers: boolean;
  canManageInvestigators: boolean;
  maxUsersAllowed: number;
  maxInvestigatorsAllowed: number;

  // AI permissions
  canUseAiProcessing: boolean;
  canUseAdvancedAi: boolean;

  // Analytics permissions
  canAccessBasicAnalytics: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessAllAnalytics: boolean;

  // Customization permissions
  canCustomizeLogo: boolean;
  canCustomizeColors: boolean;
  canAccessUnlimitedCustomization: boolean;

  // System permissions
  canAccessAllSettings: boolean;
  canAccessAdvancedFeatures: boolean;
}

export type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "CANCELLED"
  | "PAST_DUE"
  | "PAUSED"
  | "PENDING_CANCELLATION";

export interface SubscriptionFeatures {
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
  hasCustomization: boolean;
  hasColorThemes: boolean;
  hasUnlimitedCustomization: boolean;
}

export interface SubscriptionMetadata {
  planChangeHistory?: Array<{
    fromPlan: PlanType;
    toPlan: PlanType;
    fromBilling: BillingCycle;
    toBilling: BillingCycle;
    changedAt: string;
    prorationAmount: number;
    reason: string;
  }>;
  renewalHistory?: Array<{
    renewedAt: string;
    amount: number;
    nextBillingDate: string;
  }>;
  cancellation?: {
    cancelledAt: string;
    reason: string;
    effectiveDate: string;
    cancelMode: "immediate" | "end_of_period";
    refundAmount?: number;
  };
  reactivation?: {
    reactivatedAt: string;
    previousStatus: SubscriptionStatus;
    newPlan: PlanType;
  };
  webhookEvents?: Array<{
    type: string;
    receivedAt: string;
    data: any;
  }>;
  lastPaymentFailure?: {
    failedAt: string;
    reason: string;
    amount: number;
  };
  lastRenewal?: string;
  lastPlanChange?: string;
  lastStatusChange?: string;
  activatedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  rebillSubscription?: any;
  pendingPayment?: any;
}

export interface BillingHistoryItem {
  id: number;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  providerTransactionId?: string;
  createdAt: Date;
  metadata?: any;
}

export interface BillingHistory {
  subscription: {
    id: number;
    planType: PlanType;
    planName: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    startDate?: Date;
    endDate?: Date;
    monthlyPrice?: number;
    yearlyPrice?: number;
    currency?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  transactions: BillingHistoryItem[];
  planChangeHistory: SubscriptionMetadata["planChangeHistory"];
  summary: {
    totalPaid: number;
    totalRefunded: number;
    netAmount: number;
    transactionCount: number;
    planChanges: number;
  };
}

export interface SubscriptionChangeOptions {
  subscriptionId: number;
  newPlanType: PlanType;
  newBillingCycle?: BillingCycle;
  prorationMode?: "immediate" | "next_cycle";
  effectiveDate?: Date;
}

export interface CancellationOptions {
  subscriptionId: number;
  reason?: string;
  cancelMode?: "immediate" | "end_of_period";
  effectiveDate?: Date;
}

export interface SubscriptionUpgradeInfo {
  currentPlan: PlanType;
  targetPlan: PlanType;
  isUpgrade: boolean;
  priceDifference: number;
  prorationAmount?: number;
  newFeatures: string[];
  removedFeatures: string[];
}

export interface SubscriptionStats {
  totalActiveSubscriptions: number;
  totalRevenue: number;
  averageRevenue: number;
  churnRate: number;
  upgradeRate: number;
  downgradeRate: number;
  mostPopularPlan: PlanType;
}

// ✅ Enhanced plan configuration with detailed features
export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  STARTER: {
    type: PlanType.STARTER,
    name: "Starter",
    displayName: "EthicVoice Starter",
    description:
      "Plan básico para organizaciones con hasta 50 empleados. Canal web básico y analíticas esenciales.",
    targetAudience: "Para organizaciones pequeñas",
    price: {
      monthly: 50,
      yearly: 540,
      currency: "USD",
    },
    features: {
      // Channel access
      hasWebForm: true,
      hasEmailChannel: false,
      hasChatbotChannel: false,
      hasPhoneChannel: false,

      // AI capabilities
      hasAiProcessing: false,
      hasAiAssistance: false,
      hasAdvancedAi: false,

      // User limits
      maxUsers: 1,
      maxInvestigators: 2,
      maxEmployees: 50,
      hasUnlimitedUsers: false,

      // Analytics and reporting
      hasBasicAnalytics: true,
      hasAdvancedAnalytics: false,
      hasResponseTimeTracking: false,
      hasSegmentedReports: false,

      // Customization
      hasLogoCustomization: true,
      hasColorThemes: false,
      hasCustomization: true,
      hasUnlimitedCustomization: false,
      hasPersonalizedLanding: false,

      // Support and management
      hasExternalManager: false,
      hasBilingualSupport: false,
      hasSharedSupport: true,
      hasPersonalizedSupport: false,
      hasPrioritySupport: false,

      // Training and consulting
      hasBasicTraining: false,
      hasAdvancedTraining: false,
      hasInvestigationTraining: false,
      hasConsulting: false,
      hasLegalSupport: false,

      // Display features for pricing page
      highlights: [
        "1 usuario admin",
        "2 investigadores",
        "Hasta 50 colaboradores",
        "Formulario web",
        "Analíticas de gestión",
      ],
    },
    isPopular: false,
    isEnterprise: false,
  },
  GROW: {
    type: PlanType.GROW,
    name: "Grow",
    displayName: "EthicVoice Grow",
    description:
      "Plan popular para organizaciones con hasta 200 empleados. Incluye canal email y procesamiento IA.",
    targetAudience: "Para organizaciones en crecimiento",
    price: {
      monthly: 120,
      yearly: 1296,
      currency: "USD",
    },
    features: {
      // Channel access
      hasWebForm: true,
      hasEmailChannel: true,
      hasChatbotChannel: false,
      hasPhoneChannel: false,

      // AI capabilities
      hasAiProcessing: true,
      hasAiAssistance: true,
      hasAdvancedAi: true,

      // User limits
      maxUsers: 1,
      maxInvestigators: 10,
      maxEmployees: 200,
      hasUnlimitedUsers: false,

      // Analytics and reporting
      hasBasicAnalytics: true,
      hasAdvancedAnalytics: false,
      hasResponseTimeTracking: false,
      hasSegmentedReports: false,

      // Customization
      hasLogoCustomization: true,
      hasColorThemes: true,
      hasCustomization: true,
      hasUnlimitedCustomization: false,
      hasPersonalizedLanding: false,

      // Support and management
      hasExternalManager: false,
      hasBilingualSupport: false,
      hasSharedSupport: true,
      hasPersonalizedSupport: true, // Chat personalizado
      hasPrioritySupport: false,

      // Training and consulting
      hasBasicTraining: true,
      hasAdvancedTraining: true,
      hasInvestigationTraining: true,
      hasConsulting: false,
      hasLegalSupport: false,

      // Display features for pricing page
      highlights: [
        "1 usuario admin",
        "10 investigadores",
        "Hasta 200 colaboradores",
        "Web asistido por IA",
        "Correo con IA avanzado",
        "Analíticas de gestión",
      ],
    },
    isPopular: true,
    isEnterprise: false,
  },
  GROW_PRO: {
    type: PlanType.GROW_PRO,
    name: "Grow Pro",
    displayName: "EthicVoice Grow Pro",
    description:
      "Plan avanzado para organizaciones con hasta 500 empleados. Incluye chatbot, IA avanzada y analíticas completas.",
    targetAudience: "Para organizaciones grandes",
    price: {
      monthly: 300,
      yearly: 3240,
      currency: "USD",
    },
    features: {
      // Channel access
      hasWebForm: true,
      hasEmailChannel: true,
      hasChatbotChannel: true,
      hasPhoneChannel: false,

      // AI capabilities
      hasAiProcessing: true,
      hasAiAssistance: true,
      hasAdvancedAi: true,

      // User limits
      maxUsers: 2,
      maxInvestigators: -1,
      maxEmployees: 500,
      hasUnlimitedUsers: false,

      // Analytics and reporting
      hasBasicAnalytics: true,
      hasAdvancedAnalytics: true,
      hasResponseTimeTracking: true,
      hasSegmentedReports: false,

      // Customization
      hasLogoCustomization: true,
      hasColorThemes: true,
      hasCustomization: true,
      hasUnlimitedCustomization: true,
      hasPersonalizedLanding: false,

      // Support and management
      hasExternalManager: true,
      hasBilingualSupport: false,
      hasSharedSupport: false,
      hasPersonalizedSupport: true,
      hasPrioritySupport: true,

      // Training and consulting
      hasBasicTraining: true,
      hasAdvancedTraining: true,
      hasInvestigationTraining: true,
      hasConsulting: true,
      hasLegalSupport: false,

      // Display features for pricing page
      highlights: [
        "1 usuario admin",
        "Investigadores ilimitados",
        "Hasta 500 colaboradores",
        "Web + Correo IA + Chatbot",
        "IA avanzada",
        "Gestor ético externo",
        "Analíticas avanzadas y tiempos",
      ],
    },
    isPopular: false,
    isEnterprise: false,
  },
  PREMIUM: {
    type: PlanType.PREMIUM,
    name: "Premium",
    displayName: "EthicVoice Premium",
    description:
      "Máxima protección y personalización: análisis predictivos, soporte 24/7, flujos de trabajo a medida y cumplimiento total de estándares internacionales.",
    targetAudience: "Para empresas corporativas",
    price: {
      monthly: 0,
      yearly: 0,
      currency: "USD",
    },
    features: {
      // Channel access
      hasWebForm: true,
      hasEmailChannel: true,
      hasChatbotChannel: true,
      hasPhoneChannel: true,

      // AI capabilities
      hasAiProcessing: true,
      hasAiAssistance: true,
      hasAdvancedAi: true,

      // User limits
      maxUsers: -1, // Unlimited
      maxInvestigators: -1, // Unlimited
      maxEmployees: -1, // Unlimited
      hasUnlimitedUsers: true,

      // Analytics and reporting
      hasBasicAnalytics: true,
      hasAdvancedAnalytics: true,
      hasResponseTimeTracking: true,
      hasSegmentedReports: true,

      // Customization
      hasLogoCustomization: true,
      hasColorThemes: true,
      hasCustomization: true,
      hasUnlimitedCustomization: true,
      hasPersonalizedLanding: true,

      // Support and management
      hasExternalManager: true,
      hasBilingualSupport: true,
      hasSharedSupport: false,
      hasPersonalizedSupport: true,
      hasPrioritySupport: true,

      // Training and consulting
      hasBasicTraining: true,
      hasAdvancedTraining: true,
      hasInvestigationTraining: true,
      hasConsulting: true,
      hasLegalSupport: true,

      // Display features for pricing page
      highlights: [
        "1 admin + investigadores ilimitados",
        "Todos los canales (Web, Email, Chatbot, 018000)",
        "IA avanzada completa",
        "Soporte premium 24/7",
        "Consultoría y legal",
        "Personalización total",
      ],
    },
    isPopular: false,
    isEnterprise: true,
  },
};

// ✅ Utility functions
export function isPlanUpgrade(
  currentPlan: PlanType,
  targetPlan: PlanType
): boolean {
  const planOrder = [
    PlanType.STARTER,
    PlanType.GROW,
    PlanType.GROW_PRO,
    PlanType.PREMIUM,
  ];
  const currentTier = planOrder.indexOf(currentPlan);
  const targetTier = planOrder.indexOf(targetPlan);
  return targetTier > currentTier;
}

export function calculatePriceDifference(
  currentPlan: PlanType,
  targetPlan: PlanType,
  billingCycle: BillingCycle
): number {
  const currentPrice =
    billingCycle === "YEARLY"
      ? PLAN_CONFIGS[currentPlan].price.yearly
      : PLAN_CONFIGS[currentPlan].price.monthly;

  const targetPrice =
    billingCycle === "YEARLY"
      ? PLAN_CONFIGS[targetPlan].price.yearly
      : PLAN_CONFIGS[targetPlan].price.monthly;

  if (!currentPrice || !targetPrice) return 0;

  return targetPrice - currentPrice;
}

export function getFeatureDifferences(
  currentPlan: PlanType,
  targetPlan: PlanType
): { newFeatures: string[]; removedFeatures: string[] } {
  const currentFeatures = PLAN_CONFIGS[currentPlan].features;
  const targetFeatures = PLAN_CONFIGS[targetPlan].features;

  const newFeatures: string[] = [];
  const removedFeatures: string[] = [];

  // Compare boolean features
  Object.entries(targetFeatures).forEach(([key, value]) => {
    if (typeof value === "boolean" && key.startsWith("has")) {
      const currentValue = currentFeatures[key as keyof SubscriptionFeatures];
      if (value && !currentValue) {
        newFeatures.push(
          key
            .replace("has", "")
            .replace(/([A-Z])/g, " $1")
            .trim()
        );
      } else if (!value && currentValue) {
        removedFeatures.push(
          key
            .replace("has", "")
            .replace(/([A-Z])/g, " $1")
            .trim()
        );
      }
    }
  });

  // Compare numeric features
  if (targetFeatures.maxUsers > currentFeatures.maxUsers) {
    newFeatures.push(
      `Increased user limit to ${targetFeatures.maxUsers === -1 ? "unlimited" : targetFeatures.maxUsers}`
    );
  } else if (
    targetFeatures.maxUsers < currentFeatures.maxUsers &&
    targetFeatures.maxUsers !== -1
  ) {
    removedFeatures.push(`Reduced user limit to ${targetFeatures.maxUsers}`);
  }

  return { newFeatures, removedFeatures };
}

// ✅ Enhanced price formatting for Colombian pesos with responsive design
export function formatPrice(amount: number, currency: string = "COP"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// ✅ Smart price formatting for UI display - handles long COP numbers elegantly
export function formatPriceForUI(
  amount: number,
  currency: string = "COP"
): {
  formatted: string;
  size: "small" | "medium" | "large";
} {
  if (amount >= 1000000) {
    // For millions (1M+): Show abbreviated format like Colombian sites
    const millions = amount / 1000000;
    const formatted =
      millions >= 10 ? `$${millions.toFixed(0)}M` : `$${millions.toFixed(1)}M`;
    return { formatted, size: "medium" };
  } else if (amount >= 100000) {
    // For hundreds of thousands: Use K notation
    const thousands = amount / 1000;
    const formatted = `$${thousands}K`;
    return { formatted, size: "medium" };
  } else {
    // For smaller amounts: Use standard Colombian format with periods
    const formatted = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
    return { formatted, size: "large" };
  }
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case "ACTIVE":
      return "text-green-600 bg-green-100";
    case "TRIALING":
      return "text-blue-600 bg-blue-100";
    case "CANCELLED":
      return "text-red-600 bg-red-100";
    case "PAST_DUE":
      return "text-orange-600 bg-orange-100";
    case "PAUSED":
      return "text-yellow-600 bg-yellow-100";
    case "PENDING_CANCELLATION":
      return "text-purple-600 bg-purple-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Activa";
    case "TRIALING":
      return "Periodo de prueba";
    case "CANCELLED":
      return "Cancelada";
    case "PAST_DUE":
      return "Pago vencido";
    case "PAUSED":
      return "Pausada";
    case "PENDING_CANCELLATION":
      return "Cancelación pendiente";
    default:
      return "Desconocido";
  }
}

// ✅ Plan permissions interface for backward compatibility
export interface SubscriptionPermissions {
  canAccessWebForm: boolean;
  canAccessEmailChannel: boolean;
  canAccessChatbot: boolean;
  canAccessPhone: boolean;
  canCreateUsers: boolean;
  canCreateUnlimitedUsers: boolean;
  canManageInvestigators: boolean;
  maxUsersAllowed: number;
  maxInvestigatorsAllowed: number;
  canUseAiProcessing: boolean;
  canUseAdvancedAi: boolean;
  canAccessBasicAnalytics: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessAllAnalytics: boolean;
  canCustomizeLogo: boolean;
  canCustomizeColors: boolean;
  canAccessUnlimitedCustomization: boolean;
  canAccessAllSettings: boolean;
  canAccessAdvancedFeatures: boolean;
}

// ✅ Get plan permissions function for backward compatibility
export const getPlanPermissions = (
  planType: PlanType
): SubscriptionPermissions => {
  const config = PLAN_CONFIGS[planType];

  return {
    canAccessWebForm: true, // All plans have web form
    canAccessEmailChannel: config.features.hasEmailChannel,
    canAccessChatbot: config.features.hasChatbotChannel,
    canAccessPhone: config.features.hasPhoneChannel,
    canCreateUsers: true,
    canCreateUnlimitedUsers: config.features.hasUnlimitedUsers,
    canManageInvestigators: true,
    maxUsersAllowed: config.features.maxUsers,
    maxInvestigatorsAllowed: config.features.maxInvestigators,
    canUseAiProcessing: config.features.hasAiProcessing,
    canUseAdvancedAi: config.features.hasAiProcessing, // Same as basic AI for now
    canAccessBasicAnalytics: true, // All plans have basic analytics
    canAccessAdvancedAnalytics: config.features.hasAdvancedAnalytics,
    canAccessAllAnalytics: config.features.hasAdvancedAnalytics,
    canCustomizeLogo: true, // All plans can customize logo
    canCustomizeColors: config.features.hasColorThemes,
    canAccessUnlimitedCustomization: config.features.hasUnlimitedCustomization,
    canAccessAllSettings: config.features.hasUnlimitedCustomization,
    canAccessAdvancedFeatures:
      config.type === PlanType.GROW_PRO || config.type === PlanType.PREMIUM, // Grow Pro and Premium
  };
};

export interface PendingSubscription {
  id: string;
  userId: string;
  planType: PlanType;
  billingCycle: BillingCycle;
  paymentProvider: "MERCADO_PAGO";
  paymentId?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  expiresAt: Date;
}

export interface SubscriptionUpgrade {
  fromPlan: PlanType;
  toPlan: PlanType;
  effectiveDate: Date;
  prorationAmount?: number;
}

export interface PlanUsageInfo {
  currentUsers: number;
  maxUsers: number;
  currentInvestigators: number;
  maxInvestigators: number;
  emailReportsThisMonth: number;
  aiProcessingThisMonth: number;
  isOverLimit: boolean;
  restrictions: string[];
}
