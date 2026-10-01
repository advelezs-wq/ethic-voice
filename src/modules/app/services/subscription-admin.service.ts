/**
 * Acciones del superadmin sobre la suscripción de un cliente.
 * - Pausar: el cron de cobros (billing.service) solo cobra suscripciones
 *   ACTIVE, así que una pausada (INACTIVE) deja de cobrarse; el cliente
 *   conserva el acceso.
 * - Reanudar: vuelve a ACTIVE; si ya pasó la fecha de cobro, se cobra en la
 *   próxima corrida del cron.
 * - Cancelar: no se cobra más y el acceso sigue hasta el fin del periodo pagado.
 */
import { BillingCycle, SubscriptionStatus } from "@prisma/client";
import prisma from "@/modules/prisma/lib/prisma";
import { ClientAdminError } from "@/modules/app/services/client-admin.service";

type Action = "pause" | "resume" | "cancel";

function nextPeriodEnd(startDate: Date, cycle: BillingCycle) {
  const step = cycle === BillingCycle.YEARLY ? 12 : 1;
  const cursor = new Date(startDate);
  while (cursor.getTime() <= Date.now()) cursor.setMonth(cursor.getMonth() + step);
  return cursor;
}

export async function runSubscriptionAction(subscriptionId: unknown, action: Action) {
  const id = Number(subscriptionId);
  if (!Number.isInteger(id)) throw new ClientAdminError("Falta la suscripción");
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) throw new ClientAdminError("Suscripción no encontrada", 404);

  if (action === "pause" && sub.status !== "ACTIVE") throw new ClientAdminError("Solo se puede pausar una suscripción activa.");
  if (action === "resume" && sub.status !== "INACTIVE") throw new ClientAdminError("Solo se puede reanudar una suscripción pausada.");
  if (action === "cancel" && sub.status === "CANCELED") throw new ClientAdminError("La suscripción ya está cancelada.");

  if (action === "cancel") {
    const meta = (sub.metadata as Record<string, unknown> | null) ?? {};
    const paidUntil = typeof meta.currentPeriodEnd === "string" ? new Date(meta.currentPeriodEnd) : null;
    const endDate = paidUntil && paidUntil.getTime() > Date.now() ? paidUntil : nextPeriodEnd(sub.startDate, sub.billingCycle);
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELED, endDate },
    });
    if (sub.orgId) {
      // Conserva el acceso hasta el fin del periodo ya pagado; el cron diario
      // lo retira cuando esa fecha pasa.
      await prisma.organization.update({
        where: { id: sub.orgId },
        data: { hasActivePlan: true, planExpiresAt: endDate },
      });
    }
    return updated;
  }

  return prisma.subscription.update({
    where: { id },
    data: { status: action === "pause" ? SubscriptionStatus.INACTIVE : SubscriptionStatus.ACTIVE },
  });
}
