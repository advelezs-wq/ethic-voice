# Bandejas de correo con Cloudflare Email Routing

Cada cliente recibe denuncias en `{slug}@ethicvoice.co`. Cloudflare Email Routing
(gratis) entrega **todo** `*@ethicvoice.co` a un Worker (`cloudflare/email-worker`)
que lo envía al webhook `/api/webhooks/email/secure`. No hay un alias por cliente:
activar/desactivar una bandeja solo cambia `EmailConfiguration.isActive`.

| Caso | Resultado |
|------|-----------|
| `{slug}@` de bandeja activa y plan Grow+ | Se crea la denuncia |
| Dirección sin bandeja activa | El Worker rebota el correo con un mensaje claro |
| Buzón interno listado en `STAFF_FORWARDS` (p. ej. `info@`) | Se reenvía a ese correo |
| Webhook caído o con límite de tasa (5xx/429) | Rechazo temporal; el remitente reintenta |

## Variables

- Vercel: `EMAIL_ROUTING_PROVIDER=cloudflare` (sin ella se usa el flujo legado de ImprovMX).
- Worker: `WEBHOOK_SECRET` (= `IMPROVMX_WEBHOOK_SECRET` de Vercel) y `STAFF_FORWARDS`
  (`info=destino@gmail.com,...`), ambos con `wrangler secret put`.

## Migración desde ImprovMX (una vez)

1. Cloudflare → Add a domain → `ethicvoice.co` (plan Free). Revisar que importó:
   registros de Vercel (apex y `www`, en **DNS only** / nube gris), `google-site-verification`,
   y los de Resend (`send` MX y TXT, `resend._domainkey`, `_dmarc`). No copiar los MX de ImprovMX.
2. Namecheap → Domain List → ethicvoice.co → Nameservers → Custom DNS → los 2 de Cloudflare.
   No hace falta transferir el registro del dominio.
3. Cuando Cloudflare marque el dominio como activo: Email → Email Routing → Enable
   (agrega sus MX y SPF). Destination addresses → verificar el Gmail del equipo.
4. `cd cloudflare/email-worker && bun install && bunx wrangler login && bunx wrangler deploy`,
   luego `bunx wrangler secret put WEBHOOK_SECRET` y `bunx wrangler secret put STAFF_FORWARDS`.
5. Email Routing → Routing rules → Catch-all → Action "Send to a Worker" → `ethicvoice-email`.
6. Vercel → `EMAIL_ROUTING_PROVIDER=cloudflare` → redeploy.
7. Probar: correo a `{slug}@ethicvoice.co` de un cliente Grow+ con bandeja activa → aparece la
   denuncia; correo a una dirección inventada → rebota; correo a `info@` → llega al Gmail.
   Logs en vivo: `bunx wrangler tail`.
8. Cancelar ImprovMX y borrar el dominio allí.
