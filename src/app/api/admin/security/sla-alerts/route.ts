import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { notificationsService } from "@/modules/app/services/notifications.service";
import { NotificationChannel, NotificationType } from "@prisma/client";
import { getSlaTotalDays } from "@/modules/app/utils/dashboard.utils";

export async function POST(request: NextRequest) {
  try {
    // Allow only cron/internal calls (relaxed check: header present)
    const isCron = request.headers.get("x-vercel-cron") === "1";
    if (!isCron) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgs = await prisma.organization.findMany({ select: { id: true } });
    const now = new Date();

    let alertsSent = 0;

    for (const org of orgs) {
      const reports = await prisma.formSubmission.findMany({
        where: { orgId: org.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
        include: { assignments: true },
      });

      for (const r of reports) {
        const totalDays = getSlaTotalDays(
          String(r.priority),
          r.type || undefined
        );
        const daysSince = Math.floor(
          (now.getTime() - new Date(r.submittedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const percent = Math.round((daysSince / totalDays) * 100);

        // Trigger alerts for >= 86% (orange) and overdue (red)
        if (percent >= 86) {
          const assignees = r.assignments.map((a) => a.userId);

          // Notify assignees
          for (const userId of assignees) {
            await notificationsService.createNotification({
              userId,
              orgId: org.id,
              type: NotificationType.SYSTEM_ALERT,
              title:
                percent > 100
                  ? "Reporte vencido"
                  : "Reporte próximo al vencimiento",
              message:
                percent > 100
                  ? `El reporte REP-${String(r.id).padStart(6, "0")} superó el tiempo máximo de gestión (${percent}% consumido).`
                  : `El reporte REP-${String(r.id).padStart(6, "0")} está próximo a vencer (${percent}% del tiempo consumido).`,
              actionUrl: `/app/reports/${r.id}`,
              reportId: r.id,
              channel: NotificationChannel.BOTH,
              metadata: { slaPercent: percent },
            });
            alertsSent++;
          }

          // Notify admins of org (summary per report)
          const admins = await prisma.organizationMembership.findMany({
            where: { orgId: org.id, role: "ADMIN" },
            select: { userId: true },
          });
          for (const admin of admins) {
            await notificationsService.createNotification({
              userId: admin.userId,
              orgId: org.id,
              type: NotificationType.SYSTEM_ALERT,
              title:
                percent > 100
                  ? "Alerta de vencimiento"
                  : "Alerta de riesgo alto",
              message:
                percent > 100
                  ? `El reporte REP-${String(r.id).padStart(6, "0")} está vencido (${percent}%).`
                  : `El reporte REP-${String(r.id).padStart(6, "0")} supera el 85% del tiempo máximo (${percent}%).`,
              actionUrl: `/app/reports/${r.id}`,
              reportId: r.id,
              channel: NotificationChannel.IN_APP,
              metadata: { slaPercent: percent },
            });
            alertsSent++;
          }
        }
      }

      // New: report updates reminders (due soon / overdue)
      const twoDays = 2 * 24 * 60 * 60 * 1000;

      const updates = await prisma.reportUpdate.findMany({
        where: {
          submission: { orgId: org.id },
          status: { not: "completed" },
          OR: [
            { dueDate: { lt: now } },
            { dueDate: { lte: new Date(now.getTime() + twoDays) } },
          ],
        },
        include: { submission: true },
      });

      for (const u of updates) {
        const isOverdue = u.dueDate && u.dueDate < now;
        const reportId = u.submissionId;

        const [assignments, admins] = await Promise.all([
          prisma.reportAssignment.findMany({ where: { reportId } }),
          prisma.organizationMembership.findMany({
            where: { orgId: org.id, role: "ADMIN" },
          }),
        ]);

        const recipients = new Set<string>();
        assignments.forEach((a) => recipients.add(a.userId));
        admins.forEach((m) => recipients.add(m.userId));

        await Promise.all(
          Array.from(recipients).map((uid) =>
            notificationsService.createNotification({
              userId: uid,
              orgId: org.id,
              type: "SYSTEM_ALERT" as any,
              title: isOverdue ? "Tarea vencida" : "Tarea próxima a vencer",
              message: `${u.title} (${isOverdue ? "vencida" : "vence pronto"}) en REP-${String(reportId).padStart(6, "0")}`,
              actionUrl: `/app/reports/${reportId}`,
              reportId,
              channel: "BOTH" as any,
              metadata: {
                updateId: u.id,
                dueDate: u.dueDate,
                priority: u.priority,
              },
            })
          )
        );
      }
    }

    return NextResponse.json({ ok: true, alertsSent });
  } catch (error) {
    console.error("SLA alerts error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
