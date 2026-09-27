/**
 * Administración de clientes (organizaciones) por parte del superadmin.
 *
 * Centraliza tres operaciones que antes estaban repartidas y con fallos:
 *  - createClient: crear organización + administrador + plan. Antes agregaba
 *    la membresía antes de crear el usuario en la base (violación de FK → 500)
 *    y dejaba la organización huérfana y el usuario de Clerk creados.
 *  - applyPlan: asignar un plan sin cobro (contratos gestionados por el equipo
 *    comercial). Antes se reutilizaba el flujo del cliente, que exigía ser
 *    miembro y redirigía al superadmin a pagar en Mercado Pago.
 *  - deleteClient: eliminar todo, cancelando Mercado Pago y el alias de correo
 *    en ImprovMX (antes el alias quedaba reenviando correos).
 */
import { randomUUID } from "crypto";
import { OrganizationRole, type Prisma } from "@prisma/client";
import { Resend } from "resend";
import prisma from "@/modules/prisma/lib/prisma";
import { BillingCycle, PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import { enforcePlanLimits } from "@/modules/core/utils/plan-enforcement.utils";
import { deleteImprovMxAliasByName } from "@/modules/app/lib/improvmx-client";
import { emailRoutingProvider } from "@/modules/app/lib/email-routing";

export class ClientAdminError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

type ClerkLike = {
  users: {
    getUserList: (q: { emailAddress: string[] }) => Promise<unknown>;
    createUser: (p: Record<string, unknown>) => Promise<{ id: string; emailAddresses?: { emailAddress: string }[]; firstName?: string | null; lastName?: string | null }>;
    deleteUser: (id: string) => Promise<unknown>;
  };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
}

async function uniqueSlug(name: string) {
  const base = toSlug(name) || "organizacion";
  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const exists = await prisma.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function strongPassword() {
  const pick = (chars: string, n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return (
    pick("ABCDEFGHJKLMNPQRSTUVWXYZ", 3) +
    pick("abcdefghijkmnpqrstuvwxyz", 5) +
    pick("23456789", 3) +
    pick("!@#$%&*?", 2)
  );
}

function listFromClerk(result: unknown): Array<{ id: string; emailAddresses?: { emailAddress: string }[]; firstName?: string | null; lastName?: string | null }> {
  if (Array.isArray(result)) return result;
  const data = (result as { data?: unknown })?.data;
  return Array.isArray(data) ? data : [];
}

function planSubscriptionFields(planType: PlanType, billingCycle: BillingCycle) {
  const cfg = PLAN_CONFIGS[planType];
  const f = cfg.features;
  return {
    planType,
    planName: cfg.displayName,
    billingCycle,
    monthlyPrice: billingCycle === BillingCycle.MONTHLY ? cfg.price.monthly || null : null,
    yearlyPrice: billingCycle === BillingCycle.YEARLY ? cfg.price.yearly || null : null,
    // Los precios de PLAN_CONFIGS están en USD (antes se guardaban como COP).
    currency: "USD",
    hasEmailChannel: f.hasEmailChannel,
    hasAiProcessing: f.hasAiProcessing,
    hasChatbotChannel: f.hasChatbotChannel,
    hasPhoneChannel: f.hasPhoneChannel,
    hasExternalManager: f.hasExternalManager || false,
    hasBilingualSupport: f.hasBilingualSupport || false,
    hasUnlimitedUsers: f.hasUnlimitedUsers || false,
    hasAdvancedAnalytics: f.hasAdvancedAnalytics || false,
    hasCustomization: f.hasCustomization || false,
    hasColorThemes: f.hasColorThemes || false,
    hasUnlimitedCustomization: f.hasUnlimitedCustomization || false,
    maxUsers: f.maxUsers,
    maxInvestigators: f.maxInvestigators,
    maxEmployees: f.maxEmployees,
  };
}

function orgPlanFields(planType: PlanType) {
  const f = PLAN_CONFIGS[planType].features;
  return {
    currentPlan: planType,
    hasActivePlan: true,
    subscriptionSetupCompleted: true,
    planExpiresAt: null,
    isActive: true,
    // Los canales se habilitan según el plan. El correo además requiere crear
    // y activar la bandeja; este flag solo indica que el plan lo permite.
    isAiProcessingActive: f.hasAiProcessing,
    isChatbotActive: f.hasChatbotChannel,
    isPhoneChannelActive: f.hasPhoneChannel,
  };
}

function parsePlan(raw: unknown): PlanType {
  const key = String(raw || "").toUpperCase();
  if (!(key in PLAN_CONFIGS)) throw new ClientAdminError("Plan no válido");
  return key as PlanType;
}

// ─── Asignar plan ──────────────────────────────────────────────────────────

export async function applyPlan(
  orgId: string,
  rawPlan: unknown,
  opts: { actorUserId: string; billingCycle?: BillingCycle },
) {
  const planType = parsePlan(rawPlan);
  const billingCycle = opts.billingCycle ?? BillingCycle.MONTHLY;
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, currentPlan: true } });
  if (!org) throw new ClientAdminError("Organización no encontrada", 404);

  const warnings: string[] = [];
  const current = await prisma.subscription.findFirst({
    where: { orgId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "INACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });

  const historyEntry = {
    at: new Date().toISOString(),
    from: current?.planType ?? org.currentPlan ?? null,
    to: planType,
    by: "superadmin",
    actorUserId: opts.actorUserId,
  };

  let subscriptionId: number;
  if (current) {
    const meta = (current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
      ? (current.metadata as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const history = Array.isArray(meta.planChangeHistory) ? meta.planChangeHistory : [];
    const updated = await prisma.subscription.update({
      where: { id: current.id },
      data: {
        ...planSubscriptionFields(planType, billingCycle),
        status: "ACTIVE",
        endDate: null,
        metadata: { ...meta, planChangeHistory: [...history, historyEntry] } as Prisma.InputJsonValue,
      },
    });
    subscriptionId = updated.id;

    // Si el cliente paga con Mercado Pago, el cobro debe seguir al nuevo plan.
    if (current.providerSubscriptionId) {
      if (!mercadoPagoService.isConfigured()) {
        warnings.push("Mercado Pago no está configurado: actualiza el monto del cobro manualmente.");
      } else {
        const res = await mercadoPagoService.updatePreapproval(current.providerSubscriptionId, {
          preapproval_plan_id: mercadoPagoService.getPlanId(planType, billingCycle),
          status: "authorized",
        });
        if (!res.success) {
          warnings.push(`No se pudo actualizar el cobro en Mercado Pago: ${res.error || "error desconocido"}.`);
        }
      }
    }
  } else {
    const created = await prisma.subscription.create({
      data: {
        orgId,
        userId: null,
        ...planSubscriptionFields(planType, billingCycle),
        status: "ACTIVE",
        startDate: new Date(),
        isTrialActive: false,
        metadata: { source: "superadmin_manual", planChangeHistory: [historyEntry] } as Prisma.InputJsonValue,
      },
    });
    subscriptionId = created.id;
  }

  await prisma.organization.update({ where: { id: orgId }, data: orgPlanFields(planType) });

  try {
    await enforcePlanLimits(orgId, opts.actorUserId);
  } catch (e) {
    console.error("[client-admin] enforcePlanLimits failed", e);
    warnings.push("El plan se aplicó, pero no se pudieron recalcular los cupos de usuarios.");
  }

  return { subscriptionId, planType, warnings };
}

// ─── Crear cliente ─────────────────────────────────────────────────────────

export type CreateClientInput = {
  email: unknown;
  name?: unknown;
  organizationName: unknown;
  planType: unknown;
  /** "create": crea el usuario con contraseña temporal. "invite": envía invitación por correo. */
  mode?: unknown;
};

export async function createClient(input: CreateClientInput, actor: { userId: string }, clerk: ClerkLike) {
  const email = String(input.email || "").trim().toLowerCase();
  const organizationName = String(input.organizationName || "").trim();
  const fullName = String(input.name || "").trim();
  const mode = input.mode === "invite" ? "invite" : "create";
  const planType = parsePlan(input.planType);

  if (!EMAIL_RE.test(email)) throw new ClientAdminError("Escribe un correo válido para el administrador del cliente.");
  if (organizationName.length < 2) throw new ClientAdminError("Escribe el nombre de la organización.");

  const duplicate = await prisma.organization.findFirst({
    where: { name: { equals: organizationName, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) throw new ClientAdminError("Ya existe una organización con ese nombre.", 409);

  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Administrador";
  const lastName = parts.slice(1).join(" ") || organizationName;

  // 1) Usuario en Clerk (existente o nuevo)
  const existing = listFromClerk(await clerk.users.getUserList({ emailAddress: [email] }).catch(() => []))[0] ?? null;
  let clerkUser = existing;
  let createdClerkUserId: string | null = null;
  let tempPassword: string | null = null;

  if (!clerkUser && mode === "create") {
    tempPassword = strongPassword();
    try {
      clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        firstName,
        lastName,
        password: tempPassword,
        skipPasswordChecks: true,
      });
      createdClerkUserId = clerkUser.id;
    } catch (err) {
      const msg = (err as { errors?: { message?: string; longMessage?: string }[] })?.errors?.[0];
      throw new ClientAdminError(
        `No se pudo crear el usuario administrador: ${msg?.longMessage || msg?.message || "error en el servicio de acceso"}`,
        502,
      );
    }
  }

  // 2) Organización, usuario en BD, membresía, departamento y ajustes — todo o nada.
  let orgId: string | null = null;
  const inviteToken = mode === "invite" && !clerkUser ? randomUUID() : null;
  try {
    const slug = await uniqueSlug(organizationName);
    orgId = randomUUID();
    const newOrgId = orgId;
    await prisma.$transaction(async (tx) => {
      if (clerkUser) {
        await tx.user.upsert({
          where: { id: clerkUser.id },
          update: {},
          create: {
            id: clerkUser.id,
            email,
            firstName: clerkUser.firstName || firstName,
            lastName: clerkUser.lastName || lastName,
          },
        });
      }
      await tx.organization.create({
        data: {
          id: newOrgId,
          name: organizationName,
          slug,
          userId: clerkUser?.id ?? null,
          isActive: true,
          currentPlan: planType,
        },
      });
      const dept = await tx.department.create({
        data: { name: "General", slug: "general", orgId: newOrgId, isDefault: true },
      });
      if (clerkUser) {
        await tx.organizationMembership.create({
          data: { userId: clerkUser.id, orgId: newOrgId, role: OrganizationRole.ADMIN, departmentId: dept.id },
        });
        await tx.user.update({ where: { id: clerkUser.id }, data: { hasCompletedOrgSetup: true } });
      }
      if (inviteToken) {
        await tx.organizationInvitation.create({
          data: {
            orgId: newOrgId,
            email,
            invitedById: actor.userId,
            role: OrganizationRole.ADMIN,
            token: inviteToken,
            status: "pending",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          },
        });
      }
      await tx.organizationSettings.create({ data: { organizationId: newOrgId, isActive: true } });
    });

    // 3) Plan y suscripción
    const plan = await applyPlan(newOrgId, planType, { actorUserId: actor.userId });

    // 4) Invitación por correo (solo si no había usuario)
    const warnings = [...plan.warnings];
    if (inviteToken) {
      const sent = await sendInvitationEmail(email, organizationName, inviteToken);
      if (!sent) warnings.push("La organización se creó, pero el correo de invitación no pudo enviarse. Reenvíalo desde el detalle del cliente.");
    }

    return {
      organizationId: newOrgId,
      subscriptionId: plan.subscriptionId,
      adminEmail: email,
      adminStatus: clerkUser ? (createdClerkUserId ? "created" : "existing") : "invited",
      tempPassword,
      warnings,
    };
  } catch (err) {
    // Reversión: no dejar organizaciones huérfanas ni usuarios creados a medias.
    if (orgId) await purgeOrganizationData(orgId).catch((e) => console.error("[client-admin] rollback org failed", e));
    if (createdClerkUserId) {
      await prisma.user.deleteMany({ where: { id: createdClerkUserId } }).catch(() => {});
      await clerk.users.deleteUser(createdClerkUserId).catch((e) => console.error("[client-admin] rollback clerk user failed", e));
    }
    if (err instanceof ClientAdminError) throw err;
    console.error("[client-admin] createClient failed", err);
    throw new ClientAdminError("No se pudo crear el cliente. No quedó nada creado; intenta de nuevo.", 500);
  }
}

async function sendInvitationEmail(email: string, organizationName: string, token: string) {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
    const acceptUrl = `${base}/api/organization/invitations/accept?token=${encodeURIComponent(token)}`;
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@ethicvoice.co",
      to: email,
      subject: `Tu acceso a EthicVoice · ${organizationName}`,
      html: `<div style="font-family:Arial,sans-serif;color:#0B1D21;max-width:520px;margin:0 auto">
        <p style="font-size:18px;font-weight:600">Te damos la bienvenida a EthicVoice</p>
        <p>Fuiste invitado(a) como <strong>administrador</strong> del canal de denuncias de <strong>${organizationName}</strong>.</p>
        <p><a href="${acceptUrl}" style="display:inline-block;background:#0B1D21;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Aceptar invitación</a></p>
        <p style="font-size:13px;color:#5A6D70">El enlace vence en 7 días.</p></div>`,
    });
    if (error) console.error("[client-admin] invitation email rejected", error.message);
    return !error;
  } catch (e) {
    console.error("[client-admin] invitation email failed", e);
    return false;
  }
}

// ─── Eliminar cliente ──────────────────────────────────────────────────────

/** Borra todos los datos de la organización en orden de dependencia. */
async function purgeOrganizationData(orgId: string) {
  const submissionIds = (
    await prisma.formSubmission.findMany({ where: { orgId }, select: { id: true } })
  ).map((s) => s.id);
  const bySubmission = { submissionId: { in: submissionIds } };

  await prisma.$transaction([
    prisma.reportComment.deleteMany({ where: bySubmission }),
    prisma.reportAttachment.deleteMany({ where: bySubmission }),
    prisma.reportActivity.deleteMany({ where: bySubmission }),
    prisma.reportUpdate.deleteMany({ where: bySubmission }),
    prisma.reportAssignment.deleteMany({ where: { reportId: { in: submissionIds } } }),
    prisma.notification.deleteMany({ where: { OR: [{ orgId }, { reportId: { in: submissionIds } }] } }),
    prisma.notificationSettings.deleteMany({ where: { orgId } }),
    prisma.aiProcessingJob.deleteMany({ where: { orgId } }),
    prisma.usageTracking.deleteMany({ where: { orgId } }),
    prisma.paymentTransaction.deleteMany({ where: { orgId } }),
    prisma.formSubmission.deleteMany({ where: { orgId } }),
    prisma.form.deleteMany({ where: { orgId } }),
    prisma.subscription.deleteMany({ where: { orgId } }),
    prisma.emailConfiguration.deleteMany({ where: { orgId } }),
    prisma.aiTemplate.deleteMany({ where: { orgId } }),
    prisma.processingRule.deleteMany({ where: { orgId } }),
    prisma.organizationAreaOption.deleteMany({ where: { orgId } }),
    prisma.organizationPositionOption.deleteMany({ where: { orgId } }),
    prisma.ethicalContextDocument.deleteMany({ where: { organizationId: orgId } }),
    prisma.organizationEthicalContext.deleteMany({ where: { organizationId: orgId } }),
    prisma.organizationInvitation.deleteMany({ where: { orgId } }),
    prisma.userSettings.deleteMany({ where: { organizationId: orgId } }),
    prisma.organizationSettings.deleteMany({ where: { organizationId: orgId } }),
    prisma.organizationMembership.deleteMany({ where: { orgId } }),
    prisma.department.deleteMany({ where: { orgId } }),
    prisma.organization.deleteMany({ where: { id: orgId } }),
  ]);
}

export async function deleteClient(orgId: string, confirmName: unknown) {
  const o = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      subscriptions: { where: { providerSubscriptionId: { not: null }, status: { not: "CANCELED" } } },
      emailConfigurations: { select: { emailAlias: true } },
    },
  });
  if (!o) throw new ClientAdminError("Organización no encontrada", 404);
  if (String(confirmName || "").trim() !== o.name.trim()) {
    throw new ClientAdminError("El nombre escrito no coincide con el de la organización.");
  }

  const warnings: string[] = [];

  // 1) Detener cobros en Mercado Pago
  for (const s of o.subscriptions) {
    if (!s.providerSubscriptionId) continue;
    const res = await mercadoPagoService.updatePreapproval(s.providerSubscriptionId, { status: "cancelled" });
    if (!res.success) {
      throw new ClientAdminError(
        `No se pudo cancelar el cobro en Mercado Pago (${res.error || "error desconocido"}). No se eliminó nada para evitar cobros a una cuenta inexistente.`,
        502,
      );
    }
  }

  // 2) Quitar el alias de correo en ImprovMX (con Cloudflare no hay alias por
  //    cliente: al borrar la configuración, el webhook rebota esos correos).
  const domain = process.env.FORWARDING_DOMAIN || "ethicvoice.co";
  const aliases = emailRoutingProvider() === "improvmx" ? o.emailConfigurations : [];
  for (const cfg of aliases) {
    try {
      await deleteImprovMxAliasByName(domain, cfg.emailAlias);
    } catch (e) {
      console.error("[client-admin] ImprovMX alias removal failed", e);
      warnings.push(`Quita manualmente el alias ${cfg.emailAlias}@${domain} en ImprovMX.`);
    }
  }

  // 3) Datos
  await purgeOrganizationData(orgId);
  return { warnings };
}
