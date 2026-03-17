# 🔧 Variables de Entorno - Sistema de Seguridad

Para que el sistema de protección contra bots funcione correctamente, necesitas configurar las siguientes variables de entorno:

## 🎯 Variables Requeridas

### 1. **Upstash Redis** (Obligatorio para queue de trabajos)

```bash
# Obtener en https://console.upstash.com/redis
UPSTASH_REDIS_REST_URL=https://your-redis-rest-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_rest_token_here
UPSTASH_REDIS_URL=redis://your-redis-tcp-url.upstash.io:6379
```

### 2. **hCaptcha** (Obligatorio para captcha)

```bash
# Obtener en https://www.hcaptcha.com/
HCAPTCHA_SITE_KEY=your_site_key_here
HCAPTCHA_SECRET_KEY=your_secret_key_here
```

### 3. **Base URL** (Obligatorio para webhook interno)

```bash
# URL base de tu aplicación
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
# En desarrollo:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. **Super Admin** (Opcional - para acceso al dashboard de seguridad)

```bash
# Emails separados por comas que tendrán acceso de super admin
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=admin@tudominio.com,security@tudominio.com
```

## 📋 Pasos de Configuración

### 1. **Configurar Upstash Redis**

1. Ve a [Upstash Console](https://console.upstash.com/redis)
2. Crea una nueva base de datos Redis
3. Obtén las 3 URLs necesarias:
   - **REST URL**: Para operaciones básicas
   - **REST TOKEN**: Token de autenticación
   - **TCP URL**: Para BullMQ (formato: `redis://...`)
4. Agrégalas a tu archivo `.env.local`

### 2. **Configurar hCaptcha**

1. Ve a [hCaptcha.com](https://www.hcaptcha.com/)
2. Crea una cuenta gratuita
3. Agrega tu dominio en "Sites"
4. Obtén las claves `Site Key` y `Secret Key`
5. Agrégalas a tu archivo `.env.local`

### 2. **Archivo .env.local**

Crea o actualiza tu archivo `.env.local` en la raíz del proyecto:

```bash
# Upstash Redis (OBLIGATORIO)
UPSTASH_REDIS_REST_URL=https://your-redis-rest-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_rest_token_here
UPSTASH_REDIS_URL=redis://your-redis-tcp-url.upstash.io:6379

# hCaptcha
HCAPTCHA_SITE_KEY=your_site_key_here
HCAPTCHA_SECRET_KEY=your_secret_key_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Super Admin (opcional)
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=tu-email@dominio.com

# Otras variables existentes...
```

### 3. **Verificar Configuración**

Reinicia tu servidor de desarrollo después de agregar las variables:

```bash
npm run dev
# o
bun dev
```

## ✅ Verificaciones

### 1. **hCaptcha**

- El captcha debería aparecer cuando detecte comportamiento sospechoso
- En desarrollo, puedes forzar su aparición navegando muy rápido

### 2. **Dashboard de Seguridad**

- Solo super admins pueden acceder a `/app/security`
- Verifica que tu email esté en la variable `NEXT_PUBLIC_SUPER_ADMIN_EMAILS`

### 3. **Rate Limiting**

- Prueba hacer múltiples submissions rápidas
- Deberías ver límites aplicándose en la consola

## 🚨 Troubleshooting

### "Captcha no aparece"

```bash
# Verificar variables
echo $HCAPTCHA_SITE_KEY
echo $HCAPTCHA_SECRET_KEY
```

### "No puedo acceder al dashboard de seguridad"

```bash
# Verificar email en super admin list
echo $NEXT_PUBLIC_SUPER_ADMIN_EMAILS
```

### "Error en webhook interno"

```bash
# Verificar base URL
echo $NEXT_PUBLIC_BASE_URL
```

## 🔒 Seguridad

- **Nunca** expongas `HCAPTCHA_SECRET_KEY` en el frontend
- Las variables `NEXT_PUBLIC_*` son visibles en el navegador
- Usa diferentes claves para desarrollo y producción
- Revisa regularmente los logs de seguridad

---

**📞 ¿Necesitas ayuda?** Revisa los logs en la consola con el prefijo `[SECURITY]` para diagnosticar problemas.
