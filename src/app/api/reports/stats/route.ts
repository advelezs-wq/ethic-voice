import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getReportsStats } from "@/actions/reports-stats";
import { getUserPermissions } from "@/modules/core/utils/permissions";

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId") || authOrgId;
    const memberId = searchParams.get("memberId"); // Optional for member-specific stats

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID requerido" },
        { status: 400 }
      );
    }

    // Check user permissions
    const permissions = await getUserPermissions(
      userId,
      orgId,
      user?.primaryEmailAddress?.emailAddress
    );

    if (!permissions.canViewAllReports && !permissions.canViewAssignedReports) {
      return NextResponse.json(
        { error: "No tienes permisos para ver estadísticas de reportes" },
        { status: 403 }
      );
    }

    // Get reports stats using the existing action
    // For members without explicit memberId param, pass current userId to restrict to assignments
    const effectiveMemberId =
      memberId ||
      (!permissions.canViewAllReports && permissions.canViewAssignedReports
        ? userId
        : undefined);
    const stats = await getReportsStats(orgId, effectiveMemberId ?? undefined);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching reports stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
