import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { NotificationsService } from "@/modules/app/services/notifications.service";
import { NotificationType } from "@prisma/client";

export async function GET(_request: NextRequest) {
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
        await prisma.organization.delete({ where: { id: org.id } });
        deleted += 1;
      }
    }

    return NextResponse.json({ ok: true, warned, deleted });
  } catch (error) {
    console.error("❌ [maintenance] failed:", error);
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}


