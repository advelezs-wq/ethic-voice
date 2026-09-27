/**
 * Proveedor que recibe los correos de {slug}@ethicvoice.co.
 *
 * - "cloudflare": Cloudflare Email Routing con una regla catch-all hacia el
 *   Worker `cloudflare/email-worker`, que reenvía cada correo al webhook
 *   /api/webhooks/email/secure. No hay un alias por cliente: activar o
 *   desactivar una bandeja solo cambia `EmailConfiguration.isActive`, y el
 *   webhook ignora los correos de bandejas inactivas.
 * - "improvmx" (por defecto, legado): un alias por cliente creado con la API
 *   de ImprovMX (requiere cuenta Premium para reenviar a un webhook).
 */
export type EmailRoutingProvider = "cloudflare" | "improvmx";

export function emailRoutingProvider(): EmailRoutingProvider {
  return process.env.EMAIL_ROUTING_PROVIDER === "cloudflare" ? "cloudflare" : "improvmx";
}

export const forwardingDomain = () => process.env.FORWARDING_DOMAIN || "ethicvoice.co";
