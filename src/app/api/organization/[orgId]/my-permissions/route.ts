import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserPermissions, getUserRoleWithSuperAdmin } from "@/modules/core/utils/permissions";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || undefined;

    const role = await getUserRoleWithSuperAdmin(userId, orgId, email);
    const permissions = await getUserPermissions(userId, orgId, email);

    return NextResponse.json({ role, permissions });
  } catch (e) {
    console.error("Error fetching my-permissions:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


