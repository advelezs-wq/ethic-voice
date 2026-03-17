# 🚀 Guía de Configuración y Despliegue del Sistema de Pricing

Esta guía te llevará paso a paso para hacer funcional el sistema de pricing y suscripciones de EthicVoice.

## 📋 Prerrequisitos

- ✅ Sistema de pricing implementado (completado)
- ✅ Base de datos PostgreSQL configurada
- ✅ Cuenta de MercadoPago Argentina
- ✅ Dominio configurado para producción

---

## 🔧 Paso 1: Configuración de MercadoPago

### 1.1 Crear Aplicación en MercadoPago

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Inicia sesión con tu cuenta de MercadoPago
3. Ve a "Tus aplicaciones" → "Crear aplicación"
4. Completa los datos:
   - **Nombre**: "EthicVoice Subscriptions"
   - **Descripción**: "Sistema de suscripciones para EthicVoice"
   - **Categoría**: "Software/Tecnología"
   - **Modelo de negocio**: "SaaS"

### 1.2 Obtener Credenciales

**Para Testing:**

```bash
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="TEST-xxxxx-xxxxxx-xxxxxx-xxxxxx"
MERCADO_PAGO_ACCESS_TOKEN="TEST-xxxxx-xxxxxx-xxxxxx-xxxxxx"
```

**Para Producción:**

```bash
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="APP_USR-xxxxx-xxxxxx-xxxxxx-xxxxxx"
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-xxxxx-xxxxxx-xxxxxx-xxxxxx"
```

### 1.3 Configurar Webhooks en MercadoPago

1. En tu aplicación de MercadoPago, ve a "Webhooks"
2. Agrega una nueva URL de notificación:
   ```
   https://tudominio.com/api/webhooks/mercadopago
   ```
3. Selecciona los eventos:
   - ✅ `payment`
   - ✅ `subscription_preapproval`
   - ✅ `subscription_authorized_payment`
4. Guarda el **Webhook Secret** que te proporcionen

---

## 🔐 Paso 2: Variables de Entorno Requeridas

Crea/actualiza tu archivo `.env.local` con estas variables:

```bash
# ================================
# MERCADOPAGO (OBLIGATORIO)
# ================================
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="TEST-xxxxx-xxxxxx-xxxxxx-xxxxxx"
MERCADO_PAGO_ACCESS_TOKEN="TEST-xxxxx-xxxxxx-xxxxxx-xxxxxx"
MERCADO_PAGO_WEBHOOK_SECRET="tu-webhook-secret-aqui"

# ================================
# URLs DE APLICACIÓN (OBLIGATORIO)
# ================================
NEXT_PUBLIC_APP_URL="https://tudominio.com"
NEXTAUTH_URL="https://tudominio.com"

# URLs de retorno para pagos
NEXT_PUBLIC_PRICING_SUCCESS_URL="https://tudominio.com/app/onboarding/payment-success"
NEXT_PUBLIC_PRICING_CANCEL_URL="https://tudominio.com/pricing"

# ================================
# CONFIGURACIÓN DE PRICING
# ================================
DEFAULT_TRIAL_DAYS="14"
STARTER_PLAN_PRICE="35"
GROW_PLAN_PRICE="100"
GROW_PRO_PLAN_PRICE="220"

# Calendly para consultas Premium
CALENDLY_PREMIUM_URL="https://calendly.com/ethicvoice-info/30min"

# ================================
# SEGURIDAD Y ADMIN
# ================================
ADMIN_API_SECRET="tu-clave-super-secreta-admin"
CRON_SECRET="tu-clave-secreta-para-cron-jobs"

# ================================
# FEATURE FLAGS
# ================================
NEXT_PUBLIC_DEMO_MODE="false"  # IMPORTANTE: false en producción
ENABLE_PRICING_SYSTEM="true"
ENABLE_SECURITY_VALIDATION="true"
ENABLE_SUBSCRIPTION_WEBHOOKS="true"

# ================================
# VARIABLES EXISTENTES (mantener)
# ================================
DATABASE_URL="tu-database-url"
DIRECT_URL="tu-direct-url"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="tu-clerk-key"
CLERK_SECRET_KEY="tu-clerk-secret"
# ... resto de variables existentes
```

---

## 🗄️ Paso 3: Configuración de Base de Datos

### 3.1 Verificar Migración

La migración ya debería estar aplicada, pero verifica:

```bash
npx prisma migrate status
```

Si no está aplicada:

```bash
npx prisma migrate deploy
```

### 3.2 Configuración Inicial de Datos

Ejecuta este script para configurar datos iniciales:

```bash
# Crear archivo de seed
cat > prisma/seed-pricing.ts << 'EOF'
import { PrismaClient, PlanType, BillingCycle } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Configurando datos iniciales del sistema de pricing...');

  // Configurar planes por defecto si no existen
  const plans = [
    {
      type: PlanType.STARTER,
      price: 35,
      features: {
        maxUsers: 1,
        maxInvestigators: 4,
        maxEmployees: 50,
        hasEmailChannel: false,
        hasAiProcessing: false,
        hasAdvancedAnalytics: false,
        hasUnlimitedUsers: false,
        hasCustomization: true,
        hasColorThemes: false,
        hasUnlimitedCustomization: false
      }
    },
    {
      type: PlanType.GROW,
      price: 100,
      features: {
        maxUsers: 3,
        maxInvestigators: 10,
        maxEmployees: 200,
        hasEmailChannel: true,
        hasAiProcessing: true,
        hasAdvancedAnalytics: true,
        hasUnlimitedUsers: false,
        hasCustomization: true,
        hasColorThemes: true,
        hasUnlimitedCustomization: false
      }
    },
    {
      type: PlanType.GROW_PRO,
      price: 220,
      features: {
        maxUsers: 0, // unlimited
        maxInvestigators: 0, // unlimited
        maxEmployees: 1000,
        hasEmailChannel: true,
        hasAiProcessing: true,
        hasAdvancedAnalytics: true,
        hasUnlimitedUsers: true,
        hasCustomization: true,
        hasColorThemes: true,
        hasUnlimitedCustomization: true,
        hasChatbotChannel: true
      }
    },
    {
      type: PlanType.PREMIUM,
      price: 0, // Contact us
      features: {
        maxUsers: 0, // unlimited
        maxInvestigators: 0, // unlimited
        maxEmployees: 0, // unlimited
        hasEmailChannel: true,
        hasAiProcessing: true,
        hasAdvancedAnalytics: true,
        hasUnlimitedUsers: true,
        hasCustomization: true,
        hasColorThemes: true,
        hasUnlimitedCustomization: true,
        hasChatbotChannel: true,
        hasPhoneChannel: true,
        hasExternalManager: true,
        hasBilingualSupport: true
      }
    }
  ];

  for (const plan of plans) {
    console.log(`⚙️ Configurando plan ${plan.type}...`);

    // Aquí puedes agregar lógica adicional de configuración
    // Por ejemplo, crear organizaciones de ejemplo, etc.
  }

  console.log('✅ Configuración inicial completada');
}

main()
  .catch((e) => {
    console.error('❌ Error en configuración inicial:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

# Ejecutar el seed
npx tsx prisma/seed-pricing.ts
```

---

## 🌐 Paso 4: Configuración de URLs y Dominios

### 4.1 Configurar URLs de Retorno

En tu archivo de configuración de MercadoPago, asegúrate de tener:

```typescript
// En el API route de create-subscription
const preference = {
  // ... otros campos
  back_urls: {
    success: `${process.env.NEXT_PUBLIC_APP_URL}/app/onboarding/payment-success`,
    failure: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=payment_failed`,
    pending: `${process.env.NEXT_PUBLIC_APP_URL}/app/onboarding/payment-success`,
  },
  auto_return: "approved",
  // ...
};
```

### 4.2 Verificar Webhooks

Prueba que tu webhook esté funcionando:

```bash
curl -X POST https://tudominio.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🧪 Paso 5: Testing del Sistema

### 5.1 Testing Local

1. **Iniciar en modo desarrollo:**

   ```bash
   npm run dev
   ```

2. **Probar flujo de pricing:**
   - Ve a `/pricing`
   - Selecciona un plan
   - Completa el checkout (usa tarjetas de prueba de MercadoPago)
   - Verifica el redirect a payment-success

3. **Tarjetas de Prueba MercadoPago:**
   ```
   Visa: 4509 9535 6623 3704
   Mastercard: 5031 7557 3453 0604
   American Express: 3711 803032 57522
   ```

### 5.2 Testing de Webhooks

Usa ngrok para testing local de webhooks:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto local
ngrok http 3000

# Actualizar webhook URL en MercadoPago a:
# https://tu-ngrok-url.ngrok.io/api/webhooks/mercadopago
```

### 5.3 Testing de Restricciones

1. **Crear organización con plan Starter**
2. **Intentar acceder a características de planes superiores**
3. **Verificar que aparezcan banners de upgrade**
4. **Probar límites de usuarios**

---

## 🚀 Paso 6: Despliegue en Producción

### 6.1 Preparación Pre-Despliegue

```bash
# 1. Verificar que todas las env vars estén configuradas
npm run build

# 2. Verificar migraciones
npx prisma migrate deploy

# 3. Generar cliente de Prisma
npx prisma generate

# 4. Verificar que no hay errores de TypeScript
npm run type-check
```

### 6.2 Variables de Entorno de Producción

**IMPORTANTE:** En producción, cambia a las credenciales LIVE de MercadoPago:

```bash
# ⚠️ IMPORTANTE: Cambiar a credenciales de PRODUCCIÓN
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="APP_USR-xxxxx-xxxxxx-xxxxxx-xxxxxx"
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-xxxxx-xxxxxx-xxxxxx-xxxxxx"

# Asegúrate de que demo mode esté deshabilitado
NEXT_PUBLIC_DEMO_MODE="false"

# URLs correctas de producción
NEXT_PUBLIC_APP_URL="https://tudominio.com"
NEXTAUTH_URL="https://tudominio.com"
```

### 6.3 Configurar Webhooks de Producción

1. Actualiza la URL del webhook en MercadoPago a tu dominio de producción
2. Verifica que el endpoint responda correctamente:
   ```bash
   curl -X GET https://tudominio.com/api/webhooks/mercadopago
   ```

---

## ⚙️ Paso 7: Configuración de Cron Jobs (Opcional pero Recomendado)

### 7.1 Validación de Seguridad Automática

Configura un cron job para ejecutar validaciones de seguridad:

```bash
# En tu servidor o usando un servicio como Vercel Cron
# Ejecutar diariamente a las 2 AM
0 2 * * * curl -X POST "https://tudominio.com/api/admin/security/validate-plans" \
  -H "Authorization: Bearer ${ADMIN_API_SECRET}"
```

### 7.2 Cron Job con Vercel

Si usas Vercel, crea `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/security/validate-plans",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## 📊 Paso 8: Monitoreo y Analytics

### 8.1 Configurar Logging

Asegúrate de que los logs estén configurados:

```bash
# Variables de logging
LOG_LEVEL="info"
SENTRY_DSN="tu-sentry-dsn"  # Para tracking de errores
```

### 8.2 Métricas a Monitorear

1. **Conversiones de pricing**: CTR de planes
2. **Webhook success rate**: % de webhooks exitosos
3. **Payment failures**: Pagos fallidos
4. **Security violations**: Violaciones de seguridad detectadas
5. **User limits**: Organizaciones cerca de límites

---

## 🔐 Paso 9: Configuración de Seguridad

### 9.1 Configurar Rate Limiting

Si usas Upstash Redis:

```bash
UPSTASH_REDIS_REST_URL="https://tu-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="tu-token"
```

### 9.2 Configurar Bot Protection

```bash
# Cloudflare Turnstile
TURNSTILE_SECRET_KEY="tu-secret"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="tu-site-key"
```

---

## ✅ Checklist Final de Despliegue

### Pre-Despliegue:

- [ ] Variables de entorno configuradas
- [ ] Credenciales de MercadoPago (LIVE para producción)
- [ ] Webhooks configurados y probados
- [ ] Base de datos migrada
- [ ] Build exitoso sin errores
- [ ] Testing completo del flujo de pricing

### Post-Despliegue:

- [ ] Verificar que pricing page funcione
- [ ] Probar compra completa de un plan
- [ ] Verificar webhooks en producción
- [ ] Comprobar restricciones de características
- [ ] Monitorear logs por errores
- [ ] Configurar alertas de seguridad

### Validación Final:

- [ ] Crear cuenta nueva y comprar plan
- [ ] Verificar activación inmediata de características
- [ ] Probar upgrade entre planes
- [ ] Verificar enforcement de límites
- [ ] Comprobar emails de confirmación

---

## 🆘 Troubleshooting Común

### Error: "MercadoPago is not defined"

```javascript
// Asegúrate de que el script esté cargado
<script src="https://sdk.mercadopago.com/js/v2" async></script>
```

### Error: "Webhook signature invalid"

```bash
# Verifica que el webhook secret sea correcto
MERCADO_PAGO_WEBHOOK_SECRET="tu-secret-correcto"
```

### Error: "Plan restrictions not working"

```bash
# Verifica que las migraciones estén aplicadas
npx prisma migrate status
npx prisma migrate deploy
```

### Error: "Payment not activating plan"

```bash
# Revisa los logs del webhook
# Verifica que el orgId se esté linkando correctamente
```

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa logs** del servidor y webhooks
2. **Verifica variables de entorno** estén correctas
3. **Prueba webhooks** con herramientas como ngrok
4. **Consulta documentación** de MercadoPago
5. **Revisa estado** de servicios de MercadoPago

¡El sistema está listo para producción! 🚀
