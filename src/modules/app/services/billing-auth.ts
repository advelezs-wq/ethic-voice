import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { ClientAdminError } from "@/modules/app/services/client-admin.service";
import { WompiError } from "@/modules/app/services/wompi.service";

export async function billingUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const u = await currentUser();
  return { userId, email: u?.primaryEmailAddress?.emailAddress || u?.emailAddresses?.[0]?.emailAddress || "" };
}

/** Organización activa del usuario y su rol en ella. */
export async function billingContext() {
  const user = await billingUser();
  if (!user) return { error: NextResponse.json({ error: "Sesión no iniciada" }, { status: 401 }) } as const;
  const orgId = await resolveOrgId();
  const membership = orgId
    ? await prisma.organizationMembership.findUnique({ where: { userId_orgId: { userId: user.userId, orgId } }, select: { role: true, isBlocked: true } })
    : null;
  return { ...user, orgId: membership && !membership.isBlocked ? orgId : null, isAdmin: membership?.role === "ADMIN" && !membership.isBlocked } as const;
}

export function billingError(e: unknown) {
  if (e instanceof ClientAdminError || e instanceof WompiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error("[billing]", e);
  return NextResponse.json({ error: "No se pudo completar la operación. Intenta de nuevo." }, { status: 500 });
}
