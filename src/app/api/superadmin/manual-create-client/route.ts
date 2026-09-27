import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireSuperAdmin } from "@/modules/core/utils/superadmin-guard";
import { ClientAdminError, createClient } from "@/modules/app/services/client-admin.service";

/** Crea un cliente: organización + administrador + plan (sin cobro). */
export async function POST(req: NextRequest) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  try {
    const clerk = await clerkClient();
    const result = await createClient(
      {
        email: body.email,
        name: body.name,
        organizationName: body.organizationName,
        planType: body.planType,
        // Compatibilidad con el formulario anterior (inviteInstead: boolean).
        mode: body.mode ?? (body.inviteInstead ? "invite" : "create"),
      },
      { userId: guard.userId },
      clerk as never,
    );
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const status = e instanceof ClientAdminError ? e.status : 500;
    const message = e instanceof Error ? e.message : "No se pudo crear el cliente";
    return NextResponse.json({ error: message }, { status });
  }
}
