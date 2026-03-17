import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { getPlanPermissions, PlanType } from "@/types/subscription.types";
import { PlanRestrictionReason } from "@/types/auth.types";
import prisma from "@/modules/prisma/lib/prisma";
import { getUserPermissions } from "@/modules/core/utils/permissions";

interface OrganizationSettings {
  // Basic settings (all plans)
  name?: string;
  description?: string;
  website?: string;

  // Logo customization (Starter+)
  logoUrl?: string;

  // Color theme (Grow+)
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;

  // Advanced customization (Grow Pro+)
  customCSS?: string;
  customDomain?: string;
  whiteLabel?: boolean;
  dashboardLayout?: Record<string, unknown>;
  emailTemplates?: Record<string, unknown>;
  brandingConfig?: Record<string, unknown>;

  // Premium features (Premium only)
  apiAccess?: boolean;
  ssoEnabled?: boolean;
  auditLogs?: boolean;
  securitySettings?: Record<string, unknown>;
  featureFlags?: Record<string, unknown>;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;

    // Ensure the requester has admin permission for this org
    const user = await currentUser();
    const permissions = await getUserPermissions(
      userId,
      orgId,
      user?.primaryEmailAddress?.emailAddress
    );
    if (!permissions.canManageOrganization) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    // Get organization and its settings
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        settings: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get plan information to filter settings based on permissions
    const planInfo = await getOrganizationPlanInfo(orgId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "Plan information not available" },
        { status: 404 }
      );
    }

    const planPermissions = getPlanPermissions(
      planInfo.planType as unknown as PlanType
    );
    const settings = organization.settings;

    // Build response based on plan permissions
    const response: Record<string, unknown> = {
      // Basic settings (available to all)
      name: organization.name,
      description:
        (settings?.brandingConfig as Record<string, unknown> | undefined)?.[
          "description"
        ] ?? "",
      website:
        (settings?.brandingConfig as Record<string, unknown> | undefined)?.[
          "website"
        ] ?? "",
    };

    // Logo customization (Starter+)
    if (planPermissions.canCustomizeLogo) {
      response.logoUrl = organization.logoUrl || settings?.logoUrl || "";
    }

    // Color theme (Grow+)
    if (planPermissions.canCustomizeColors && planInfo.hasActivePlan) {
      response.primaryColor = settings?.primaryColor || "#0066CC";
      response.secondaryColor = settings?.secondaryColor || "#4A90E2";
      response.accentColor = settings?.accentColor || "#E3F2FD";
      response.backgroundColor = settings?.backgroundColor || "#F8FAFC";
    }

    // Advanced customization (Grow Pro+)
    if (
      planPermissions.canAccessUnlimitedCustomization &&
      planInfo.hasActivePlan
    ) {
      response.customCSS = settings?.customCSS || "";
      response.customDomain =
        (settings?.brandingConfig as Record<string, unknown> | undefined)?.[
          "customDomain"
        ] ?? "";
      response.whiteLabel =
        (settings?.brandingConfig as Record<string, unknown> | undefined)?.[
          "whiteLabel"
        ] ?? false;
      response.dashboardLayout = settings?.dashboardLayout || {};
      response.emailTemplates = settings?.emailTemplates || {};
    }

    // Premium features (Premium only)
    if (planInfo.planType === "PREMIUM" && planInfo.hasActivePlan) {
      response.apiAccess =
        ((settings?.featureFlags as Record<string, unknown> | undefined)?.[
          "apiAccess"
        ] as boolean | undefined) ?? false;
      response.ssoEnabled =
        ((settings?.securitySettings as Record<string, unknown> | undefined)?.[
          "ssoEnabled"
        ] as boolean | undefined) ?? false;
      response.auditLogs =
        ((settings?.securitySettings as Record<string, unknown> | undefined)?.[
          "auditLogs"
        ] as boolean | undefined) ?? false;
    }

    // Include plan information for frontend
    response._planInfo = {
      planType: planInfo.planType,
      permissions: {
        canCustomizeLogo: planPermissions.canCustomizeLogo,
        canCustomizeColors:
          planPermissions.canCustomizeColors && planInfo.hasActivePlan,
        canAccessUnlimitedCustomization:
          planPermissions.canAccessUnlimitedCustomization &&
          planInfo.hasActivePlan,
        isPremium: planInfo.planType === "PREMIUM" && planInfo.hasActivePlan,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting organization settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const updates: OrganizationSettings = await req.json();

    // Ensure the requester has admin permission for this org
    const user = await currentUser();
    const permissions = await getUserPermissions(
      userId,
      orgId,
      user?.primaryEmailAddress?.emailAddress
    );
    if (!permissions.canManageOrganization) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    // Get plan information to validate permissions
    const planInfo = await getOrganizationPlanInfo(orgId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "Plan information not available" },
        { status: 404 }
      );
    }

    const planPermissions = getPlanPermissions(
      planInfo.planType as unknown as PlanType
    );

    // Enforce plan restrictions: theme/colors and dashboard layout are only for GROW+
    const isStarter = planInfo.planType === "STARTER";

    if (isStarter) {
      const forbiddenKeys = [
        "theme",
        "primaryColor",
        "secondaryColor",
        "accentColor",
        "backgroundColor",
        "customCSS",
        "dashboardLayout",
      ] as const;

      const attemptingRestricted = Object.keys(updates).some((k) =>
        // @ts-expect-error runtime check
        forbiddenKeys.includes(k)
      );

      if (attemptingRestricted) {
        return NextResponse.json(
          {
            error:
              "Tu plan STARTER no permite personalizar el tema ni la estructura del dashboard. Actualiza tu plan para acceder a esta función.",
            upgradeUrl: "/app/billing",
          },
          { status: 403 }
        );
      }
    }

    // Validate plan restrictions for each type of setting
    const _validationErrors: string[] = [];

    // Logo customization check
    if (updates.logoUrl !== undefined && !planPermissions.canCustomizeLogo) {
      return NextResponse.json(
        {
          error: "Logo customization not available in current plan",
          code: "FEATURE_RESTRICTED",
          restriction: {
            reason: PlanRestrictionReason.PLAN_UPGRADE_REQUIRED,
            message: "Logo customization requires Starter plan or higher",
            requiredPlan: "STARTER",
          },
        },
        { status: 403 }
      );
    }

    // Color theme check
    if (
      (updates.primaryColor !== undefined ||
        updates.secondaryColor !== undefined ||
        updates.accentColor !== undefined) &&
      (!planPermissions.canCustomizeColors || !planInfo.hasActivePlan)
    ) {
      return NextResponse.json(
        {
          error: "Color customization not available in current plan",
          code: "FEATURE_RESTRICTED",
          restriction: {
            reason: PlanRestrictionReason.PLAN_UPGRADE_REQUIRED,
            message:
              "Color customization requires Grow plan or higher with an active subscription",
            requiredPlan: "GROW",
          },
        },
        { status: 403 }
      );
    }

    // Advanced customization check
    if (
      (updates.customCSS !== undefined ||
        updates.customDomain !== undefined ||
        updates.whiteLabel !== undefined) &&
      (!planPermissions.canAccessUnlimitedCustomization ||
        !planInfo.hasActivePlan)
    ) {
      return NextResponse.json(
        {
          error: "Advanced customization not available in current plan",
          code: "FEATURE_RESTRICTED",
          restriction: {
            reason: PlanRestrictionReason.PLAN_UPGRADE_REQUIRED,
            message: "Advanced customization requires Grow Pro plan or higher",
            requiredPlan: "GROW_PRO",
          },
        },
        { status: 403 }
      );
    }

    // Premium features check
    if (
      (updates.apiAccess !== undefined ||
        updates.ssoEnabled !== undefined ||
        updates.auditLogs !== undefined) &&
      (planInfo.planType !== "PREMIUM" || !planInfo.hasActivePlan)
    ) {
      return NextResponse.json(
        {
          error: "Premium features not available in current plan",
          code: "FEATURE_RESTRICTED",
          restriction: {
            reason: PlanRestrictionReason.PLAN_UPGRADE_REQUIRED,
            message: "Premium features require Premium plan",
            requiredPlan: "PREMIUM",
          },
        },
        { status: 403 }
      );
    }

    // If we reach here, all validations passed - proceed with updates
    await prisma.$transaction(async (tx) => {
      // Update basic organization info
      if (updates.name || updates.logoUrl !== undefined) {
        await tx.organization.update({
          where: { id: orgId },
          data: {
            ...(updates.name && { name: updates.name }),
            ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl }),
          },
        });
      }

      // Get or create organization settings
      let orgSettings = await tx.organizationSettings.findUnique({
        where: { organizationId: orgId },
      });

      if (!orgSettings) {
        orgSettings = await tx.organizationSettings.create({
          data: {
            organizationId: orgId,
            theme: "default",
            primaryColor: "#0066CC",
            secondaryColor: "#4A90E2",
            accentColor: "#E3F2FD",
            backgroundColor: "#F8FAFC",
            isActive: true,
          },
        });
      }

      // Prepare settings updates
      const settingsUpdates: Record<string, unknown> = {};

      // Color theme updates
      if (updates.primaryColor !== undefined)
        settingsUpdates.primaryColor = updates.primaryColor;
      if (updates.secondaryColor !== undefined)
        settingsUpdates.secondaryColor = updates.secondaryColor;
      if (updates.accentColor !== undefined)
        settingsUpdates.accentColor = updates.accentColor;
      if (updates.backgroundColor !== undefined)
        settingsUpdates.backgroundColor = updates.backgroundColor;
      if (updates.customCSS !== undefined)
        settingsUpdates.customCSS = updates.customCSS;

      // Branding config updates
      const brandingConfig =
        (orgSettings.brandingConfig as Record<string, unknown>) || {};
      if (updates.description !== undefined)
        brandingConfig.description = updates.description;
      if (updates.website !== undefined)
        brandingConfig.website = updates.website;
      if (updates.customDomain !== undefined)
        brandingConfig.customDomain = updates.customDomain;
      if (updates.whiteLabel !== undefined)
        brandingConfig.whiteLabel = updates.whiteLabel;

      if (Object.keys(brandingConfig).length > 0) {
        settingsUpdates.brandingConfig = brandingConfig;
      }

      // Security settings for premium features
      if (updates.ssoEnabled !== undefined || updates.auditLogs !== undefined) {
        const securitySettings =
          (orgSettings.securitySettings as Record<string, unknown>) || {};
        if (updates.ssoEnabled !== undefined)
          securitySettings.ssoEnabled = updates.ssoEnabled;
        if (updates.auditLogs !== undefined)
          securitySettings.auditLogs = updates.auditLogs;
        settingsUpdates.securitySettings = securitySettings;
      }

      // Feature flags
      if (updates.apiAccess !== undefined) {
        const featureFlags =
          (orgSettings.featureFlags as Record<string, unknown>) || {};
        featureFlags.apiAccess = updates.apiAccess;
        settingsUpdates.featureFlags = featureFlags;
      }

      // Update settings if there are changes
      if (Object.keys(settingsUpdates).length > 0) {
        await tx.organizationSettings.update({
          where: { id: orgSettings.id },
          data: {
            ...settingsUpdates,
            updatedAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
