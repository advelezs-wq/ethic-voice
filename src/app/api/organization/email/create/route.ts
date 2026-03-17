import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { EmailAccountService } from "@/modules/app/services/email-account.service";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

export async function POST() {
  try {
    const { userId } = await auth();
    const orgId = await resolveOrgId();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const emailService = new EmailAccountService();
    const config = await emailService.createOrganizationEmail(orgId, userId);

    return NextResponse.json({
      success: true,
      config,
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
