# Configuración de Google Analytics 4

## ✅ Implementación Completada

Se ha integrado Google Analytics 4 (GA4) en el layout principal del proyecto (`src/app/layout.tsx`).

Google Analytics 4 es la plataforma de análisis más avanzada de Google que te proporciona:

- 📊 **Análisis detallado**: Comprende el comportamiento del usuario
- 🎯 **Seguimiento de conversiones**: Mide objetivos y resultados
- 👥 **Análisis de audiencia**: Conoce mejor a tus usuarios
- 🔮 **Insights predictivos**: Predicciones basadas en ML
- 🆓 **Gratuito**: Sin costo hasta 10 millones de eventos/mes

## 📋 Paso Final: Configurar Variable de Entorno

Agrega la siguiente variable de entorno a tu archivo `.env`:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-8FB8781FD4
```

### Ubicación del archivo

- Archivo: `.env` (en la raíz del proyecto)
- Agrega la línea al final del archivo

### Importante

- La variable debe comenzar con `NEXT_PUBLIC_` para ser accesible en el cliente
- Reinicia el servidor de desarrollo después de agregar la variable

## 🔍 Verificación

### 1. Verificar en el navegador

Después de reiniciar el servidor:bun

1. Abre tu sitio web
2. Abre las herramientas de desarrollo (F12)
3. Ve a la pestaña "Network"
4. Busca una petición a `googletagmanager.com/gtag/js?id=G-8FB8781FD4`
5. Si la ves con status 200, GA4 está funcionando correctamente

### 2. Verificar en la consola del navegador

Ejecuta este código en la consola:

```javascript
if (typeof gtag !== "undefined" && typeof dataLayer !== "undefined") {
  console.log("✅ Google Analytics 4 ACTIVO");
  console.log("dataLayer:", dataLayer);
} else {
  console.log("❌ Google Analytics 4 no detectado");
}
```

### 3. Verificar en tiempo real en GA4

1. Ve al [Dashboard de Google Analytics](https://analytics.google.com/)
2. Selecciona tu propiedad (ID: G-8FB8781FD4)
3. Ve a "Informes" → "Tiempo real"
4. Navega por tu sitio
5. Deberías ver tu actividad aparecer en tiempo real

## 📊 Datos que se Rastrean Automáticamente

Una vez configurado, GA4 rastrea automáticamente:

- ✅ **page_view**: Visitas a páginas
- ✅ **session_start**: Inicio de sesiones
- ✅ **first_visit**: Primeras visitas
- ✅ **scroll**: Desplazamiento en páginas
- ✅ **click**: Clics en enlaces externos
- ✅ **file_download**: Descargas de archivos
- ✅ **video_start/complete**: Interacciones con videos

## 🎯 Funcionalidades Avanzadas (Opcional)

### 1. Rastrear Eventos Personalizados

```typescript
import { trackGA4Event } from "@/lib/google-analytics";

// Evento simple
trackGA4Event("button_click", {
  content_type: "cta",
  content_id: "pricing_button",
});

// Evento con más detalles
trackGA4Event("report_submitted", {
  content_type: "ethical_report",
  value: 1,
  user_type: "premium",
});
```

### 2. Rastrear Generación de Leads

```typescript
import { trackGA4Lead } from "@/lib/google-analytics";

// Cuando alguien envía un reporte
const handleSubmitReport = () => {
  // ... lógica de envío
  trackGA4Lead(1, "USD");
};
```

### 3. Rastrear Registro de Usuarios

```typescript
import { trackGA4SignUp } from "@/lib/google-analytics";

// Después del registro exitoso
const handleRegistrationComplete = () => {
  trackGA4SignUp("email");
};
```

### 4. Rastrear Inicio de Checkout

```typescript
import { trackGA4BeginCheckout } from "@/lib/google-analytics";

// Cuando el usuario inicia el proceso de pago
const handleCheckoutStart = (plan) => {
  trackGA4BeginCheckout(plan.price, "USD", [
    {
      item_id: plan.id,
      item_name: plan.name,
      price: plan.price,
      quantity: 1,
      item_category: "subscription",
    },
  ]);
};
```

### 5. Rastrear Compras Completadas

```typescript
import { trackGA4Purchase } from "@/lib/google-analytics";

// En el webhook de confirmación de pago
const handlePaymentSuccess = (subscription) => {
  trackGA4Purchase(subscription.id, subscription.amount, "USD", [
    {
      item_id: subscription.planId,
      item_name: subscription.planName,
      price: subscription.amount,
      quantity: 1,
      item_category: "subscription",
    },
  ]);
};
```

### 6. Identificar Usuarios (después del login)

```typescript
import { setGA4Parameters } from "@/lib/google-analytics";

// Después del login exitoso
const handleLoginSuccess = (user) => {
  setGA4Parameters({
    user_id: user.id,
    user_type: user.role,
    organization: user.organizationName,
    subscription_plan: user.plan,
  });
};
```

### 7. Gestionar Consentimiento GDPR

```typescript
import { updateGA4Consent } from "@/lib/google-analytics";

// Usuario acepta cookies de analytics
const handleAcceptAnalytics = () => {
  updateGA4Consent({
    analytics_storage: "granted",
    ad_storage: "denied", // Si no usas ads
  });
};

// Usuario rechaza
const handleRejectAnalytics = () => {
  updateGA4Consent({
    analytics_storage: "denied",
    ad_storage: "denied",
  });
};
```

## 💡 Casos de Uso Sugeridos

### Caso 1: Flujo completo de envío de reportes

```typescript
import { trackGA4Event, trackGA4Lead } from "@/lib/google-analytics";

const ReportForm = () => {
  const handleStartForm = () => {
    trackGA4Event("form_start", {
      content_type: "ethical_report",
    });
  };

  const handleFieldComplete = (fieldName: string) => {
    trackGA4Event("form_field_complete", {
      content_id: fieldName,
    });
  };

  const handleSubmit = async () => {
    // Enviar reporte...

    // Rastrear como lead
    trackGA4Lead(1, "USD");

    trackGA4Event("report_submitted", {
      content_type: "ethical_report",
      method: "web_form",
    });
  };

  // ... resto del componente
};
```

### Caso 2: Funnel de conversión completo

```typescript
import {
  trackGA4Event,
  trackGA4BeginCheckout,
  trackGA4Purchase,
} from "@/lib/google-analytics";

// Paso 1: Usuario ve el pricing
const handleViewPricing = () => {
  trackGA4Event("view_item_list", {
    content_type: "pricing_plans",
  });
};

// Paso 2: Usuario selecciona un plan
const handleSelectPlan = (plan) => {
  trackGA4Event("select_item", {
    item_id: plan.id,
    item_name: plan.name,
    price: plan.price,
    item_category: "subscription",
  });
};

// Paso 3: Usuario inicia checkout
const handleInitiateCheckout = (plan) => {
  trackGA4BeginCheckout(plan.price, "USD", [
    {
      item_id: plan.id,
      item_name: plan.name,
      price: plan.price,
      quantity: 1,
      item_category: "subscription",
    },
  ]);
};

// Paso 4: Usuario completa el pago
const handlePaymentComplete = (subscription) => {
  trackGA4Purchase(subscription.id, subscription.amount, "USD", [
    {
      item_id: subscription.planId,
      item_name: subscription.planName,
      price: subscription.amount,
      quantity: 1,
      item_category: "subscription",
    },
  ]);
};
```

### Caso 3: Rastrear búsquedas y engagement

```typescript
import { trackGA4Search, trackGA4Event } from "@/lib/google-analytics";

// Búsquedas
const handleSearch = (query: string) => {
  trackGA4Search(query);
};

// Compartir contenido
const handleShare = (platform: string) => {
  trackGA4Event("share", {
    method: platform,
    content_type: "report_link",
  });
};

// Descargar PDF
const handleDownloadPDF = (reportId: string) => {
  trackGA4Event("file_download", {
    file_name: `report_${reportId}.pdf`,
    file_extension: "pdf",
    content_type: "report",
  });
};
```

## 📈 Configurar Conversiones en GA4

### 1. Marcar eventos como conversiones

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Configuración → Eventos
3. Busca eventos como `generate_lead`, `purchase`, `sign_up`
4. Activa "Marcar como conversión"

### 2. Crear audiencias personalizadas

1. Configuración → Audiencias
2. Nueva audiencia
3. Crea audiencias basadas en:
   - Usuarios que enviaron reportes
   - Usuarios que visitaron pricing pero no compraron
   - Usuarios con alta interacción

### 3. Configurar objetivos personalizados

Ejemplo: Rastrear usuarios que completan el onboarding

```typescript
import { trackGA4Event } from "@/lib/google-analytics";

const handleOnboardingComplete = () => {
  trackGA4Event("onboarding_complete", {
    method: "full_flow",
    value: 1,
  });
};
```

Luego marca `onboarding_complete` como conversión en GA4.

## 📊 Informes Útiles en GA4

### Informes en Tiempo Real

- **Ruta**: Informes → Tiempo real
- **Uso**: Ver actividad actual en tu sitio

### Informes de Adquisición

- **Ruta**: Informes → Ciclo de vida → Adquisición
- **Uso**: Cómo llegan los usuarios (orgánico, directo, referidos)

### Informes de Participación

- **Ruta**: Informes → Ciclo de vida → Participación
- **Uso**: Qué páginas y eventos son más populares

### Informes de Conversiones

- **Ruta**: Informes → Ciclo de vida → Monetización
- **Uso**: Seguimiento de compras y conversiones

### Explorar Datos

- **Ruta**: Explorar
- **Uso**: Análisis personalizado, embudos, segmentaciones

## 🔒 Privacidad y GDPR

GA4 es compatible con GDPR y ofrece:

### Anonimización de IP

Ya está activada por defecto en GA4.

### Gestión de consentimiento

```typescript
import { updateGA4Consent } from "@/lib/google-analytics";

// Configurar consentimiento inicial (antes de que el usuario responda)
updateGA4Consent({
  analytics_storage: "denied",
  ad_storage: "denied",
});

// Después de que el usuario acepta
updateGA4Consent({
  analytics_storage: "granted",
  ad_storage: "granted",
});
```

### Eliminar datos de usuario

Si un usuario solicita eliminar sus datos:

1. Ve a GA4 → Configuración → Retención de datos
2. Configura el período de retención
3. Usa la [User Deletion API](https://developers.google.com/analytics/devguides/config/userdeletion/v3) si es necesario

## 📝 Notas Técnicas

- El script de GA4 se carga con la estrategia `afterInteractive` para optimizar el rendimiento
- Solo se carga si la variable de entorno está configurada
- Compatible con todas las páginas del sitio (landing, app, tracking, etc.)
- Los datos pueden tardar 24-48 horas en aparecer completamente en informes estándar
- Los informes en tiempo real son inmediatos

## 🔗 Recursos

- [Dashboard de Google Analytics](https://analytics.google.com/)
- [Documentación oficial de GA4](https://support.google.com/analytics/answer/10089681)
- [Eventos recomendados](https://support.google.com/analytics/answer/9267735)
- [Guía de migración a GA4](https://support.google.com/analytics/answer/9744165)
- [API de GA4](https://developers.google.com/analytics/devguides/collection/ga4)

## 🤝 Integración con Otras Herramientas

GA4 funciona perfectamente junto con Facebook Pixel y Clarity:

- **Facebook Pixel**: Optimización de anuncios en Meta
- **Microsoft Clarity**: Grabaciones de sesiones y mapas de calor
- **Google Analytics 4**: Análisis profundo de comportamiento y conversiones

Puedes usar los tres juntos para obtener una visión completa:

- GA4 para análisis cuantitativo
- Clarity para análisis cualitativo (ver qué hacen los usuarios)
- Facebook Pixel para optimizar campañas de Meta
