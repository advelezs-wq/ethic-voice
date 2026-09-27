import prisma from "@/modules/prisma/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { ClientAdminError } from "@/modules/app/services/client-admin.service";
import { createOwnOrganization } from "@/modules/app/services/organization-setup.service";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // If requester is SUPER ADMIN, return all organizations
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

    if (userEmail && isSuperAdmin(userEmail)) {
      const organizations = await prisma.organization.findMany({
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ organizations });
    }

    // Otherwise, return organizations where the user is a member
    const organizations = await prisma.organization.findMany({
      where: {
        memberships: { some: { userId } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ organizations });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

/**
 * El cliente crea su organización después de pagar su plan. Los superadmins
 * crean clientes (con administrador y plan) desde /app/superadmin/clients.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sesión no iniciada" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || null;
  if (email && isSuperAdmin(email)) {
    return NextResponse.json(
      { error: "Crea los clientes desde Superadmin → Clientes." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  try {
    const result = await createOwnOrganization({ userId, email, name: body?.name });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const status = e instanceof ClientAdminError ? e.status : 500;
    if (!(e instanceof ClientAdminError)) console.error("[organizations] create failed", e);
    return NextResponse.json(
      { error: e instanceof ClientAdminError ? e.message : "No se pudo crear la organización. Intenta de nuevo." },
      { status }
    );
  }
}
