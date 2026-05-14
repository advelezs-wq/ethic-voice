import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { EmailAccountService } from "@/modules/app/services/email-account.service";

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    const orgId = await resolveOrgId();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const activate = body?.activate === true;

    const emailService = new EmailAccountService();
    const config = await emailService.setEmailActivation(
      orgId,
      userId,
      activate,
      userEmail
    );

    return NextResponse.json({
      success: true,
      config,
      message: activate
        ? "Bandeja activada. A partir de ahora se detectarán denuncias enviadas a esta dirección."
        : "Bandeja desactivada. Se detuvo la detección de nuevas denuncias por correo.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado de la bandeja",
      },
      { status: 400 }
    );
  }
}
