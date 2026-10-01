import { NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { requireSuperAdmin } from "@/modules/core/utils/superadmin-guard";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

/**
 * Listado de clientes para el superadmin. Siempre devuelve todas las
 * organizaciones: antes se filtraba por la cookie de "vista por organización"
 * y, tras entrar a un cliente, la lista mostraba solo ese.
 */
export async function GET() {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      memberships: { select: { role: true, user: { select: { email: true } } } },
      emailConfigurations: { select: { emailAddress: true, isActive: true }, take: 1 },
      invitations: { where: { status: "pending" }, select: { email: true }, take: 1 },
      _count: { select: { complaints: true } },
    },
  });

  const data = organizations.map((org) => {
    const sub = org.subscriptions[0] ?? null;
    // Los superadmins no cuentan como miembros del cliente.
    const clientMembers = org.memberships.filter((m) => !isSuperAdmin(m.user?.email || ""));
    const admin = clientMembers.find((m) => m.role === "ADMIN");
    const email = org.emailConfigurations[0] ?? null;
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      isActive: org.isActive,
      plan: sub?.planType ?? org.currentPlan ?? null,
      subscription: sub
        ? {
            id: sub.id,
            status: sub.status,
            endDate: sub.endDate,
            billing: (sub.metadata as Record<string, unknown> | null)?.gateway === "WOMPI" ? "wompi" : "manual",
          }
        : null,
      adminEmail: admin?.user?.email ?? org.invitations[0]?.email ?? null,
      adminPending: !admin && org.invitations.length > 0,
      members: clientMembers.length,
      reports: org._count.complaints,
      emailChannel: email ? { address: email.emailAddress, active: email.isActive } : null,
    };
  });

  return NextResponse.json({ organizations: data });
}
