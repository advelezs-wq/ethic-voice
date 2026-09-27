/**
 * Proveedor que recibe los correos de {slug}@ethicvoice.co.
 *
 * - "cloudflare" (por defecto): Cloudflare Email Routing con una regla catch-all hacia el
 *   Worker `cloudflare/email-worker`, que reenvía cada correo al webhook
 *   /api/webhooks/email/secure. No hay un alias por cliente: activar o
 *   desactivar una bandeja solo cambia `EmailConfiguration.isActive`, y el
 *   webhook ignora los correos de bandejas inactivas.
 * - "improvmx" (legado, solo con EMAIL_ROUTING_PROVIDER=improvmx): un alias por
 *   cliente creado con la API de ImprovMX (requiere cuenta Premium).
 */
export type EmailRoutingProvider = "cloudflare" | "improvmx";

export function emailRoutingProvider(): EmailRoutingProvider {
  return process.env.EMAIL_ROUTING_PROVIDER === "improvmx" ? "improvmx" : "cloudflare";
}

export const forwardingDomain = () => process.env.FORWARDING_DOMAIN || "ethicvoice.co";
