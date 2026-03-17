# 📊 Configuración Completa de Analytics

Este documento resume la integración de todas las herramientas de analytics en EthicVoice.

## ✅ Herramientas Integradas

1. **Facebook Pixel** - Seguimiento de conversiones y optimización de anuncios
2. **Microsoft Clarity** - Análisis de comportamiento y grabaciones de sesiones
3. **Google Analytics 4** - Análisis completo de tráfico y conversiones

## 🚀 Configuración Rápida

### Paso 1: Variables de Entorno

Agrega estas líneas a tu archivo `.env` (en la raíz del proyecto):

```env
# Facebook Pixel
NEXT_PUBLIC_FB_PIXEL_ID=853588500537480

# Microsoft Clarity
NEXT_PUBLIC_CLARITY_ID=u2gs9scuk4

# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-8FB8781FD4
```

### Paso 2: Reiniciar el Servidor

```bash
# Detén el servidor actual (Ctrl+C)
# Y vuelve a iniciar
npm run dev
# o
yarn dev
```

### Paso 3: Verificar

Abre tu sitio en el navegador y ejecuta en la consola:

```javascript
// Verificar Facebook Pixel
console.log('Facebook Pixel:', typeof fbq !== 'undefined' ? '✅ Activo' : '❌ Inactivo');

// Verificar Clarity
console.log('Clarity:', typeof clarity !== 'undefined' ? '✅ Activo' : '❌ Inactivo');

// Verificar Google Analytics 4
console.log('Google Analytics 4:', typeof gtag !== 'undefined' ? '✅ Activo' : '❌ Inactivo');
```

## 📋 Verificación Completa

### En el DevTools (F12) → Network:

Deberías ver estas peticiones con status 200:

- ✅ `fbevents.js` (Facebook Pixel)
- ✅ `tr?id=853588500537480&ev=PageView` (Facebook Event)
- ✅ `clarity.ms/tag/u2gs9scuk4` (Clarity)
- ✅ `googletagmanager.com/gtag/js?id=G-8FB8781FD4` (GA4)

### Dashboards:

- **Facebook**: [Administrador de Eventos](https://business.facebook.com/events_manager)
- **Clarity**: [Dashboard](https://clarity.microsoft.com/)
- **Google Analytics**: [GA4 Dashboard](https://analytics.google.com/)

## 🎯 Uso en el Código

### Eventos de Facebook Pixel

```typescript
import { trackFacebookEvent } from '@/lib/facebook-pixel';

// Rastrear lead (envío de reporte)
trackFacebookEvent('Lead');

// Rastrear registro completado
trackFacebookEvent('CompleteRegistration', {
  content_name: 'Registro de Organización',
  value: 1
});

// Rastrear inicio de checkout
trackFacebookEvent('InitiateCheckout', {
  content_name: 'Plan Enterprise',
  value: 99,
  currency: 'USD'
});
```

### Eventos de Clarity

```typescript
import { 
  trackClarityEvent, 
  identifyClarityUser, 
  setClarityTag 
} from '@/lib/clarity';

// Rastrear evento personalizado
trackClarityEvent('report_submitted');

// Identificar usuario después del login
identifyClarityUser({
  userId: user.id,
  friendlyName: user.email
});

// Agregar tags para filtrar sesiones
setClarityTag('user_type', 'premium');
setClarityTag('plan', 'enterprise');
```

### Eventos de Google Analytics 4

```typescript
import { 
  trackGA4Event, 
  trackGA4Lead, 
  trackGA4SignUp,
  trackGA4BeginCheckout 
} from '@/lib/google-analytics';

// Rastrear evento personalizado
trackGA4Event('report_submitted', {
  content_type: 'ethical_report',
  value: 1
});

// Rastrear lead (envío de reporte)
trackGA4Lead(1, 'USD');

// Rastrear registro
trackGA4SignUp('email');

// Rastrear inicio de checkout
trackGA4BeginCheckout(99, 'USD', [{
  item_id: 'plan_enterprise',
  item_name: 'Plan Enterprise',
  price: 99,
  quantity: 1,
  item_category: 'subscription'
}]);
```

## 📊 Comparación de Herramientas

| Característica | Facebook Pixel | Microsoft Clarity |
|---------------|----------------|-------------------|
| **Propósito** | Optimización de anuncios | Análisis de UX |
| **Precio** | Gratis | Gratis |
| **Datos principales** | Conversiones, eventos | Grabaciones, mapas de calor |
| **Mejor para** | Marketing, ROI | UX, optimización |
| **Tiempo de datos** | Inmediato (20 min) | 2-4 horas |
| **Límites** | Ninguno | Ninguno |

## 🔄 Flujo de Eventos Recomendado

### 1. Landing Page (Visitante anónimo)
```typescript
// Se rastrea automáticamente:
// - Facebook: PageView
// - Clarity: Sesión iniciada
```

### 2. Usuario Envía Reporte
```typescript
// En el componente de envío
import { trackFacebookEvent } from '@/lib/facebook-pixel';
import { trackClarityEvent, setClarityTag } from '@/lib/clarity';

const handleSubmitReport = async (data) => {
  // ... lógica de envío
  
  // Facebook: Rastrear lead
  trackFacebookEvent('Lead', {
    content_name: 'Reporte Ético',
    value: 1
  });
  
  // Clarity: Evento + tag
  trackClarityEvent('report_submitted');
  setClarityTag('report_type', data.category);
};
```

### 3. Usuario se Registra
```typescript
// En el componente de registro
import { trackFacebookEvent } from '@/lib/facebook-pixel';
import { trackClarityEvent, identifyClarityUser } from '@/lib/clarity';

const handleRegistration = async (user) => {
  // ... lógica de registro
  
  // Facebook: Registro completado
  trackFacebookEvent('CompleteRegistration', {
    content_name: 'Registro de Organización'
  });
  
  // Clarity: Identificar usuario + evento
  identifyClarityUser({
    userId: user.id,
    friendlyName: user.email
  });
  trackClarityEvent('registration_completed');
};
```

### 4. Usuario Inicia Checkout
```typescript
// En la página de pricing o checkout
import { trackFacebookEvent } from '@/lib/facebook-pixel';
import { trackClarityEvent, setClarityTag } from '@/lib/clarity';

const handleSelectPlan = (plan) => {
  // Facebook: Inicio de checkout
  trackFacebookEvent('InitiateCheckout', {
    content_name: plan.name,
    value: plan.price,
    currency: 'USD'
  });
  
  // Clarity: Tag del plan seleccionado
  setClarityTag('selected_plan', plan.name);
  trackClarityEvent('checkout_initiated');
};
```

### 5. Pago Completado
```typescript
// En el webhook de pago o confirmación
import { trackFacebookEvent } from '@/lib/facebook-pixel';
import { trackClarityEvent, setClarityTags } from '@/lib/clarity';

const handlePaymentSuccess = (subscription) => {
  // Facebook: Compra completada
  trackFacebookEvent('Purchase', {
    content_name: subscription.planName,
    value: subscription.amount,
    currency: 'USD'
  });
  
  // Clarity: Tags de suscripción
  setClarityTags({
    subscription_plan: subscription.planName,
    subscription_status: 'active',
    payment_method: subscription.paymentMethod
  });
  trackClarityEvent('subscription_created');
};
```

## 🎨 Ubicaciones Sugeridas para Integrar

### 1. Envío de Reportes
- **Archivo**: `src/modules/submit/components/`
- **Eventos**: `Lead` (Facebook) + `report_submitted` (Clarity)

### 2. Registro/Onboarding
- **Archivo**: `src/app/app/onboarding/page.tsx`
- **Eventos**: `CompleteRegistration` (Facebook) + `registration_completed` (Clarity)

### 3. Pricing/Checkout
- **Archivo**: `src/app/pricing/page.tsx` o `src/app/checkout/page.tsx`
- **Eventos**: `InitiateCheckout` (Facebook) + `checkout_initiated` (Clarity)

### 4. Login/Autenticación
- **Archivo**: `src/modules/core/providers/ClientProvider.tsx`
- **Acciones**: Identificar usuario en Clarity + tags de rol

### 5. Webhooks de Pago
- **Archivo**: `src/app/api/webhooks/rebill/route.ts` o `mercadopago/route.ts`
- **Eventos**: `Purchase` (Facebook) + `subscription_created` (Clarity)

## 🔒 Privacidad y GDPR

Ambas herramientas cumplen con GDPR y CCPA:

### Para gestionar consentimiento:

```typescript
import { updateClarityConsent } from '@/lib/clarity';

const handleCookieConsent = (accepted: boolean) => {
  if (accepted) {
    updateClarityConsent('granted');
    // Facebook Pixel no requiere acción (ya está rastreando)
  } else {
    updateClarityConsent('denied');
    // Para Facebook, no inicialices el píxel si el usuario no acepta
  }
};
```

### Enmascarar campos sensibles:

```html
<!-- Clarity enmascara automáticamente passwords, emails, tarjetas -->
<!-- Para campos adicionales: -->
<input className="clarity-mask" />
<div data-clarity-mask="true">Datos sensibles</div>
```

## 📈 Análisis y Reportes

### Facebook Ads Manager
1. Ve al [Administrador de Eventos](https://business.facebook.com/events_manager)
2. Revisa eventos en tiempo real
3. Crea audiencias personalizadas basadas en eventos
4. Optimiza anuncios para conversiones específicas

### Microsoft Clarity Dashboard
1. Ve al [Dashboard de Clarity](https://clarity.microsoft.com/)
2. Mira grabaciones de sesiones reales
3. Analiza mapas de calor de tus páginas más importantes
4. Filtra por tags para ver segmentos específicos
5. Identifica puntos de fricción en el UX

## 📚 Documentación Completa

- [Guía de Facebook Pixel](./FACEBOOK_PIXEL_SETUP.md)
- [Guía de Microsoft Clarity](./CLARITY_SETUP.md)

## ✅ Checklist de Implementación

- [x] Facebook Pixel integrado en layout
- [x] Microsoft Clarity integrado en layout
- [x] Helpers de Facebook creados
- [x] Helpers de Clarity creados
- [x] Tipos TypeScript definidos
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Servidor reiniciado
- [ ] Verificación en navegador completada
- [ ] Eventos personalizados agregados en el código
- [ ] Dashboards verificados

## 🚀 Próximos Pasos

1. ✅ Agrega las variables de entorno
2. ✅ Reinicia el servidor
3. ✅ Verifica en el navegador
4. 📝 Identifica los puntos clave donde quieres rastrear eventos
5. 💻 Implementa los eventos usando los helpers
6. 📊 Revisa los dashboards después de 2-4 horas
7. 🎯 Optimiza basándote en los datos

---

**¿Necesitas ayuda?** Consulta las guías detalladas de cada herramienta o los ejemplos de código en este documento.

