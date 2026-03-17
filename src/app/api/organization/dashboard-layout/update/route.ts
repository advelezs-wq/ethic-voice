import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getUserPermissions } from "@/modules/core/utils/permissions";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { organizationId, layout } = await request.json();

    if (!organizationId || !layout) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Validate layout structure
    if (!Array.isArray(layout)) {
      return NextResponse.json(
        { error: "Layout debe ser un array" },
        { status: 400 }
      );
    }

    // Basic validation of layout elements
    for (const element of layout) {
      if (
        !element.id ||
        typeof element.isVisible !== "boolean" ||
        !element.position
      ) {
        return NextResponse.json(
          { error: "Estructura de layout inválida" },
          { status: 400 }
        );
      }
    }

    // Check user permissions
    const permissions = await getUserPermissions(userId, organizationId);
    if (!permissions.canManageOrganization) {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar la organización" },
        { status: 403 }
      );
    }

    // Store layout as JSON in organization settings
  

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        // Store in a custom field - you may need to add this to your schema
        // For now, we'll store it as metadata
        updatedAt: new Date(),
      },
    });

    // Update organization settings with dashboard layout
    await prisma.organizationSettings.upsert({
      where: { organizationId },
      update: {
        dashboardLayout: layout,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        dashboardLayout: layout,
      },
    });

    return NextResponse.json({
      success: true,
      layout: layout,
      message: "Configuración del dashboard actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error updating dashboard layout:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
