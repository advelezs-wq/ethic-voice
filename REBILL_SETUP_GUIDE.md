# 🚀 Guía Completa: Configuración de Rebill para EthicVoice

## 📋 **PASO 1: Crear Cuenta en Rebill**

### 1.1 Registro Inicial

1. **Visita**: [https://rebill.com](https://rebill.com)
2. **Clic en**: "Empezar ahora" o "Start now"
3. **Completa el formulario**:
   - Nombre y apellido
   - Email empresarial
   - Nombre de la empresa: "EthicVoice"
   - País: Colombia
   - Tipo de negocio: SaaS/Software
   - Volumen estimado mensual: (según tus proyecciones)

### 1.2 Verificación de Cuenta

1. **Verifica tu email** (revisa spam/promociones)
2. **Completa el perfil empresarial**:
   - Información legal de la empresa
   - Documentos requeridos (RUT, Cámara de Comercio)
   - Información bancaria para recibir pagos

### 1.3 Configuración del Dashboard

1. **Accede al Dashboard** de Rebill
2. **Ve a Settings → API Keys**
3. **Obtén tus credenciales**:
   - API Key (Producción)
   - API Key (Sandbox/Testing)
   - Secret Key
   - Webhook Secret

## 🔑 **PASO 2: Variables de Entorno**

Agrega estas variables a tu archivo `.env`:

```bash
# Rebill Configuration
REBILL_API_KEY_TEST=rb_test_xxxxxxxxxxxx
REBILL_API_KEY_PROD=rb_live_xxxxxxxxxxxx
REBILL_SECRET_KEY=rbs_xxxxxxxxxxxx
REBILL_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
REBILL_ENVIRONMENT=sandbox # cambiar a 'production' en vivo
REBILL_API_URL=https://api.rebill.com/v1
```

## 📊 **PASO 3: Configurar Productos y Planes**

### 3.1 En el Dashboard de Rebill

1. **Ve a "Products"** → **"Create Product"**
2. **Crea cada plan**:

**Plan Starter:**

- Name: "Starter Plan"
- Description: "Plan básico para startups"
- Price: $150,000 COP
- Billing Cycle: Monthly
- Trial Days: 14

**Plan Grow:**

- Name: "Grow Plan"
- Description: "Plan intermedio para empresas en crecimiento"
- Price: $420,000 COP
- Billing Cycle: Monthly
- Trial Days: 14

**Plan Grow Pro:**

- Name: "Grow Pro Plan"
- Description: "Plan avanzado con características empresariales"
- Price: $1,200,000 COP
- Billing Cycle: Monthly
- Trial Days: 14

### 3.2 Configurar Webhooks

1. **Ve a Settings → Webhooks**
2. **Agrega endpoint**: `https://tudominio.com/api/webhooks/rebill`
3. **Selecciona eventos**:
   - `subscription.created`
   - `subscription.activated`
   - `subscription.payment_successful`
   - `subscription.payment_failed`
   - `subscription.cancelled`
   - `customer.created`

## 💳 **PASO 4: Métodos de Pago Disponibles**

Rebill en Colombia soporta:

- ✅ **Tarjetas de Crédito**: Visa, Mastercard, American Express
- ✅ **PSE**: Pagos Seguros en Línea
- ✅ **Nequi**: Billetera digital
- ✅ **Transferencias bancarias**
- ✅ **Pagos en efectivo**: Efecty, Baloto
- ✅ **Pagos en cuotas** sin interés

## 🎯 **VENTAJAS DE REBILL CONFIRMADAS**

### ✅ **Costos Competitivos**

- **4% + $500 COP + VAT** por transacción
- **Incluye gestión de suscripciones** (sin costo adicional)
- **Reintentos inteligentes** automáticos
- Mejor que MercadoPago para suscripciones

### ✅ **Características Destacadas**

- **Recupera hasta 71%** de pagos fallidos
- **Aumenta aprobación hasta 20%**
- **Soporte 24/7** en español
- **Integración en menos de 2 horas**
- **Certificación PCI DSS Nivel 1**

### ✅ **Perfecto para SaaS**

- Gestión automática de suscripciones
- Facturación flexible
- Reintentos inteligentes
- Prevención de churn
- Analytics avanzados

## 🚀 **PASO 5: Datos de Prueba**

### Tarjetas de Prueba (Sandbox)

```bash
# Tarjeta aprobada
Número: 4111111111111111
CVV: 123
Fecha: 12/25
Nombre: Test User

# Tarjeta rechazada
Número: 4000000000000002
CVV: 123
Fecha: 12/25
Nombre: Test Declined
```

### Usuarios de Prueba

```bash
Email: test@example.com
Teléfono: +57 300 123 4567
Documento: CC 12345678
```

## 📞 **PASO 6: Contacto y Soporte**

### Para Activación del Servicio

- **Email**: soporte@rebill.com
- **WhatsApp**: +57 (XXX) XXX-XXXX (verificar en su sitio)
- **Dashboard**: Live chat disponible

### Información a Proporcionar

1. Nombre de la empresa: **EthicVoice**
2. Tipo de negocio: **SaaS - Plataforma de denuncias éticas**
3. Volumen estimado mensual
4. Métodos de pago requeridos
5. Países de operación: **Colombia**

## ⚠️ **IMPORTANTE**

1. **Activación requerida**: Contacta a Rebill para activar suscripciones
2. **Certificación PCI**: Rebill maneja la seguridad
3. **Compliance**: Cumple con regulaciones colombianas
4. **Migración**: Pueden ayudar a migrar desde MercadoPago

## 🎯 **SIGUIENTES PASOS**

1. ✅ Crear cuenta en Rebill
2. ✅ Configurar productos y planes
3. ✅ Obtener credenciales API
4. ✅ Implementar código (siguiente paso)
5. ✅ Configurar webhooks
6. ✅ Realizar pruebas
7. ✅ Activar en producción

---

**¿Listo para continuar con la implementación del código?** 🚀
