import { PlanType, SubscriptionPermissions } from "./subscription.types";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORG_ADMIN = "ORG_ADMIN",
  ORG_MEMBER = "ORG_MEMBER",
}

export interface UserPermissions {
  canViewAllOrganizations: boolean;
  canCreateOrganization: boolean;
  canViewAllReports: boolean;
  canAssignReports: boolean;
  canEditReports: boolean;
  canViewAssignedReports: boolean;
  canManageOrganization: boolean;
  canInviteMembers: boolean;
  canViewOrganizationStats: boolean;
  canViewTeamStats: boolean;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  orgId: string;
  role: "ADMIN" | "MEMBER";
  isBlocked?: boolean;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface RoleContext {
  role: UserRole;
  permissions: UserPermissions;
  organizationRole?: "ADMIN" | "MEMBER";
  isSuperAdmin: boolean;
}

// Enhanced role context that includes plan-based permissions
export interface EnhancedRoleContext extends RoleContext {
  planPermissions?: SubscriptionPermissions;
  currentPlan?: PlanType;
  hasActivePlan: boolean;
  planRestrictions: string[];
  isTrialActive: boolean;
  trialDaysRemaining?: number;
}

// Combined permissions that merge role permissions with plan permissions
export interface CombinedPermissions extends UserPermissions {
  // Channel access (plan-based)
  canAccessWebForm: boolean;
  canAccessEmailChannel: boolean;
  canAccessChatbot: boolean;
  canAccessPhone: boolean;

  // User management (plan-based limits)
  canCreateUsers: boolean;
  canCreateUnlimitedUsers: boolean;
  canManageInvestigators: boolean;
  maxUsersAllowed: number;
  maxInvestigatorsAllowed: number;

  // AI capabilities (plan-based)
  canUseAiProcessing: boolean;
  canUseAdvancedAi: boolean;

  // Analytics access (plan-based)
  canAccessBasicAnalytics: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessAllAnalytics: boolean;

  // Customization (plan-based)
  canCustomizeLogo: boolean;
  canCustomizeColors: boolean;
  canAccessUnlimitedCustomization: boolean;

  // System access (plan-based)
  canAccessAllSettings: boolean;
  canAccessAdvancedFeatures: boolean;
}

// Organization plan info for frontend display
export interface OrganizationPlanInfo {
  planType: PlanType;
  planName: string;
  hasActivePlan: boolean;
  isTrialActive: boolean;
  trialDaysRemaining?: number;
  planExpiresAt?: Date;

  // Usage tracking
  currentUsers: number;
  maxUsers: number;
  currentInvestigators: number;
  maxInvestigators: number;
  emailReportsThisMonth: number;
  aiProcessingThisMonth: number;

  // Plan restrictions
  isOverUserLimit: boolean;
  isOverInvestigatorLimit: boolean;
  restrictions: string[];

  // Upgrade info
  canUpgrade: boolean;
  nextPlan?: PlanType;
  upgradeUrl?: string;
}

// Plan restriction reasons
export enum PlanRestrictionReason {
  PLAN_REQUIRED = "PLAN_REQUIRED",
  PLAN_UPGRADE_REQUIRED = "PLAN_UPGRADE_REQUIRED",
  USER_LIMIT_EXCEEDED = "USER_LIMIT_EXCEEDED",
  INVESTIGATOR_LIMIT_EXCEEDED = "INVESTIGATOR_LIMIT_EXCEEDED",
  FEATURE_NOT_AVAILABLE = "FEATURE_NOT_AVAILABLE",
  TRIAL_EXPIRED = "TRIAL_EXPIRED",
  SUBSCRIPTION_INACTIVE = "SUBSCRIPTION_INACTIVE",
}

// Plan restriction information
export interface PlanRestriction {
  reason: PlanRestrictionReason;
  message: string;
  requiredPlan?: PlanType;
  upgradeUrl?: string;
  currentUsage?: number;
  limit?: number;
}
