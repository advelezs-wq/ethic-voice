import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { Resend } from "resend";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await context.params;
  const { email, role } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  // Check permission: requester must be ADMIN of org
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Enforce plan limits: Grow Pro max 2 admins and 20 investigators
  try {
    const planInfo = await getOrganizationPlanInfo(orgId);
    const planType = (planInfo?.planType || "STARTER") as PlanType;
    const config = PLAN_CONFIGS[planType];

    const adminCount = await prisma.organizationMembership.count({ where: { orgId, role: "ADMIN" } });
    const memberCount = await prisma.organizationMembership.count({ where: { orgId, role: "MEMBER" } });

    if (role === "ADMIN" && config.features.maxUsers >= 0 && adminCount >= config.features.maxUsers) {
      return NextResponse.json({ error: `Límite de administradores alcanzado (${config.features.maxUsers})` }, { status: 403 });
    }
    if (role !== "ADMIN" && config.features.maxInvestigators >= 0 && memberCount >= config.features.maxInvestigators) {
      return NextResponse.json({ error: `Límite de investigadores alcanzado (${config.features.maxInvestigators})` }, { status: 403 });
    }
  } catch {
    // If plan lookup fails, continue but do not block unexpectedly
  }

  // Create invitation
  const token = crypto.randomUUID();
  const invitation = await prisma.organizationInvitation.create({
    data: {
      orgId,
      email,
      invitedById: userId,
      role: role === "ADMIN" ? "ADMIN" : "MEMBER",
      token,
      status: "pending",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
  });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
  const acceptUrl = `${appUrl}/api/organization/invitations/accept?token=${encodeURIComponent(token)}`;

  // Send email via Resend (Spanish, with logo)
  const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 640px; margin:0 auto; padding:24px; color:#111827;">
  <div style="text-align:center; margin-bottom:20px;">
    <img src="${appUrl}/brand/logo-nobg.png" alt="EthicVoice" width="120" style="display:inline-block;" />
  </div>
  <h2 style="margin:16px 0;">Invitación a unirte a ${org?.name || "una organización"}</h2>
  <p>Has sido invitado(a) a unirte como ${invitation.role === "ADMIN" ? "Administrador" : "Miembro"} a la organización <strong>${org?.name}</strong> en EthicVoice.</p>
  <p>Para aceptar la invitación, haz clic en el siguiente botón:</p>
  <p style="text-align:center; margin:24px 0;">
    <a href="${acceptUrl}" style="background:#111827; color:#fff; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block;">Aceptar invitación</a>
  </p>
  <p>Este enlace expira el ${invitation.expiresAt?.toLocaleDateString("es-CO")}.</p>
  <p style="margin-top:32px; color:#6b7280; font-size:12px;">Si no esperabas este correo, puedes ignorarlo.</p>
</body></html>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@ethicvoice.co",
    to: email,
    subject: `Invitación a ${org?.name} en EthicVoice`,
    html,
  });

  return NextResponse.json({ success: true, invitationId: invitation.id });
}


