import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { getPlanPermissions, PlanType } from "@/types/subscription.types";

// Auth + plan gate shared by the areas/positions catalog routes
// (Configuración Avanzada → Estructura de la organización, Grow/Grow Pro/
// Premium only). Mirrors the ADMIN/superadmin check already used in
// /api/organization/[orgId]/invitations and .../members.
export async function requireOrgStructureAccess(orgId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const [requesterMembership, requesterClerkUser] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    }),
    currentUser(),
  ]);
  const requesterEmail = requesterClerkUser?.primaryEmailAddress?.emailAddress;
  const requesterIsSuperAdmin = Boolean(
    requesterEmail && isSuperAdmin(requesterEmail)
  );
  if (
    !requesterIsSuperAdmin &&
    (!requesterMembership || requesterMembership.role !== "ADMIN")
  ) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  if (!requesterIsSuperAdmin) {
    const planInfo = await getOrganizationPlanInfo(orgId);
    const permissions = getPlanPermissions(
      (planInfo?.planType as PlanType) || PlanType.STARTER
    );
    if (!permissions.canAccessAreasPositionsCatalog) {
      return {
        error: NextResponse.json(
          { error: "Esta función requiere el plan Grow o superior" },
          { status: 403 }
        ),
      };
    }
  }

  return { userId };
}
