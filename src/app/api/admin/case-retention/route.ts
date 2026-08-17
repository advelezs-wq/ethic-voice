import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { notificationsService } from "@/modules/app/services/notifications.service";

function verifyAdminApiKey(request: NextRequest): boolean {
  const apiKey =
    request.headers.get("x-admin-api-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  const expectedApiKey = process.env.ADMIN_API_KEY;
  if (!expectedApiKey) return false;
  return apiKey === expectedApiKey;
}

// Daily cron: enforces each org's case-level retention policy (see
// Organization.caseRetentionDays). Cases under legal hold are never
// touched. Orgs that haven't opted into autoDeleteOnRetentionExpiry get a
// throttled in-app notification instead of automatic deletion — the safe
// default is a human reviews before anything is destroyed.
export async function POST(request: NextRequest) {
  const isCron = request.headers.get("x-vercel-cron");
  if (!isCron && !verifyAdminApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orgs = await prisma.organization.findMany({
      where: { caseRetentionDays: { not: null } },
      select: { id: true, autoDeleteOnRetentionExpiry: true },
    });

    let deleted = 0;
    let flaggedForReview = 0;
    let orgsNotified = 0;

    for (const org of orgs) {
      const expiredCases = await prisma.formSubmission.findMany({
        where: {
          orgId: org.id,
          status: "CLOSED",
          legalHold: false,
          retentionExpiresAt: { lte: new Date() },
        },
        select: { id: true },
      });
      if (expiredCases.length === 0) continue;

      if (org.autoDeleteOnRetentionExpiry) {
        for (const c of expiredCases) {
          await prisma.$transaction(async (tx) => {
            await tx.aiProcessingJob.deleteMany({
              where: { orgId: org.id, submissionId: c.id },
            });
            await tx.formSubmission.delete({ where: { id: c.id } });
          });
          deleted++;
        }
        continue;
      }

      flaggedForReview += expiredCases.length;

      // Throttle: don't re-notify admins every day about the same backlog.
      const recentNotification = await prisma.notification.findFirst({
        where: {
          orgId: org.id,
          type: "SYSTEM_ALERT",
          metadata: { path: ["kind"], equals: "retention_review" },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });
      if (recentNotification) continue;

      const admins = await prisma.organizationMembership.findMany({
        where: { orgId: org.id, role: "ADMIN" },
        select: { userId: true },
      });
      if (admins.length === 0) continue;

      for (const admin of admins) {
        await notificationsService.createNotification({
          userId: admin.userId,
          orgId: org.id,
          type: "SYSTEM_ALERT" as any,
          title: "Casos listos para revisión de retención",
          message: `${expiredCases.length} caso(s) cerrado(s) superaron el período de retención configurado y están listos para tu revisión.`,
          actionUrl: `/app/settings`,
          channel: "IN_APP" as any,
          metadata: { kind: "retention_review", count: expiredCases.length },
        });
      }
      orgsNotified++;
    }

    return NextResponse.json({
      ok: true,
      deleted,
      flaggedForReview,
      orgsNotified,
    });
  } catch (error) {
    console.error("❌ [CASE-RETENTION] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
