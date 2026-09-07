import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { requireOrgStructureAccess } from "@/modules/core/utils/org-structure-guard";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await context.params;
  const guard = await requireOrgStructureAccess(orgId);
  if (guard.error) return guard.error;

  const existing = await prisma.organizationPositionOption.findUnique({
    where: { id },
  });
  if (!existing || existing.orgId !== orgId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const data: { label?: string; isActive?: boolean } = {};
  if (typeof body.label === "string" && body.label.trim()) {
    data.label = body.label.trim();
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  const position = await prisma.organizationPositionOption.update({
    where: { id },
    data,
  });

  return NextResponse.json({ position });
}
