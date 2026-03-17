import { PlanType, getPlanPermissions } from "@/types/subscription.types";
import { getOrganizationPlanInfo } from "./subscription.utils";
import { Prisma } from "@prisma/client";
import prisma from "@/modules/prisma/lib/prisma";

interface PlanValidationResult {
  isValid: boolean;
  violations: string[];
  actions: string[];
  severity: "low" | "medium" | "high" | "critical";
}

interface SecurityLog {
  orgId: string;
  userId: string;
  action: string;
  details: any;
  severity: "info" | "warning" | "error" | "critical";
  timestamp: Date;
}

class PlanSecurityManager {
  /**
   * Comprehensive plan validation to prevent abuse
   */
  async validateOrganizationPlanCompliance(
    orgId: string
  ): Promise<PlanValidationResult> {
    const violations: string[] = [];
    const actions: string[] = [];
    let severity: "low" | "medium" | "high" | "critical" = "low";

    try {
      // Get organization plan info
      const planInfo = await getOrganizationPlanInfo(orgId);
      if (!planInfo) {
        return {
          isValid: false,
          violations: ["Organization plan information not found"],
          actions: ["Restore plan information"],
          severity: "critical",
        };
      }

      const planPermissions = getPlanPermissions(
        planInfo.planType as unknown as PlanType
      );

      // 1. Validate user limits
      const userViolations = await this.validateUserLimits(
        orgId,
        planPermissions
      );
      violations.push(...userViolations.violations);
      actions.push(...userViolations.actions);
      if (userViolations.severity === "high") severity = "high";

      // 2. Validate feature usage
      const featureViolations = await this.validateFeatureUsage(
        orgId,
        planPermissions,
        planInfo.hasActivePlan
      );
      violations.push(...featureViolations.violations);
      actions.push(...featureViolations.actions);
      if (featureViolations.severity === "high") severity = "high";

      // 3. Validate subscription status
      const subscriptionViolations =
        await this.validateSubscriptionStatus(orgId);
      violations.push(...subscriptionViolations.violations);
      actions.push(...subscriptionViolations.actions);
      if (subscriptionViolations.severity === "critical") severity = "critical";

      // 4. Validate usage patterns (detect suspicious activity)
      const usageViolations = await this.validateUsagePatterns(orgId);
      violations.push(...usageViolations.violations);
      actions.push(...usageViolations.actions);
      if (usageViolations.severity === "high") severity = "high";

      // 5. Check for plan circumvention attempts
      const circumventionViolations = await this.detectPlanCircumvention(orgId);
      violations.push(...circumventionViolations.violations);
      actions.push(...circumventionViolations.actions);
      if (circumventionViolations.severity === "high") severity = "high";

      return {
        isValid: violations.length === 0,
        violations,
        actions,
        severity,
      };
    } catch (error) {
      console.error("Error validating plan compliance:", error);
      return {
        isValid: false,
        violations: ["Plan validation system error"],
        actions: ["Contact system administrator"],
        severity: "critical",
      };
    }
  }

  /**
   * Validate user count limits
   */
  private async validateUserLimits(orgId: string, planPermissions: any) {
    const violations: string[] = [];
    const actions: string[] = [];
    let severity: "low" | "medium" | "high" = "low";

    // Get current membership count
    const membershipCount = await prisma.organizationMembership.count({
      where: { orgId },
    });

    const adminCount = await prisma.organizationMembership.count({
      where: { orgId, role: "ADMIN" },
    });

    const memberCount = await prisma.organizationMembership.count({
      where: { orgId, role: "MEMBER" },
    });

    // Check total user limit
    if (
      planPermissions.maxUsersAllowed > 0 &&
      membershipCount > planPermissions.maxUsersAllowed
    ) {
      violations.push(
        `User count exceeds limit: ${membershipCount}/${planPermissions.maxUsersAllowed}`
      );
      actions.push("Remove excess users or upgrade plan");
      severity = "high";
    }

    // Check investigator (MEMBER) limit
    if (
      planPermissions.maxInvestigatorsAllowed > 0 &&
      memberCount > planPermissions.maxInvestigatorsAllowed
    ) {
      violations.push(
        `Investigator count exceeds limit: ${memberCount}/${planPermissions.maxInvestigatorsAllowed}`
      );
      actions.push("Remove excess investigators or upgrade plan");
      severity = "high";
    }

    // Check admin limit when plan specifies a max users cap representing admins
    if (
      planPermissions.maxUsersAllowed > 0 &&
      adminCount > planPermissions.maxUsersAllowed
    ) {
      violations.push(
        `Admin count exceeds limit: ${adminCount}/${planPermissions.maxUsersAllowed}`
      );
      actions.push("Reduce admins or upgrade plan");
      severity = "high";
    }

    // Usage tracking for users/investigators not supported in updateOrganizationUsage shape yet
    return { violations, actions, severity };
  }

  /**
   * Validate feature usage against plan permissions
   */
  private async validateFeatureUsage(
    orgId: string,
    planPermissions: any,
    hasActivePlan: boolean
  ) {
    const violations: string[] = [];
    const actions: string[] = [];
    let severity: "low" | "medium" | "high" = "low";

    // Check email channel usage
    if (!planPermissions.canAccessEmailChannel) {
      const emailReports = await prisma.formSubmission.count({
        where: { orgId, source: "EMAIL" },
      });

      if (emailReports > 0) {
        violations.push(
          `Email channel used without permission (${emailReports} reports)`
        );
        actions.push("Disable email channel or upgrade plan");
        severity = "high";
      }
    }

    // Check AI processing usage
    if (!planPermissions.canUseAiProcessing || !hasActivePlan) {
      const aiProcessedReports = await prisma.formSubmission.count({
        where: {
          orgId,
          aiSeverity: { not: "UNKNOWN" },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      });

      if (aiProcessedReports > 0) {
        violations.push(
          `AI processing used without permission (${aiProcessedReports} reports)`
        );
        actions.push("Disable AI processing or upgrade plan");
        severity = "high";
      }
    }

    // Check advanced analytics access
    if (!planPermissions.canAccessAdvancedAnalytics && hasActivePlan) {
      const analyticsUsage = await this.checkAdvancedAnalyticsUsage(orgId);
      if (analyticsUsage > 0) {
        violations.push("Advanced analytics accessed without permission");
        actions.push("Restrict analytics access or upgrade plan");
        severity = "medium";
      }
    }

    return { violations, actions, severity };
  }

  /**
   * Validate subscription status and payment history
   */
  private async validateSubscriptionStatus(orgId: string) {
    const violations: string[] = [];
    const actions: string[] = [];
    let severity: "low" | "medium" | "high" | "critical" = "low";

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        paymentTransactions: {
          where: {
            createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!organization) {
      violations.push("Organization not found");
      return { violations, actions, severity: "critical" as const };
    }

    const activeSubscription = organization.subscriptions[0];

    // Check for expired subscriptions
    if (
      activeSubscription &&
      activeSubscription.endDate &&
      activeSubscription.endDate < new Date()
    ) {
      violations.push("Subscription has expired");
      actions.push("Renew subscription or restrict access");
      severity = "high";
    }

    // Check for failed payments
    const failedPayments = organization.paymentTransactions.filter(
      (tx) => tx.status === "FAILED"
    );

    if (failedPayments.length > 2) {
      violations.push(
        `Multiple failed payments detected (${failedPayments.length})`
      );
      actions.push("Update payment method or suspend account");
      severity = "high";
    }

    // Check for subscription abuse patterns
    const subscriptionCount = await prisma.subscription.count({
      where: {
        orgId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    if (subscriptionCount > 5) {
      violations.push("Excessive subscription creation detected");
      actions.push("Flag for manual review");
      severity = "high";
    }

    return { violations, actions, severity };
  }

  /**
   * Validate usage patterns to detect suspicious activity
   */
  private async validateUsagePatterns(orgId: string) {
    const violations: string[] = [];
    const actions: string[] = [];
    let severity: "low" | "medium" | "high" = "low";

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Check for sudden spikes in usage
    const recentReports = await prisma.formSubmission.count({
      where: { orgId, createdAt: { gte: thirtyDaysAgo } },
    });

    const previousReports = await prisma.formSubmission.count({
      where: {
        orgId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo,
        },
      },
    });

    // Detect unusual usage spikes (10x increase)
    if (previousReports > 0 && recentReports > previousReports * 10) {
      violations.push("Unusual usage spike detected");
      actions.push("Monitor for abuse patterns");
      severity = "medium";
    }

    // Check for rapid user creation
    const recentUsers = await prisma.organizationMembership.count({
      where: { orgId, createdAt: { gte: thirtyDaysAgo } },
    });

    if (recentUsers > 50) {
      violations.push("Rapid user creation detected");
      actions.push("Review user creation patterns");
      severity = "medium";
    }

    // Check for API abuse patterns
    const recentApiUsage = await this.checkApiUsagePatterns(orgId);
    if (recentApiUsage.suspicious) {
      violations.push("Suspicious API usage patterns detected");
      actions.push("Rate limit API access");
      severity = "high";
    }

    return { violations, actions, severity };
  }

  /**
   * Detect attempts to circumvent plan restrictions
   */
  private async detectPlanCircumvention(orgId: string) {
    const violations: string[] = [];
    const actions: string[] = [];
    let severity: "low" | "medium" | "high" | "critical" = "low";

    // Check for multiple organizations by same user (potential plan evasion)
    const orgMemberships = await prisma.organizationMembership.findMany({
      where: { orgId },
      include: {
        user: {
          include: {
            memberships: {
              where: {
                role: "ADMIN",
                NOT: { orgId },
              },
            },
          },
        },
      },
    });

    const adminsWithMultipleOrgs = orgMemberships.filter(
      (membership) =>
        membership.role === "ADMIN" && membership.user.memberships.length > 0
    );

    if (adminsWithMultipleOrgs.length > 0) {
      violations.push("Admin users found in multiple organizations");
      actions.push("Review for plan evasion");
      severity = "medium";
    }

    // Check for rapid plan downgrades and upgrades (churning)
    const recentSubscriptions = await prisma.subscription.findMany({
      where: {
        orgId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentSubscriptions.length > 3) {
      violations.push("Frequent plan changes detected");
      actions.push("Restrict plan changes temporarily");
      severity = "high";
    }

    // Check for attempts to access restricted features
    const restrictedFeatureAttempts =
      await this.checkRestrictedFeatureAccess(orgId);
    if (restrictedFeatureAttempts > 10) {
      violations.push("Multiple attempts to access restricted features");
      actions.push("Monitor organization closely");
      severity = "high";
    }

    return { violations, actions, severity };
  }

  /**
   * Enforce corrective actions based on violations
   */
  async enforceComplianceActions(
    orgId: string,
    actions: string[]
  ): Promise<void> {
    for (const action of actions) {
      switch (action) {
        case "Remove excess users or upgrade plan":
          await this.enforceUserLimits(orgId);
          break;
        case "Disable email channel or upgrade plan":
          await this.disableEmailChannel(orgId);
          break;
        case "Disable AI processing or upgrade plan":
          await this.disableAiProcessing(orgId);
          break;
        case "Restrict analytics access or upgrade plan":
          await this.restrictAnalyticsAccess(orgId);
          break;
        case "Suspend account":
          await this.suspendAccount(orgId);
          break;
        default:
          console.log(`Manual action required: ${action}`);
      }
    }
  }

  /**
   * Log security events
   */
  async logSecurityEvent(log: SecurityLog): Promise<void> {
    // In a real implementation, this would go to a security log database
    console.log(`[SECURITY] ${log.severity.toUpperCase()}: ${log.action}`, {
      orgId: log.orgId,
      userId: log.userId,
      details: log.details,
      timestamp: log.timestamp,
    });

    // Ensure JSON-safe log (e.g., Date → ISO string)
    const jsonLog = {
      ...log,
      timestamp: log.timestamp instanceof Date
        ? log.timestamp.toISOString()
        : String(log.timestamp),
    } as const;

    // Read existing settings to append to JSON array safely
    const existing = await prisma.organizationSettings.findUnique({
      where: { organizationId: log.orgId },
      select: { securitySettings: true, id: true },
    });

    if (!existing) {
      await prisma.organizationSettings.create({
        data: {
          organizationId: log.orgId,
          securitySettings: { logs: [jsonLog] } as Prisma.InputJsonValue,
        },
      });
      return;
    }

    const current = (existing.securitySettings ?? {}) as Record<string, unknown>;
    const currentLogs = Array.isArray((current as any).logs)
      ? ([...(current as any).logs] as unknown[])
      : ([] as unknown[]);
    const newSettings = {
      ...current,
      logs: [...currentLogs, jsonLog],
    };

    await prisma.organizationSettings.update({
      where: { organizationId: log.orgId },
      data: { securitySettings: newSettings as Prisma.InputJsonValue },
    });
  }

  // Helper methods for enforcement
  private async enforceUserLimits(orgId: string): Promise<void> {
    const planInfo = await getOrganizationPlanInfo(orgId);
    if (!planInfo) return;

    const planPermissions = getPlanPermissions(
      planInfo.planType as unknown as PlanType
    );

    if (planPermissions.maxUsersAllowed > 0) {
      // Get excess users (newest first, keep oldest)
      const excessUsers = await prisma.organizationMembership.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        skip: planPermissions.maxUsersAllowed,
      });

      // Remove excess users
      for (const user of excessUsers) {
        await prisma.organizationMembership.delete({
          where: { id: user.id },
        });

        await this.logSecurityEvent({
          orgId,
          userId: user.userId,
          action: "User removed due to plan limit violation",
          details: { userRole: user.role },
          severity: "warning",
          timestamp: new Date(),
        });
      }
    }
  }

  private async disableEmailChannel(orgId: string): Promise<void> {
    await prisma.emailConfiguration.updateMany({
      where: { orgId },
      data: { isActive: false },
    });

    await prisma.organization.update({
      where: { id: orgId },
      data: { isEmailChannelActive: false },
    });
  }

  private async disableAiProcessing(orgId: string): Promise<void> {
    await prisma.organization.update({
      where: { id: orgId },
      data: { isAiProcessingActive: false },
    });
  }

  private async restrictAnalyticsAccess(orgId: string): Promise<void> {
    await prisma.organizationSettings.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        featureFlags: { restrictedAnalytics: true },
      },
      update: {
        featureFlags: { restrictedAnalytics: true },
      },
    });
  }

  private async suspendAccount(orgId: string): Promise<void> {
    await prisma.organization.update({
      where: { id: orgId },
      data: { isActive: false },
    });
  }

  // Helper methods for checks
  private async checkAdvancedAnalyticsUsage(orgId: string): Promise<number> {
    // This would check logs for advanced analytics API calls
    return 0;
  }

  private async checkApiUsagePatterns(
    orgId: string
  ): Promise<{ suspicious: boolean }> {
    // This would analyze API usage patterns
    return { suspicious: false };
  }

  private async checkRestrictedFeatureAccess(orgId: string): Promise<number> {
    // This would check logs for attempts to access restricted features
    return 0;
  }
}

// Singleton instance
export const planSecurityManager = new PlanSecurityManager();

// Utility functions
export async function validatePlanCompliance(
  orgId: string
): Promise<PlanValidationResult> {
  return planSecurityManager.validateOrganizationPlanCompliance(orgId);
}

export async function enforceCompliance(
  orgId: string,
  violations: PlanValidationResult
): Promise<void> {
  if (!violations.isValid && violations.actions.length > 0) {
    await planSecurityManager.enforceComplianceActions(
      orgId,
      violations.actions
    );
  }
}

export async function logPlanSecurityEvent(
  orgId: string,
  userId: string,
  action: string,
  details: any = {},
  severity: "info" | "warning" | "error" | "critical" = "info"
): Promise<void> {
  await planSecurityManager.logSecurityEvent({
    orgId,
    userId,
    action,
    details,
    severity,
    timestamp: new Date(),
  });
}
