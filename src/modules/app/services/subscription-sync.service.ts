/**
 * Qué pasa con la organización cuando cambia el estado de una suscripción
 * (pago aprobado, cobro rechazado, cancelación). Lo usa el cobro con Wompi
 * (billing.service). Antes cada ruta tenía su propia copia y solo tocaba
 * `hasActivePlan`:
 *  - un cambio de plan pagado desde la app nunca se aplicaba a la
 *    organización (seguía en el plan anterior) y la suscripción anterior
 *    seguía cobrando: el cliente pagaba dos veces. Ahora la nueva reemplaza a
 *    la anterior, que deja de cobrarse (el cron solo cobra las ACTIVE).
 *  - al vencer o cancelarse se revocaba el acceso aunque hubiera otra
 *    suscripción activa.
 */
import prisma from "@/modules/prisma/lib/prisma";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { enforcePlanLimits } from "@/modules/core/utils/plan-enforcement.utils";
import { recalculateOrganizationSeatUsage } from "@/modules/core/utils/subscription.utils";

export async function syncOrganizationWithSubscription(subscriptionId: number) {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub?.orgId) return; // Aún sin organización: se vincula al crearla.
  const orgId = sub.orgId;

  if (sub.status === "ACTIVE") {
    // Un cobro tardío de una suscripción vieja no debe pisar una más nueva.
    const newerActive = await prisma.subscription.count({
      where: { orgId, status: "ACTIVE", createdAt: { gt: sub.createdAt } },
    });
    if (newerActive > 0) return;

    const f = PLAN_CONFIGS[sub.planType as PlanType].features;
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        currentPlan: sub.planType,
        hasActivePlan: true,
        planExpiresAt: null,
        subscriptionSetupCompleted: true,
        isAiProcessingActive: f.hasAiProcessing,
        isChatbotActive: f.hasChatbotChannel,
        isPhoneChannelActive: f.hasPhoneChannel,
      },
    });

    // La suscripción recién pagada reemplaza a las anteriores de la organización.
    const previous = await prisma.subscription.findMany({
      where: {
        orgId,
        id: { not: sub.id },
        createdAt: { lt: sub.createdAt },
        status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "INACTIVE"] },
      },
    });
    for (const old of previous) {
      await prisma.subscription.update({
        where: { id: old.id },
        data: {
          status: "CANCELED",
          endDate: new Date(),
          metadata: {
            ...((old.metadata as Record<string, unknown> | null) ?? {}),
            replacedBySubscriptionId: sub.id,
            replacedAt: new Date().toISOString(),
          },
        },
      });
    }

    await enforcePlanLimits(orgId).catch((e) => console.error("[subscription-sync] enforcePlanLimits", e));
    await recalculateOrganizationSeatUsage(orgId).catch(() => undefined);
    return;
  }

  if (sub.status === "PAST_DUE" || sub.status === "CANCELED") {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { hasActivePlan: true, planExpiresAt: true },
    });
    if (!org?.hasActivePlan) return;
    const inGracePeriod = !!org.planExpiresAt && org.planExpiresAt.getTime() > Date.now();
    if (inGracePeriod) return;
    const otherActive = await prisma.subscription.count({
      where: { orgId, status: "ACTIVE", id: { not: sub.id } },
    });
    if (otherActive > 0) return;
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        hasActivePlan: false,
        isEmailChannelActive: false,
        isAiProcessingActive: false,
        isChatbotActive: false,
        isPhoneChannelActive: false,
      },
    });
  }
}
