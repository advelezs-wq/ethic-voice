import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getUserPermissions } from "@/modules/core/utils/permissions";

const VALID_THEMES = ["default", "green", "purple", "orange", "dark"];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { organizationId, themeId } = await request.json();

    if (!organizationId || !themeId) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    if (!VALID_THEMES.includes(themeId)) {
      return NextResponse.json({ error: "Tema no válido" }, { status: 400 });
    }

    // Check user permissions
    const permissions = await getUserPermissions(userId, organizationId);
    if (!permissions.canManageOrganization) {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar la organización" },
        { status: 403 }
      );
    }

    // Update organization theme in database
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        brandColor: themeId, // Store theme ID in brandColor field
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      themeId: themeId,
      message: "Tema actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error updating theme:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
