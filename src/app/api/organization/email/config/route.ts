import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

export async function GET() {
  try {
    const { userId } = await auth();
    const orgId = await resolveOrgId();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Enforce plan: Starter cannot access email channel
    const planInfo = await getOrganizationPlanInfo(orgId);
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

    const config = await prisma.emailConfiguration.findUnique({
      where: { orgId },
    });

    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      { error: "Error obteniendo configuración" },
      { status: 500 }
    );
  }
}
