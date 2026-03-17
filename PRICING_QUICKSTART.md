# ⚡ Quick Start: Sistema de Pricing EthicVoice

Esta es la guía rápida para poner en funcionamiento el sistema de pricing en **menos de 30 minutos**.

## 🚀 Setup Rápido (Para Desarrollo)

### 1. Instalar Dependencias (si no las tienes)

```bash
npm install mercadopago node-fetch
```

### 2. Variables de Entorno Mínimas

Crea `.env.local` con:

```bash
# MercadoPago TEST (obligatorio)
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="TEST-xxxxx-xxxxxx-xxxxxx-xxxxxx"
MERCADO_PAGO_ACCESS_TOKEN="TEST-xxxxx-xxxxxx-xxxxxx-xxxxxx"
MERCADO_PAGO_WEBHOOK_SECRET="any-secret-for-development"

# URLs (cambia por tu dominio)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Feature flags
NEXT_PUBLIC_DEMO_MODE="false"
ENABLE_PRICING_SYSTEM="true"

# Mantén tus variables existentes de DATABASE_URL, CLERK, etc.
```

### 3. Aplicar Migraciones

```bash
npm run setup:pricing
```

### 4. Probar el Sistema

```bash
npm run pricing:dev
```

Luego ve a: `http://localhost:3000/pricing`

---

## 📋 Obtener Credenciales de MercadoPago

### Desarrollo/Testing:

1. Ve a: [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Crea aplicación → "EthicVoice"
3. Copia las credenciales de **TEST**:
   ```
   Public Key: TEST-xxxxx-xxxxxx-xxxxxx-xxxxxx
   Access Token: TEST-xxxxx-xxxxxx-xxxxxx-xxxxxx
   ```

### Producción:

Usa las credenciales **LIVE** (que empiezan con `APP_USR-`)

---

## 🧪 Verificar que Todo Funciona

```bash
# Test completo del sistema
npm run test:pricing

# Test específico de MercadoPago
npm run mercadopago:test

# Test de seguridad (opcional)
npm run validate:security
```

---

## 🎯 Flujo de Testing Rápido

1. **Ve a `/pricing`** → Deberías ver 4 planes
2. **Selecciona "Starter"** → Te lleva a MercadoPago
3. **Usa tarjeta de prueba**: `4509 9535 6623 3704` (Visa)
4. **Completa pago** → Te redirige a payment-success
5. **Crea organización** → El plan se activa automáticamente

---

## 🚨 Troubleshooting Rápido

### ❌ Error: "MercadoPago is not defined"

```bash
# Verifica que las env vars estén cargadas
echo $NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY
```

### ❌ Error: "Plan restrictions not working"

```bash
# Verifica migraciones
npx prisma migrate status
npx prisma migrate deploy
```

### ❌ Error: "Webhook signature invalid"

```bash
# Para desarrollo, usa cualquier secret
MERCADO_PAGO_WEBHOOK_SECRET="desarrollo-secret"
```

### ❌ Error: "Database connection"

```bash
# Verifica que tu DATABASE_URL esté correcto
npx prisma db push
```

---

## 🔄 Para Producción

1. **Cambia a credenciales LIVE de MercadoPago**
2. **Configura webhook**: `https://tudominio.com/api/webhooks/mercadopago`
3. **Actualiza URLs**:
   ```bash
   NEXT_PUBLIC_APP_URL="https://tudominio.com"
   NEXTAUTH_URL="https://tudominio.com"
   NEXT_PUBLIC_DEMO_MODE="false"
   ```
4. **Deploy con**:
   ```bash
   npm run pricing:build
   ```

---

## 📞 ¿Problemas?

1. **Revisa logs** en la consola del navegador
2. **Verifica env vars** con `npm run test:pricing`
3. **Consulta la guía completa**: `PRICING_SETUP_GUIDE.md`

---

## ✅ Checklist de 5 Minutos

- [ ] Variables de entorno configuradas
- [ ] `npm run test:pricing` pasa
- [ ] `/pricing` page carga correctamente
- [ ] Puedes seleccionar un plan
- [ ] MercadoPago checkout funciona

**¡Listo! Tu sistema de pricing está funcionando 🎉**

---

## 🎯 Características Implementadas

- ✅ **4 Planes**: STARTER ($35), GROW ($100), GROW PRO ($220), PREMIUM (Contacto)
- ✅ **Restricciones por Plan**: Email, IA, Analytics, Usuarios, Customización
- ✅ **Integración MercadoPago**: Checkout directo desde pricing page
- ✅ **Webhooks**: Activación automática de planes
- ✅ **Seguridad**: Validación anti-abuso en múltiples capas
- ✅ **UI/UX**: Banners de upgrade, widgets de plan, restricciones visuales
- ✅ **Analytics**: Restricciones por niveles de plan
- ✅ **Email Channel**: Control de permisos
- ✅ **User Management**: Límites automáticos
- ✅ **Organization Settings**: Customización por nivel

**Sistema completamente funcional y listo para producción 🚀**
