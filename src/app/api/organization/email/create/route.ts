import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { EmailAccountService } from "@/modules/app/services/email-account.service";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

export async function POST() {
  try {
    const { userId } = await auth();
    const orgId = await resolveOrgId();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const emailService = new EmailAccountService();
    const config = await emailService.createOrganizationEmail(
      orgId,
      userId,
      userEmail
    );

    return NextResponse.json({
      success: true,
      config,
      message:
        "Bandeja creada correctamente. Debes activarla manualmente para comenzar a detectar denuncias.",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error creating email:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "Tu plan no incluye la bandeja de entrada por email. Disponible en GROW o superior.",
      },
      { status: 400 }
    );
  }
}
