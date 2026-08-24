import { Resend } from "resend";
import { OrganizationInvitation } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrganizationInvitationEmail(
  invitation: OrganizationInvitation,
  orgName: string | null
) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
  const acceptUrl = `${appUrl}/api/organization/invitations/accept?token=${encodeURIComponent(invitation.token)}`;

  const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 640px; margin:0 auto; padding:24px; color:#111827;">
  <div style="text-align:center; margin-bottom:20px;">
    <img src="${appUrl}/brand/logo-nobg.png" alt="EthicVoice" width="120" style="display:inline-block;" />
  </div>
  <h2 style="margin:16px 0;">Invitación a unirte a ${orgName || "una organización"}</h2>
  <p>Has sido invitado(a) a unirte como ${invitation.role === "ADMIN" ? "Administrador" : invitation.role === "VIEWER" ? "Observador (solo lectura)" : "Miembro"} a la organización <strong>${orgName}</strong> en EthicVoice.</p>
  <p>Para aceptar la invitación, haz clic en el siguiente botón:</p>
  <p style="text-align:center; margin:24px 0;">
    <a href="${acceptUrl}" style="background:#111827; color:#fff; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block;">Aceptar invitación</a>
  </p>
  <p>Este enlace expira el ${invitation.expiresAt?.toLocaleDateString("es-CO")}.</p>
  <p style="margin-top:32px; color:#6b7280; font-size:12px;">Si no esperabas este correo, puedes ignorarlo.</p>
</body></html>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@ethicvoice.co",
    to: invitation.email,
    subject: `Invitación a ${orgName} en EthicVoice`,
    html,
  });
}
