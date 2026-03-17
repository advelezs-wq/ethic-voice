# Configuración de Microsoft Clarity

## ✅ Implementación Completada

Se ha integrado Microsoft Clarity en el layout principal del proyecto (`src/app/layout.tsx`).

Microsoft Clarity es una herramienta gratuita de análisis de comportamiento que te ayuda a entender cómo los usuarios interactúan con tu sitio mediante:
- 📹 **Grabaciones de sesiones**: Ve cómo los usuarios navegan por tu sitio
- 🔥 **Mapas de calor**: Visualiza dónde hacen clic y se desplazan los usuarios
- 📊 **Análisis de comportamiento**: Comprende patrones de uso
- 🆓 **100% Gratuito**: Sin límites de tráfico o sesiones

## 📋 Paso Final: Configurar Variable de Entorno

Agrega la siguiente variable de entorno a tu archivo `.env`:

```env
NEXT_PUBLIC_CLARITY_ID=u2gs9scuk4
```

### Ubicación del archivo
- Archivo: `.env` (en la raíz del proyecto)
- Agrega la línea al final del archivo

### Importante
- La variable debe comenzar con `NEXT_PUBLIC_` para ser accesible en el cliente
- Reinicia el servidor de desarrollo después de agregar la variable

## 🔍 Verificación

### 1. Verificar en el navegador
Después de reiniciar el servidor:

1. Abre tu sitio web
2. Abre las herramientas de desarrollo (F12)
3. Ve a la pestaña "Network"
4. Busca una petición a `clarity.ms/tag/u2gs9scuk4`
5. Si la ves con status 200, Clarity está funcionando correctamente

### 2. Verificar en la consola del navegador

Ejecuta este código en la consola:

```javascript
if (typeof clarity !== 'undefined') {
  console.log('✅ Microsoft Clarity ACTIVO');
  console.log('Session ID:', clarity.getSessionId());
} else {
  console.log('❌ Microsoft Clarity no detectado');
}
```

### 3. Verificar en el Dashboard de Clarity

1. Ve al [Dashboard de Microsoft Clarity](https://clarity.microsoft.com/)
2. Selecciona tu proyecto "Ethicvoice"
3. Deberías ver datos aparecer en aproximadamente 2 horas después de la primera visita
4. Las grabaciones de sesiones comenzarán a aparecer automáticamente

## 📊 Datos que se Rastrean Automáticamente

Una vez configurado, Clarity rastrea automáticamente:
- ✅ **Visitas a páginas**: Todas las páginas visitadas
- ✅ **Clics**: Dónde hacen clic los usuarios
- ✅ **Scroll**: Qué tan lejos se desplazan los usuarios
- ✅ **Movimiento del mouse**: Trayectoria del cursor
- ✅ **Tiempo en página**: Cuánto tiempo pasan en cada página
- ✅ **Dispositivo y navegador**: Información técnica del usuario

## 🎯 Funcionalidades Avanzadas (Opcional)

### 1. Identificar Usuarios

Útil para rastrear usuarios específicos después del login:

```typescript
import { identifyClarityUser } from '@/lib/clarity';

// Después del login exitoso
const handleLoginSuccess = (user) => {
  identifyClarityUser({
    userId: user.id,
    friendlyName: `${user.firstName} ${user.lastName}`
  });
};
```

### 2. Etiquetar Sesiones con Tags

Los tags ayudan a filtrar sesiones en el dashboard:

```typescript
import { setClarityTag, setClarityTags } from '@/lib/clarity';

// Un solo tag
setClarityTag('user_type', 'premium');

// Múltiples tags a la vez
setClarityTags({
  plan: 'enterprise',
  industry: 'healthcare',
  language: 'es'
});
```

### 3. Rastrear Eventos Personalizados

```typescript
import { trackClarityEvent } from '@/lib/clarity';

// Cuando alguien envía un reporte
const handleReportSubmit = () => {
  // ... lógica de envío
  trackClarityEvent('report_submitted');
};

// Cuando alguien completa el checkout
const handleCheckoutComplete = () => {
  trackClarityEvent('checkout_initiated');
};
```

### 4. Gestionar Consentimiento GDPR

```typescript
import { updateClarityConsent } from '@/lib/clarity';

// Usuario acepta cookies
const handleAcceptCookies = () => {
  updateClarityConsent('granted');
};

// Usuario rechaza cookies
const handleRejectCookies = () => {
  updateClarityConsent('denied');
};
```

### 5. Obtener Session ID

Útil para vincular con otros sistemas de analytics:

```typescript
import { getClaritySessionId } from '@/lib/clarity';

const sessionId = getClaritySessionId();
if (sessionId) {
  console.log('Clarity Session ID:', sessionId);
  // Enviar a tu backend o analytics
}
```

## 💡 Casos de Uso Sugeridos

### Caso 1: Identificar usuarios después del login

```typescript
// En tu componente de login o callback de autenticación
import { identifyClarityUser, setClarityTags } from '@/lib/clarity';

const handleUserAuthenticated = async (user) => {
  // Identificar al usuario
  identifyClarityUser({
    userId: user.id,
    friendlyName: user.email
  });
  
  // Agregar información contextual
  setClarityTags({
    user_role: user.role,
    organization: user.organizationName,
    subscription_plan: user.subscriptionPlan
  });
};
```

### Caso 2: Rastrear el flujo de envío de reportes

```typescript
// En tu formulario de envío de reportes
import { trackClarityEvent, setClarityTag } from '@/lib/clarity';

const ReportSubmitForm = () => {
  const handleStartForm = () => {
    trackClarityEvent('report_form_started');
  };
  
  const handleSubmit = async (data) => {
    setClarityTag('report_type', data.category);
    trackClarityEvent('report_submitted');
  };
  
  // ... resto del componente
};
```

### Caso 3: Analizar el proceso de registro

```typescript
// En tu flujo de onboarding
import { trackClarityEvent, setClarityTags } from '@/lib/clarity';

const OnboardingFlow = () => {
  const handleStepComplete = (step: number) => {
    trackClarityEvent(`onboarding_step_${step}_completed`);
  };
  
  const handleRegistrationComplete = (data) => {
    setClarityTags({
      company_size: data.companySize,
      industry: data.industry,
      country: data.country
    });
    trackClarityEvent('registration_completed');
  };
  
  // ... resto del componente
};
```

### Caso 4: Monitorear conversiones de pricing

```typescript
// En tu página de pricing
import { trackClarityEvent, setClarityTag } from '@/lib/clarity';

const PricingCard = ({ plan }) => {
  const handlePlanClick = () => {
    setClarityTag('selected_plan', plan.name);
    trackClarityEvent('checkout_initiated');
  };
  
  return (
    <button onClick={handlePlanClick}>
      Seleccionar {plan.name}
    </button>
  );
};
```

## 📈 Análisis en el Dashboard

Una vez que los datos comiencen a llegar (2-4 horas después de la primera visita):

### Ver Grabaciones de Sesiones
1. Ve a "Recordings" en el dashboard
2. Filtra por tags, eventos o páginas específicas
3. Reproduce las sesiones para ver la experiencia del usuario

### Analizar Mapas de Calor
1. Ve a "Heatmaps" en el dashboard
2. Selecciona la página que quieres analizar
3. Ve dónde los usuarios hacen más clic y dónde se desplazan

### Segmentar por Tags
1. Usa los tags para filtrar sesiones específicas
2. Por ejemplo: "user_type:premium" para ver solo usuarios premium
3. O "report_submitted" para ver sesiones donde se envió un reporte

### Analizar Eventos
1. Ve a la sección de eventos en el dashboard
2. Filtra por eventos personalizados que rastreaste
3. Ve el embudo de conversión y dónde se pierden usuarios

## 🔒 Privacidad y Seguridad

Clarity automáticamente:
- ✅ Enmascara información sensible (emails, passwords, números de tarjeta)
- ✅ Cumple con GDPR y CCPA
- ✅ Permite gestionar consentimiento de usuarios
- ✅ No vende ni comparte datos con terceros

### Enmascarar elementos adicionales

Si tienes campos sensibles adicionales, agrégales la clase CSS:

```html
<input type="text" className="clarity-mask" />
```

O usa el atributo data:

```html
<div data-clarity-mask="true">
  Información confidencial
</div>
```

## 📝 Notas Técnicas

- El script de Clarity se carga con la estrategia `afterInteractive` para optimizar el rendimiento
- Solo se carga si la variable de entorno está configurada
- Compatible con todas las páginas del sitio (landing, app, tracking, etc.)
- Los datos pueden tardar 2-4 horas en aparecer por primera vez
- Las grabaciones se guardan por 30 días en el plan gratuito

## 🔗 Recursos

- [Dashboard de Clarity](https://clarity.microsoft.com/)
- [Documentación oficial](https://docs.microsoft.com/en-us/clarity/)
- [API Reference](https://docs.microsoft.com/en-us/clarity/setup-and-installation/clarity-api)
- [Guía de mejores prácticas](https://docs.microsoft.com/en-us/clarity/faq)

## 🤝 Integración con Facebook Pixel

Clarity funciona perfectamente junto con Facebook Pixel. Ambas herramientas están integradas y se complementan:

- **Facebook Pixel**: Optimización de anuncios y conversiones
- **Microsoft Clarity**: Análisis de comportamiento y UX

Puedes usar los Session IDs de Clarity junto con los eventos de Facebook para análisis más profundos.

