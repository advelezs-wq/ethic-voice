import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

/** Verifica sesión de superadmin. Devuelve el userId o una respuesta 401/403. */
export async function requireSuperAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Sesión no iniciada" }, { status: 401 }) };
  }
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!isSuperAdmin(email)) {
    return { ok: false, response: NextResponse.json({ error: "Solo el superadmin puede hacer esto" }, { status: 403 }) };
  }
  return { ok: true, userId };
}
