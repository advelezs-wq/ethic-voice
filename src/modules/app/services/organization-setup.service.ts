/**
 * Alta de la organización por el propio cliente.
 *
 * Antes el último paso del onboarding redirigía a "/superadmin/clients" (una
 * ruta que no existe) y ningún cliente podía crear su organización tras pagar;
 * y POST /api/organizations dejaba a cualquier usuario crear organizaciones sin
 * plan ni pago. Ahora la organización se crea en el checkout (antes del primer
 * cobro, sin acceso al plan hasta que el pago se apruebe) o, si ya existe un
 * pago aprobado sin organización, desde el onboarding.
 */
import { randomUUID } from "crypto";
import prisma from "@/modules/prisma/lib/prisma";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { recalculateOrganizationSeatUsage } from "@/modules/core/utils/subscription.utils";
import { ClientAdminError, orgPlanFields, uniqueSlug } from "@/modules/app/services/client-admin.service";

export function normalizeOrganizationName(raw: unknown) {
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) {
    throw new ClientAdminError("Escribe el nombre de tu organización (entre 2 y 120 caracteres).");
  }
  return name;
}

export async function findAdminOrganizationId(userId: string) {
  const m = await prisma.organizationMembership.findFirst({
    where: { userId, role: "ADMIN", isBlocked: false },
    orderBy: { createdAt: "asc" },
    select: { orgId: true },
  });
  return m?.orgId ?? null;
}

/**
 * Crea la organización con su administrador, área "General" y configuración.
 * Queda sin plan activo: el plan se activa cuando se aprueba el pago.
 */
export async function createOrganizationForUser(input: { userId: string; email?: string | null; name: unknown }) {
  const name = normalizeOrganizationName(input.name);
  if (await findAdminOrganizationId(input.userId)) {
    throw new ClientAdminError("Ya administras una organización. Para crear otra, escribe a soporte.", 409);
  }
  const duplicate = await prisma.organization.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) throw new ClientAdminError("Ya existe una organización con ese nombre. Usa uno distinto.", 409);

  const orgId = randomUUID();
  const slug = await uniqueSlug(name);
  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: input.userId },
      update: { hasCompletedOrgSetup: true },
      create: { id: input.userId, email: input.email || "", hasCompletedOrgSetup: true },
    });
    await tx.organization.create({
      data: { id: orgId, name, slug, userId: input.userId, isActive: true, hasActivePlan: false },
    });
    const dept = await tx.department.create({
      data: { name: "General", slug: "general", orgId, isDefault: true },
    });
    await tx.organizationMembership.create({
      data: { userId: input.userId, orgId, role: "ADMIN", departmentId: dept.id },
    });
    await tx.organizationSettings.create({ data: { organizationId: orgId, isActive: true } });
  });
  await recalculateOrganizationSeatUsage(orgId).catch(() => undefined);
  return { id: orgId, name, slug };
}

/**
 * Onboarding: el usuario ya tiene un pago aprobado sin organización (por
 * ejemplo, un plan asignado a su cuenta) y crea la organización para usarlo.
 */
export async function createOwnOrganization(input: { userId: string; email?: string | null; name: unknown }) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: input.userId, orgId: null, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!subscription) {
    throw new ClientAdminError("Para crear tu organización primero elige un plan.", 402);
  }

  const org = await createOrganizationForUser(input);
  const planType = subscription.planType as PlanType;
  await prisma.subscription.update({ where: { id: subscription.id }, data: { orgId: org.id } });
  await prisma.organization.update({ where: { id: org.id }, data: orgPlanFields(planType) });

  return {
    organization: org,
    plan: { type: planType, name: PLAN_CONFIGS[planType].displayName, active: true },
  };
}
