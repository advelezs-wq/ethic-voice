import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { EmailAccountService } from "@/modules/app/services/email-account.service";

export async function GET() {
  try {
    const { userId } = await auth();
    const orgId = await resolveOrgId();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Enforce plan: Starter cannot access email channel
    const planInfo = await getOrganizationPlanInfo(orgId);
    const emailService = new EmailAccountService();
    await emailService.enforceEmailChannelPlanCompliance(orgId);
    if (!planInfo?.features?.hasEmailChannel) {
      return NextResponse.json({
        config: null,
        restriction: {
          feature: "email_channel",
          message:
            "Tu plan actual no incluye canal de correo. Actualiza tu plan para activar esta función.",
        },
      });
    }

    const config = await emailService.getOrganizationEmailConfiguration(
      orgId,
      userId,
      userEmail
    );

    return NextResponse.json({
      config,
      activationAllowed: Boolean(
        planInfo?.hasActivePlan && planInfo?.features?.hasEmailChannel
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Error obteniendo configuración" },
      { status: 500 }
    );
  }
}
