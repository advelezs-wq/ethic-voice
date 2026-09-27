# Pagos con Wompi

EthicVoice cobra las suscripciones con **Wompi** (Bancolombia), en pesos colombianos.
Wompi guarda la tarjeta del cliente (fuente de pago) y EthicVoice hace cada cobro:
no hay un motor de suscripciones del lado de Wompi.

## Flujo

| Paso | Dónde |
|------|-------|
| El cliente elige un plan en `/pricing` → `/checkout?plan=GROW&billing=MONTHLY` | `src/app/checkout`, `WompiCheckout.tsx` |
| Escribe el nombre de su organización (si no tiene) y su tarjeta; la tarjeta va **directo a Wompi** desde el navegador (`/tokens/cards` con la llave pública) | `WompiCardForm.tsx` |
| El servidor crea la organización (sin plan), guarda la tarjeta (`/payment_sources`) y hace el primer cobro (`/transactions`) | `POST /api/billing/subscribe` → `billing.service.startSubscription` |
| El navegador consulta el resultado; al aprobarse se activa el plan | `GET /api/billing/transactions/[id]` |
| Wompi avisa cambios de estado (checksum verificado; el estado se vuelve a consultar en su API) | `POST /api/webhooks/wompi` |
| Renovaciones diarias, reintentos (1 y 3 días), suspensión tras 3 intentos, fin de periodo de las cancelaciones y retiro del acceso cuando vence un plan cancelado | `billing.service.runDueCharges` desde `/api/admin/daily-runner` (cron 05:00) |
| Facturación: próximo cobro, tarjeta, cambiar tarjeta (reintenta si estaba suspendido), cancelar/reanudar, historial | `/app/billing`, `BillingManager.tsx`, `/api/billing/*` |

Cambio de plan: se cobra el plan nuevo descontando los días no usados del actual; la
suscripción anterior se cancela al aprobarse el pago (`subscription-sync.service`).

Datos (sin cambios de esquema): `Subscription.providerCustomerId` = id de la fuente de pago,
`Subscription.metadata.gateway = "WOMPI"` + periodo/próximo cobro/tarjeta; un
`PaymentTransaction` (gateway `WOMPI`) por cobro. Precios en COP: `PLAN_CONFIGS[plan].priceCop`.

## Variables (Vercel y `.env`)

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | `pub_test_…` (sandbox) o `pub_prod_…` |
| `WOMPI_PRIVATE_KEY` | `prv_test_…` / `prv_prod_…` |
| `WOMPI_INTEGRITY_SECRET` | `test_integrity_…` / `prod_integrity_…` |
| `WOMPI_EVENTS_SECRET` | `test_events_…` / `prod_events_…` |

El ambiente (sandbox o producción) se deduce del prefijo de la llave pública.
Todas están en comercios.wompi.co → Desarrolladores → Llaves / Secretos para integración técnica.

## Configuración en Wompi (una vez)

1. comercios.wompi.co → Desarrolladores → **URL de eventos**: `https://www.ethicvoice.co/api/webhooks/wompi` (sandbox y producción).
2. Para cobros recurrentes con Visa/Mastercard, pedir a Wompi habilitar **COF (Credential on File)** en el comercio.

## Pruebas (sandbox)

Tarjeta aprobada `4242 4242 4242 4242`, rechazada `4111 1111 1111 1111`, cualquier fecha futura y CVC.
`bun run test:pricing` verifica variables, endpoints y la conexión con Wompi.
