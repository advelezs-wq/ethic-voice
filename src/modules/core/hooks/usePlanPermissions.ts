"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import {
  PlanType,
  SubscriptionPermissions,
  getPlanPermissions,
  PLAN_CONFIGS,
} from "@/types/subscription.types";
import {
  OrganizationPlanInfo,
  PlanRestriction,
  PlanRestrictionReason,
} from "@/types/auth.types";
import { isSuperAdmin } from "../utils/permissions";

interface UsePlanPermissionsReturn {
  // Plan information
  planInfo: OrganizationPlanInfo | null;
  permissions: SubscriptionPermissions | null;
  isLoading: boolean;
  error: string | null;

  // Permission checks
  hasFeature: (feature: keyof SubscriptionPermissions) => boolean;
  checkUserLimit: (
    currentCount: number,
    type: "users" | "investigators"
  ) => {
    allowed: boolean;
    restriction?: PlanRestriction;
  };

  // UI helpers
  getRestrictionMessage: (
    feature: keyof SubscriptionPermissions
  ) => PlanRestriction | null;
  getUpgradeUrl: (feature?: string) => string;

  // Usage warnings
  usageWarnings: string[];
  showTrialWarning: boolean;

  // Refresh function
  refresh: () => Promise<void>;
}

export function usePlanPermissions(): UsePlanPermissionsReturn {
  const { user } = useUser();
  const { currentOrganization } = useOrganization();
  const [planInfo, setPlanInfo] = useState<OrganizationPlanInfo | null>(null);
  const [permissions, setPermissions] =
    useState<SubscriptionPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageWarnings, setUsageWarnings] = useState<string[]>([]);

  const fetchPlanInfo = useCallback(async () => {
    // Check if user is super admin first - they get full permissions
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (userEmail && isSuperAdmin(userEmail)) {
      console.log(
        "👑 [PLAN-PERMISSIONS] Super admin detected, granting full permissions"
      );
      const superAdminPlanInfo: OrganizationPlanInfo = {
        planType: PlanType.PREMIUM,
        planName: "Super Admin Access",
        hasActivePlan: true,
        isTrialActive: false,
        trialDaysRemaining: 0,
        upgradeUrl: "/app/billing",
        emailReportsThisMonth: 0,
        aiProcessingThisMonth: 0,
        isOverUserLimit: false,
        isOverInvestigatorLimit: false,
        restrictions: [],
        canUpgrade: false,
        currentUsers: 0,
        maxUsers: 999999,
        currentInvestigators: 0,
        maxInvestigators: 999999,
      };
      setPlanInfo(superAdminPlanInfo);
      setPermissions(getPlanPermissions(PlanType.PREMIUM));
      setIsLoading(false);
      return;
    }

    // Do not query plan-info until a DB organization exists
    if (!currentOrganization?.id || String(currentOrganization.id).startsWith("org_")) {
      setPlanInfo(null);
      setPermissions(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/organization/${currentOrganization.id}/plan-info`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch plan information");
      }

      const data = await response.json();

      // Normalize API response which may return limits nested
      const normalized: OrganizationPlanInfo = {
        planType: data.planType,
        planName:
          PLAN_CONFIGS[data.planType as PlanType]?.displayName || data.planType,
        hasActivePlan: Boolean(data.hasActivePlan),
        isTrialActive: Boolean(
          data.isTrialActive || data.subscriptionStatus === "TRIALING"
        ),
        trialDaysRemaining: data.trialDaysRemaining ?? 0,
        currentUsers: data.currentUsers ?? 0,
        maxUsers:
          data.maxUsers ??
          data.limits?.maxUsers ??
          PLAN_CONFIGS[data.planType as PlanType]?.features.maxUsers ??
          1,
        currentInvestigators: data.currentInvestigators ?? 0,
        maxInvestigators:
          data.maxInvestigators ??
          data.limits?.maxInvestigators ??
          PLAN_CONFIGS[data.planType as PlanType]?.features.maxInvestigators ??
          4,
        emailReportsThisMonth: data.emailReportsThisMonth ?? 0,
        aiProcessingThisMonth: data.aiProcessingThisMonth ?? 0,
        isOverUserLimit: Boolean(data.isOverUserLimit),
        isOverInvestigatorLimit: Boolean(data.isOverInvestigatorLimit),
        restrictions: data.restrictions ?? [],
        canUpgrade: true,
        upgradeUrl: "/app/billing",
      };

      setPlanInfo(normalized);
      setPermissions(getPlanPermissions(normalized.planType));

      // Generate usage warnings
      const warnings: string[] = [];

      if (normalized.maxUsers > 0) {
        const userUsagePercent =
          (normalized.currentUsers / normalized.maxUsers) * 100;
        if (userUsagePercent >= 80) {
          warnings.push(
            `You're using ${normalized.currentUsers}/${normalized.maxUsers} users (${Math.round(userUsagePercent)}%)`
          );
        }
      }

      if (normalized.maxInvestigators > 0) {
        const investigatorUsagePercent =
          (normalized.currentInvestigators / normalized.maxInvestigators) * 100;
        if (investigatorUsagePercent >= 80) {
          warnings.push(
            `You're using ${normalized.currentInvestigators}/${normalized.maxInvestigators} investigators (${Math.round(investigatorUsagePercent)}%)`
          );
        }
      }

      setUsageWarnings(warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPlanInfo(null);
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchPlanInfo();
  }, [fetchPlanInfo]);

  const hasFeature = useCallback(
    (feature: keyof SubscriptionPermissions): boolean => {
      if (!permissions || !planInfo) return false;
      return Boolean(permissions[feature]) && planInfo.hasActivePlan;
    },
    [permissions, planInfo]
  );

  const checkUserLimit = useCallback(
    (
      currentCount: number,
      type: "users" | "investigators"
    ): { allowed: boolean; restriction?: PlanRestriction } => {
      if (!permissions || !planInfo) {
        return { allowed: false };
      }

      const isUnlimited =
        type === "users"
          ? permissions.canCreateUnlimitedUsers ||
            permissions.maxUsersAllowed === -1
          : permissions.maxInvestigatorsAllowed === -1;

      if (isUnlimited) {
        return { allowed: true };
      }

      const limit =
        type === "users"
          ? permissions.maxUsersAllowed
          : permissions.maxInvestigatorsAllowed;

      if (currentCount >= limit) {
        return {
          allowed: false,
          restriction: {
            reason:
              type === "users"
                ? PlanRestrictionReason.USER_LIMIT_EXCEEDED
                : PlanRestrictionReason.INVESTIGATOR_LIMIT_EXCEEDED,
            message: `${type === "users" ? "User" : "Investigator"} limit reached (${currentCount}/${limit})`,
            currentUsage: currentCount,
            limit,
            upgradeUrl: planInfo.upgradeUrl,
          },
        };
      }

      return { allowed: true };
    },
    [permissions, planInfo]
  );

  const getRestrictionMessage = useCallback(
    (feature: keyof SubscriptionPermissions): PlanRestriction | null => {
      if (!permissions || !planInfo) return null;

      if (hasFeature(feature)) {
        return null; // No restriction
      }

      // Find the minimum plan that supports this feature
      const planOrder = [
        PlanType.STARTER,
        PlanType.GROW,
        PlanType.GROW_PRO,
        PlanType.PREMIUM,
      ];
      let requiredPlan: PlanType | undefined;

      for (const plan of planOrder) {
        const planPermissions = getPlanPermissions(plan);
        if (planPermissions[feature]) {
          requiredPlan = plan;
          break;
        }
      }

      if (!planInfo.hasActivePlan) {
        return {
          reason: PlanRestrictionReason.SUBSCRIPTION_INACTIVE,
          message:
            "Your subscription is not active. Please activate your plan to access this feature.",
          requiredPlan: planInfo.planType,
          upgradeUrl: `/app/organization?tab=billing`,
        };
      }

      if (!requiredPlan) {
        return {
          reason: PlanRestrictionReason.FEATURE_NOT_AVAILABLE,
          message: "This feature is not available in any plan.",
        };
      }

      return {
        reason: PlanRestrictionReason.PLAN_UPGRADE_REQUIRED,
        message: `This feature requires the ${requiredPlan} plan or higher.`,
        requiredPlan,
        upgradeUrl: planInfo.upgradeUrl || "/app/organization?tab=billing",
      };
    },
    [permissions, planInfo, hasFeature]
  );

  const getUpgradeUrl = useCallback(
    (feature?: string): string => {
      if (!planInfo) return "/pricing";

      const baseUrl = planInfo.upgradeUrl || "/pricing";

      if (feature) {
        const url = new URL(baseUrl, window.location.origin);
        url.searchParams.set("feature", feature);
        return url.pathname + url.search;
      }

      return baseUrl;
    },
    [planInfo]
  );

  const showTrialWarning =
    planInfo?.isTrialActive &&
    planInfo?.trialDaysRemaining !== undefined &&
    planInfo.trialDaysRemaining <= 3;

  return {
    planInfo,
    permissions,
    isLoading,
    error,
    hasFeature,
    checkUserLimit,
    getRestrictionMessage,
    getUpgradeUrl,
    usageWarnings,
    showTrialWarning: showTrialWarning || false,
    refresh: fetchPlanInfo,
  };
}
