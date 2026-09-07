import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { requireOrgStructureAccess } from "@/modules/core/utils/org-structure-guard";
import { getAreaOptionsForAdmin } from "@/actions/org-structure.actions";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await context.params;
  const guard = await requireOrgStructureAccess(orgId);
  if (guard.error) return guard.error;

  const areas = await getAreaOptionsForAdmin(orgId);
  return NextResponse.json({ areas });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await context.params;
  const guard = await requireOrgStructureAccess(orgId);
  if (guard.error) return guard.error;

  const { label } = await req.json();
  if (!label || typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const maxOrder = await prisma.organizationAreaOption.aggregate({
    where: { orgId },
    _max: { sortOrder: true },
  });

  const area = await prisma.organizationAreaOption.create({
    data: {
      orgId,
      label: label.trim(),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ area });
}
