import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { ReportStatus } from "@prisma/client";

function normalizeStatusFilter(tab: string | null) {
  if (tab === "archived") return { status: "ARCHIVED" as ReportStatus };
  if (tab === "closed")
    return { status: { in: ["CLOSED", "RESOLVED"] as ReportStatus[] } };
  return { status: { notIn: ["ARCHIVED", "CLOSED", "RESOLVED"] as ReportStatus[] } };
}

async function assertSuperAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, userId, userName: user?.fullName || "Super Admin" };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const guard = await assertSuperAdmin();
  if (!guard.ok) return guard.response;

  const { orgId } = await context.params;
  const tab = req.nextUrl.searchParams.get("tab");
  const q = req.nextUrl.searchParams.get("q") || "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(10, Number(req.nextUrl.searchParams.get("pageSize") || "20")));
  const skip = (page - 1) * pageSize;

  const where = {
    orgId,
    ...normalizeStatusFilter(tab),
    ...(q
      ? {
          OR: [
            { aiSummary: { contains: q, mode: "insensitive" as const } },
            { reporterName: { contains: q, mode: "insensitive" as const } },
            { reporterEmail: { contains: q, mode: "insensitive" as const } },
            { content: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        status: true,
        aiSeverity: true,
        aiSummary: true,
        source: true,
        submittedAt: true,
        reporterName: true,
        reporterEmail: true,
        isAnonymous: true,
      },
    }),
    prisma.formSubmission.count({ where }),
  ]);

  return NextResponse.json({
    reports,
    total,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const guard = await assertSuperAdmin();
  if (!guard.ok) return guard.response;

  const { orgId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const reportId = Number(body?.reportId);
  const status = String(body?.status || "").toUpperCase() as ReportStatus;
  const allowed: ReportStatus[] = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED", "ARCHIVED"];

  if (!reportId || !allowed.includes(status)) {
    return NextResponse.json(
      { error: "reportId y status valido son requeridos" },
      { status: 400 }
    );
  }

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
    select: { id: true, status: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.formSubmission.update({
      where: { id: reportId },
      data: {
        status,
        processedAt: status === "CLOSED" || status === "RESOLVED" ? new Date() : null,
      },
    }),
    prisma.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "STATUS_CHANGED",
        details: { oldStatus: report.status, newStatus: status, changedBy: "superadmin" },
        userId: guard.userId,
        userName: guard.userName,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
