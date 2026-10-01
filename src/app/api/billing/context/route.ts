import { NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { findAdminOrganizationId } from "@/modules/app/services/organization-setup.service";
import { billingUser } from "@/modules/app/services/billing-auth";

/** Qué necesita saber el checkout: si el usuario ya tiene organización y qué plan paga. */
export async function GET() {
  const user = await billingUser();
  if (!user) return NextResponse.json({ error: "Sesión no iniciada" }, { status: 401 });
  const adminOrgId = await findAdminOrganizationId(user.userId);
  const isMemberElsewhere = !adminOrgId && (await prisma.organizationMembership.count({ where: { userId: user.userId } })) > 0;
  if (!adminOrgId) return NextResponse.json({ email: user.email, organization: null, isMemberElsewhere });
  const org = await prisma.organization.findUnique({ where: { id: adminOrgId }, select: { id: true, name: true, hasActivePlan: true } });
  const sub = await prisma.subscription.findFirst({
    where: { orgId: adminOrgId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { planType: true, billingCycle: true, metadata: true },
  });
  return NextResponse.json({
    email: user.email,
    organization: org,
    current: sub
      ? { planType: sub.planType, billingCycle: sub.billingCycle, online: (sub.metadata as Record<string, unknown> | null)?.gateway === "WOMPI" }
      : null,
  });
}
