import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAvailableMembersForAssignment } from "@/actions/report-assignments.actions";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const { searchParams } = new URL(req.url);
    const reportIdParam = searchParams.get("reportId");
    const departmentId = searchParams.get("departmentId") || undefined;

    const reportId = reportIdParam ? Number(reportIdParam) : NaN;
    if (!orgId || !reportId || Number.isNaN(reportId)) {
      return NextResponse.json(
        { error: "Organization ID y reportId son requeridos" },
        { status: 400 }
      );
    }

    const members = await getAvailableMembersForAssignment(
      reportId,
      departmentId
    );

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error getting available investigators:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
