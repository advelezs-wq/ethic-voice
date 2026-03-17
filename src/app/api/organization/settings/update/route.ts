/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getUserPermissions } from "@/modules/core/utils/permissions";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { getPlanPermissions, PlanType } from "@/types/subscription.types";
import { Prisma } from "@prisma/client";

interface OrganizationSettingsUpdate {
  theme?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  customCSS?: string;
  dashboardLayout?: Prisma.JsonValue;
  emailTemplates?: Prisma.JsonValue;
  brandingConfig?: Prisma.JsonValue;
  notificationSettings?: Prisma.JsonValue;
  securitySettings?: Prisma.JsonValue;
  featureFlags?: Prisma.JsonValue;
}

const VALID_THEMES = [
  "default",
  "green",
  "purple",
  "orange",
  "dark",
  "dark-green",
  "dark-purple",
  "dark-orange",
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { organizationId, settings } = (await request.json()) as {
      organizationId: string;
      settings: OrganizationSettingsUpdate;
    };

    if (!organizationId || !settings) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Validate theme if provided
    if (settings.theme && !VALID_THEMES.includes(settings.theme)) {
      return NextResponse.json({ error: "Tema no válido" }, { status: 400 });
    }

    // Check user permissions
    const permissions = await getUserPermissions(userId, organizationId);
    if (!permissions.canManageOrganization) {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar la configuración" },
        { status: 403 }
      );
    }

    // Enforce plan restrictions (STARTER cannot change theme/colors/layout)
    const planInfo = await getOrganizationPlanInfo(organizationId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "Plan no disponible" },
        { status: 404 }
      );
    }
    const planPerms = getPlanPermissions(planInfo.planType as PlanType);
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

      const attemptingRestricted = Object.keys(settings).some((k) =>
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

    // Upsert organization settings
    const updatedSettings = await prisma.organizationSettings.upsert({
      where: { organizationId },
      update: {
        ...settings,
        updatedAt: new Date(),
      } as any,
      create: {
        organizationId,
        ...settings,
      } as any,
      include: {
        organization: true,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: "Configuración actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
