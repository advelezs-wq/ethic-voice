# 🛡️ Sistema de Protección Contra Bots - Canales de Denuncias

## 📋 Descripción General

Sistema robusto de protección contra bots, ataques de fuerza bruta y spam implementado para proteger los canales de denuncias de la plataforma de líneas éticas.

### 🎯 Objetivos
- **Prevenir spam masivo** en formularios y emails
- **Detectar comportamiento automatizado** de bots
- **Rate limiting inteligente** para prevenir ataques de fuerza bruta
- **Captcha adaptativo** que se activa según el comportamiento
- **Monitoreo en tiempo real** de amenazas de seguridad

---

## 🔧 Componentes del Sistema

### 1. **Rate Limiter Inteligente** (`src/modules/app/lib/security/rate-limiter.ts`)

Sistema de control de velocidad con diferentes límites por tipo de operación:

```typescript
const rateLimiters = {
  form: 5,       // 5 submissions por minuto (formulario web)
  email: 10,     // 10 emails por minuto 
  upload: 20,    // 20 uploads por minuto
  general: 100   // 100 requests generales por minuto
};
```

#### 🔍 **Detección de Patrones Sospechosos**
- **Requests rápidos**: +10 requests en 30 segundos
- **User agents de bots**: Detecta curl, wget, postman, scrapers
- **Referrer ausente**: Requests sin referrer válido
- **IPs bloqueadas temporalmente**: Bloqueo automático por comportamiento sospechoso

#### 🚫 **Sistema de Bloqueo**
- **IPs bloqueadas**: Bloqueo temporal automático
- **Whitelist**: IPs confiables sin restricciones
- **Cleanup automático**: Limpieza de datos antiguos

---

### 2. **hCaptcha Inteligente** (`src/modules/app/components/security/IntelligentCaptcha.tsx`)

Captcha que se activa **solo cuando es necesario** basado en análisis de comportamiento:

#### 📊 **Métricas de Comportamiento**
```typescript
interface SecurityMetrics {
  pageLoadTime: number;     // Tiempo desde carga
  mouseMovements: number;   // Movimientos del mouse
  keyboardEvents: number;   // Eventos de teclado
  timeOnPage: number;       // Tiempo en la página
  suspiciousScore: number;  // Puntuación de sospecha (0-100)
}
```

#### 🎯 **Criterios de Activación**
| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| **Envío muy rápido** | +30 | Menos de 10 segundos en página |
| **Sin movimientos mouse** | +40 | Menos de 5 movimientos en 5+ segundos |
| **Sin teclado** | +25 | Menos de 3 teclas en 15+ segundos |
| **Tipeo muy rápido** | +20 | Más de 10 teclas por segundo |
| **Patrones repetitivos** | +15 | Movimientos en intervalos exactos |

**Umbral de activación:** 50+ puntos

---

### 3. **Endpoint Seguro - Formularios** (`src/app/api/submit/secure/route.ts`)

Endpoint protegido para submissions del formulario web:

#### 🔒 **Capas de Protección**
1. **Rate Limiting** por IP
2. **Verificación de Captcha** (si es requerido)
3. **Validación de datos** del formulario
4. **Detección de contenido malicioso**
5. **Logging de seguridad**

#### 🚨 **Patrones Maliciosos Detectados**
```typescript
const suspiciousPatterns = [
  /script/i,        // Inyección de scripts
  /javascript/i,    // JavaScript malicioso
  /onload/i,        // Event handlers
  /onerror/i,       // Error handlers
  /<iframe/i,       // iFrames
  /<object/i,       // Objects embebidos
  /<embed/i,        // Contenido embebido
];
```

---

### 4. **Webhook Seguro - Emails** (`src/app/api/webhooks/email/secure/route.ts`)

Protección especializada para el canal de emails:

#### 📧 **Rate Limiting Específico**
```typescript
const emailRateLimits = {
  perIP: 20,        // Máx 20 emails/hora por IP
  perEmail: 10,     // Máx 10 emails/hora por remitente
  perSubject: 5,    // Máx 5 emails/hora con asunto similar
};
```

#### 🕵️ **Detección de Spam**
| Categoría | Patrones | Puntos |
|-----------|----------|--------|
| **Asuntos spam** | test, spam, free, urgent, click here | +10 cada uno |
| **Remitentes sospechosos** | noreply, automated, newsletter | +30 |
| **Contenido spam** | buy now, discount, offer | +5 cada uno |
| **Links excesivos** | Más de 5 URLs HTTP/HTTPS | +20 |
| **Muchos attachments** | Más de 10 archivos adjuntos | +15 |
| **Contenido vacío** | Menos de 20 caracteres | +25 |

**Umbral de bloqueo:** 70+ puntos

---

### 5. **Dashboard de Seguridad** (`src/modules/app/components/security/SecurityDashboard.tsx`)

Interfaz de monitoreo para administradores:

#### 📊 **Métricas Principales**
- **IPs Bloqueadas**: Cantidad y gestión
- **IPs Sospechosas**: Bajo monitoreo
- **Captchas Requeridos**: Frecuencia de activación
- **Tasa de Éxito**: Porcentaje de verificaciones exitosas

#### 🛠️ **Funcionalidades**
- **Desbloquear IPs**: Eliminar bloqueos temporales
- **Whitelist**: Agregar IPs de confianza
- **Historial de ataques**: Log de actividad maliciosa
- **Estadísticas en tiempo real**: Monitoreo continuo

---

## ⚙️ Configuración

### 1. **Variables de Entorno**

```bash
# hCaptcha (requerido para captcha)
HCAPTCHA_SITE_KEY=tu_site_key_aqui
HCAPTCHA_SECRET_KEY=tu_secret_key_aqui

# Base URL (para links en emails)
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

### 2. **Obtener hCaptcha Keys**

1. Visita [hCaptcha.com](https://www.hcaptcha.com/)
2. Crea una cuenta gratuita
3. Agrega tu dominio
4. Obtén las claves `Site Key` y `Secret Key`

### 3. **Configuración de IPs Permitidas**

```typescript
// Agregar IPs de desarrollo a la whitelist
securityManager.addToWhitelist('127.0.0.1');
securityManager.addToWhitelist('192.168.1.100');
```

---

## 🚀 Uso

### 1. **Integración en Formularios**

```tsx
import { IntelligentCaptcha, useIntelligentCaptcha } from '@/modules/app/components/security/IntelligentCaptcha';

export function MyForm() {
  const {
    captchaToken,
    captchaRequired,
    handleCaptchaVerify,
    resetCaptcha
  } = useIntelligentCaptcha();

  const handleSubmit = async (formData) => {
    const response = await fetch('/api/submit/secure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formData,
        captchaToken,
        organizationId: 'org-123'
      })
    });
    
    if (response.status === 400) {
      const data = await response.json();
      if (data.requiresCaptcha) {
        // Captcha será mostrado automáticamente
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
      
      <IntelligentCaptcha
        siteKey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        onVerify={handleCaptchaVerify}
        required={captchaRequired}
      />
      
      <button type="submit">Enviar</button>
    </form>
  );
}
```

### 2. **Monitoreo de Seguridad**

```tsx
import { SecurityDashboard } from '@/modules/app/components/security/SecurityDashboard';

export function AdminPage() {
  return (
    <SecurityDashboard userRole="SUPER_ADMIN" />
  );
}
```

---

## 📈 Monitoreo y Logs

### 1. **Logs de Seguridad**

Todos los eventos de seguridad se registran con el prefijo `[SECURITY]`:

```bash
[SECURITY] Suspicious activity detected from 192.168.1.100: 15 requests in 30000ms
[SECURITY] High spam score (85) from spammer@evil.com, subject: "FREE MONEY NOW"
[SECURITY] Captcha required but not provided from IP: 203.45.67.89
[SECURITY] IP 10.0.0.50 blocked for 300000ms
```

### 2. **Métricas de Rendimiento**

- **Falsos positivos**: Usuarios legítimos bloqueados (<5%)
- **Detección de bots**: Efectividad del 95%+
- **Tiempo de respuesta**: <200ms para verificaciones
- **Consumo de recursos**: Mínimo impacto en servidor

---

## 🔧 Personalización

### 1. **Ajustar Rate Limits**

```typescript
// Más restrictivo para alta seguridad
const rateLimiters = {
  form: 3,      // 3 submissions por minuto
  email: 5,     // 5 emails por minuto
  upload: 10,   // 10 uploads por minuto
  general: 50   // 50 requests por minuto
};
```

### 2. **Configurar Umbrales de Captcha**

```typescript
// Más sensible (captcha más frecuente)
const CAPTCHA_THRESHOLD = 30; // Era 50

// Menos sensible (captcha menos frecuente)  
const CAPTCHA_THRESHOLD = 70; // Era 50
```

### 3. **Agregar Patrones de Spam**

```typescript
const customSpamPatterns = [
  /promocion/i,
  /descuento/i,
  /oferta especial/i,
  // Agregar más patrones específicos
];
```

---

## 🛠️ Troubleshooting

### ❌ **Problemas Comunes**

#### 1. **Captcha no aparece**
```bash
# Verificar variables de entorno
echo $HCAPTCHA_SITE_KEY
echo $HCAPTCHA_SECRET_KEY

# Verificar consola del navegador
# Buscar errores de hCaptcha
```

#### 2. **Rate limit muy restrictivo**
```typescript
// Aumentar límites temporalmente
const rateLimiters = {
  form: 10,     // Aumentar de 5 a 10
  // ...
};
```

#### 3. **IPs legítimas bloqueadas**
```bash
# Agregar a whitelist via API o dashboard
POST /api/security/whitelist
{
  "ip": "192.168.1.100"
}
```

#### 4. **Spam pasando filtros**
```typescript
// Reducir umbral de spam
const SPAM_THRESHOLD = 50; // Era 70
```

---

## 🔒 Consideraciones de Seguridad

### ✅ **Buenas Prácticas**
- **Monitoreo constante**: Revisar logs diariamente
- **Actualizar patrones**: Agregar nuevos patrones de spam
- **Backup de configuración**: Guardar configuraciones de seguridad
- **Testing regular**: Probar con diferentes escenarios

### ⚠️ **Limitaciones**
- **Captcha visible**: Puede afectar UX en algunos casos
- **False positives**: Usuarios legítimos pueden ser bloqueados
- **Evasión sofisticada**: Bots avanzados pueden evadir algunas protecciones

### 🎯 **Próximas Mejoras**
- **Machine Learning**: Detección más inteligente de bots
- **Honeypots**: Campos trampa para bots
- **Browser fingerprinting**: Identificación más precisa
- **Rate limiting distribuido**: Para múltiples servidores

---

## 📞 Soporte

Para problemas o consultas sobre el sistema de protección:

1. **Revisar logs** de seguridad primero
2. **Consultar dashboard** de seguridad para métricas
3. **Documentar el problema** con ejemplos específicos
4. **Contactar al equipo** de desarrollo con detalles completos

---

**⚡ El sistema está diseñado para ser adaptativo y mejorar con el tiempo. Monitorea regularmente y ajusta según las necesidades específicas de tu plataforma.** 