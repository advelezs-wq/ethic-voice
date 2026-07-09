import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

async function assertSuperAdmin() {
  const { userId } = await auth();
  if (!userId)
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true as const, userId };
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const guard = await assertSuperAdmin();
  if (!guard.ok) return guard.response;

  const { orgId } = await context.params;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!org) {
    return NextResponse.json(
      { error: "Organización no encontrada" },
      { status: 404 }
    );
  }

  // La confirmación exige repetir el nombre exacto de la organización
  const body = await req.json().catch(() => ({}) as { confirmName?: string });
  if ((body?.confirmName || "").trim() !== org.name.trim()) {
    return NextResponse.json(
      { error: "El nombre de confirmación no coincide con la organización" },
      { status: 400 }
    );
  }

  if (org.subscriptions.length > 0) {
    return NextResponse.json(
      {
        error:
          "La organización tiene una suscripción ACTIVA. Cancélala antes de eliminarla.",
      },
      { status: 409 }
    );
  }

  try {
    // Las migraciones son SQL crudo y no todas las FK tienen ON DELETE CASCADE
    // (p. ej. FormSubmission y AiProcessingJob), así que se borra explícitamente
    // en orden de dependencia dentro de una transacción.
    await prisma.$transaction([
      prisma.paymentTransaction.deleteMany({ where: { orgId } }),
      prisma.aiProcessingJob.deleteMany({ where: { orgId } }),
      prisma.notification.deleteMany({ where: { orgId } }),
      prisma.notificationSettings.deleteMany({ where: { orgId } }),
      prisma.formSubmission.deleteMany({ where: { orgId } }),
      prisma.form.deleteMany({ where: { orgId } }),
      prisma.subscription.deleteMany({ where: { orgId } }),
      prisma.emailConfiguration.deleteMany({ where: { orgId } }),
      prisma.usageTracking.deleteMany({ where: { orgId } }),
      prisma.aiTemplate.deleteMany({ where: { orgId } }),
      prisma.processingRule.deleteMany({ where: { orgId } }),
      prisma.organizationInvitation.deleteMany({ where: { orgId } }),
      prisma.userSettings.deleteMany({ where: { organizationId: orgId } }),
      prisma.organizationSettings.deleteMany({ where: { organizationId: orgId } }),
      prisma.organizationMembership.deleteMany({ where: { orgId } }),
      prisma.department.deleteMany({ where: { orgId } }),
      prisma.organization.delete({ where: { id: orgId } }),
    ]);

    console.log(
      `🗑️ [SUPERADMIN] Organización eliminada: ${org.name} (${orgId}) por ${guard.userId}`
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ [SUPERADMIN] Error eliminando organización:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
