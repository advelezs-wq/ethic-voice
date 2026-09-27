import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { requireSuperAdmin } from "@/modules/core/utils/superadmin-guard";
import { ClientAdminError, deleteClient } from "@/modules/app/services/client-admin.service";

type Ctx = { params: Promise<{ orgId: string }> };

/** Actualiza datos básicos del cliente: nombre y acceso (activo/suspendido). */
export async function PATCH(req: NextRequest, context: Ctx) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;
  const { orgId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const data: { name?: string; isActive?: boolean } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) return NextResponse.json({ error: "El nombre es demasiado corto" }, { status: 400 });
    const dup = await prisma.organization.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, id: { not: orgId } },
      select: { id: true },
    });
    if (dup) return NextResponse.json({ error: "Ya existe otra organización con ese nombre" }, { status: 409 });
    data.name = name;
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar" }, { status: 400 });
  }

  const exists = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  const org = await prisma.organization.update({
    where: { id: orgId },
    data,
    select: { id: true, name: true, isActive: true },
  });
  return NextResponse.json({ success: true, organization: org });
}

/**
 * Elimina el cliente y todos sus datos. Exige escribir el nombre exacto.
 * Cancela antes el cobro en Mercado Pago y el alias de correo en ImprovMX.
 */
export async function DELETE(req: NextRequest, context: Ctx) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;
  const { orgId } = await context.params;
  const body = await req.json().catch(() => ({}));
  try {
    const { warnings } = await deleteClient(orgId, body?.confirmName);
    console.log(`🗑️ [SUPERADMIN] Organización ${orgId} eliminada por ${guard.userId}`);
    return NextResponse.json({ success: true, warnings });
  } catch (e) {
    const status = e instanceof ClientAdminError ? e.status : 500;
    const message = e instanceof Error ? e.message : "No se pudo eliminar";
    if (!(e instanceof ClientAdminError)) console.error("❌ [SUPERADMIN] delete org", e);
    return NextResponse.json({ error: message }, { status });
  }
}
