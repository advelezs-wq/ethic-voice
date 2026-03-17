import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getUserPermissions } from "@/modules/core/utils/permissions";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID requerido" },
        { status: 400 }
      );
    }

    // Check user permissions
    const permissions = await getUserPermissions(userId, orgId);
    if (!permissions.canManageOrganization) {
      return NextResponse.json(
        { error: "No tienes permisos para ver la configuración" },
        { status: 403 }
      );
    }

    // Get organization data with settings
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        settings: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    // Prepare settings response
    const settings = {
      // Organization basic info
      organizationName: organization.name,
      organizationSlug: organization.slug,

      // Theme and branding settings
      theme: organization.settings?.theme || "default",
      logoUrl: organization.settings?.logoUrl || organization.logoUrl,
      primaryColor: organization.settings?.primaryColor || "#0066CC",
      secondaryColor: organization.settings?.secondaryColor || "#4A90E2",
      accentColor: organization.settings?.accentColor || "#E3F2FD",
      backgroundColor: organization.settings?.backgroundColor || "#F8FAFC",

      // Advanced settings
      customCSS: organization.settings?.customCSS,
      dashboardLayout: organization.settings?.dashboardLayout,
      emailTemplates: organization.settings?.emailTemplates,
      brandingConfig: organization.settings?.brandingConfig,
      notificationSettings: organization.settings?.notificationSettings,
      securitySettings: organization.settings?.securitySettings,
      featureFlags: organization.settings?.featureFlags,

      // Settings metadata
      settingsId: organization.settings?.id,
      settingsUpdatedAt: organization.settings?.updatedAt,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
