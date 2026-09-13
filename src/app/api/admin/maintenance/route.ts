import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { NotificationsService } from "@/modules/app/services/notifications.service";
import { NotificationType } from "@prisma/client";
import { verifyCronOrAdminRequest } from "@/lib/security/cron-auth";

export async function GET(request: NextRequest) {
  // This route notifies orgs of pending deletion and hard-deletes (with
  // billing cancellation) orgs expired 90+ days — it has no UI caller and is
  // meant to run only via Vercel Cron or an admin script. Being under
  // /api/admin(.*) lets the platform middleware bypass Clerk for a valid
  // cron secret or API key, but *any* logged-in user would otherwise fall
  // through and reach this handler — so it needs its own explicit check
  // rather than relying on "some session exists".
  if (!verifyCronOrAdminRequest(request)) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing API key" },
      { status: 401 }
    );
  }

  try {
    const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const soonMs = 7 * 24 * 60 * 60 * 1000; // 7 días

    const orgs = await prisma.organization.findMany({
      where: { isActive: true, planExpiresAt: { not: null } },
      select: { id: true, planExpiresAt: true, memberships: { select: { userId: true } } },
    });

    const notifier = new NotificationsService();
    let warned = 0;
    let deleted = 0;

    for (const org of orgs) {
      const expiresAt = org.planExpiresAt as unknown as Date | null;
      if (!expiresAt) continue;
      const expiredSince = now - new Date(expiresAt).getTime();

      if (expiredSince > 0 && expiredSince < threeMonthsMs && threeMonthsMs - expiredSince <= soonMs) {
        for (const m of org.memberships) {
          await notifier.createNotification({
            userId: m.userId,
            orgId: org.id,
            type: NotificationType.SYSTEM_ALERT,
            title: "Aviso de eliminación de datos",
            message: "Tu organización está inactiva. Eliminaremos los datos de forma permanente si no reactivas tu suscripción.",
            actionUrl: "/pricing",
            metadata: { kind: "data_deletion_warning" },
          });
        }
        warned += 1;
      }

      if (expiredSince >= threeMonthsMs) {
        // Cancel any active provider subscription before deleting — the org
        // and its Subscription rows are gone after this, so this is the last
        // chance to stop the org from continuing to be billed.
        try {
          const subs = await prisma.subscription.findMany({
            where: { orgId: org.id },
          });
          for (const s of subs) {
            if (s.providerSubscriptionId) {
              await fetch(
                "https://api.mercadopago.com/preapproval/" + s.providerSubscriptionId,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN || ""}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ status: "cancelled" }),
                }
              );
            }
          }
        } catch (cancelError) {
          console.warn(`⚠️ [maintenance] Failed to cancel provider subscription for org ${org.id}:`, cancelError);
        }

        await prisma.organization.delete({ where: { id: org.id } });
        deleted += 1;
      }
    }

    // Reconcile AiProcessingJob rows stuck in "pending"/"processing": these
    // are created before the OpenAI call and only updated to
    // completed/failed afterward, so a worker crash or restart mid-analysis
    // (e.g. the pre-persistent-worker sandbox instability) leaves the row
    // stuck forever — permanently inflating the "IA en cola" dashboard
    // counter (useAiQueue.ts) even though nothing is actually queued. A
    // submission that already has an AI summary was evidently completed by
    // a later retry job, so reconcile as completed; otherwise mark failed
    // so admins get an accurate signal instead of a phantom in-progress job.
    const staleCutoff = new Date(now - 30 * 60 * 1000);
    const staleJobs = await prisma.aiProcessingJob.findMany({
      where: { status: { in: ["pending", "processing"] }, createdAt: { lt: staleCutoff } },
      select: { id: true, submissionId: true },
    });
    let reconciled = 0;
    for (const job of staleJobs) {
      const submission = job.submissionId
        ? await prisma.formSubmission.findUnique({
            where: { id: job.submissionId },
            select: { aiSummary: true },
          })
        : null;

      await prisma.aiProcessingJob.update({
        where: { id: job.id },
        data: submission?.aiSummary
          ? {
              status: "completed",
              completedAt: new Date(),
              errorMessage: "Reconciled: submission already analyzed by a later job",
            }
          : {
              status: "failed",
              errorMessage:
                "Stale: no update within 30 minutes (worker likely crashed or restarted mid-processing)",
            },
      });
      reconciled += 1;
    }

    return NextResponse.json({ ok: true, warned, deleted, reconciled });
  } catch (error) {
    console.error("❌ [maintenance] failed:", error);
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}


