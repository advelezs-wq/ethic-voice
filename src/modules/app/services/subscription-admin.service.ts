/**
 * Acciones del superadmin sobre la suscripción de un cliente. Si la
 * suscripción se cobra por Mercado Pago, primero se aplica allá: si falla, no
 * se cambia nada aquí (antes se marcaba "cancelada" aunque MP siguiera cobrando).
 */
import { BillingCycle, SubscriptionStatus } from "@prisma/client";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import { ClientAdminError } from "@/modules/app/services/client-admin.service";

type Action = "pause" | "resume" | "cancel";

const MP_STATUS: Record<Action, "paused" | "authorized" | "cancelled"> = {
  pause: "paused",
  resume: "authorized",
  cancel: "cancelled",
};

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

  let endDate: Date | null = null;
  if (sub.providerSubscriptionId) {
    if (!mercadoPagoService.isConfigured()) {
      throw new ClientAdminError("Mercado Pago no está configurado; no se puede cambiar el cobro.", 502);
    }
    if (action === "cancel") {
      const pre = await mercadoPagoService.getPreapproval(sub.providerSubscriptionId).catch(() => null);
      const next = pre?.next_payment_date || pre?.auto_recurring?.next_payment_date;
      if (next && !Number.isNaN(new Date(next).getTime())) endDate = new Date(next);
    }
    const res = await mercadoPagoService.updatePreapproval(sub.providerSubscriptionId, { status: MP_STATUS[action] });
    if (!res.success) {
      throw new ClientAdminError(`Mercado Pago rechazó el cambio: ${res.error || "error desconocido"}. No se modificó nada.`, 502);
    }
  }

  if (action === "cancel") {
    endDate = endDate ?? nextPeriodEnd(sub.startDate, sub.billingCycle);
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELED, endDate },
    });
    if (sub.orgId) {
      // Conserva el acceso hasta el fin del periodo ya pagado.
      await prisma.organization.update({
        where: { id: sub.orgId },
        data: { hasActivePlan: true, planExpiresAt: endDate, subscriptionSetupCompleted: false },
      });
    }
    return updated;
  }

  return prisma.subscription.update({
    where: { id },
    data: { status: action === "pause" ? SubscriptionStatus.INACTIVE : SubscriptionStatus.ACTIVE },
  });
}
