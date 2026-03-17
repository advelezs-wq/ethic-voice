# 🔄 Redis Queue Setup - Background Workers

Este documento explica cómo configurar y usar el sistema de cola Redis para el procesamiento de trabajos en segundo plano.

## 🎯 Descripción del Sistema

El sistema de colas de EthicLine utiliza:

- **Upstash Redis** como broker de colas
- **BullMQ** para la gestión de trabajos
- **Workers** para procesar trabajos de forma asíncrona

### Tipos de Trabajos

1. **Submission Processing**: Procesa envíos de formularios
2. **Email Processing**: Procesa correos electrónicos (cuando Gmail esté configurado)

## 📋 Configuración

### 1. **Variables de Entorno Requeridas**

Añade estas variables a tu `.env.local` (desarrollo) y Vercel (producción):

```bash
# Upstash Redis - OBLIGATORIO
UPSTASH_REDIS_REST_URL=https://your-redis-rest-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_rest_token_here
UPSTASH_REDIS_URL=redis://your-redis-tcp-url.upstash.io:6379
```

### 2. **Obtener Credenciales de Upstash**

1. Ve a [Upstash Console](https://console.upstash.com/redis)
2. Crea una nueva base de datos Redis
3. Obtén las 3 URLs necesarias:
   - **REST URL**: Para operaciones básicas (`https://...`)
   - **REST TOKEN**: Token de autenticación
   - **TCP URL**: Para BullMQ (`redis://...`)

### 3. **Configurar en Vercel**

1. Ve a tu proyecto en Vercel Dashboard
2. Settings > Environment Variables
3. Añade las 3 variables de Upstash Redis
4. Redeploy tu aplicación

## 🚀 Desarrollo Local

### Ejecutar Workers Localmente

```bash
# Desarrollo (usa localhost Redis si no hay Upstash)
npm run workers:dev

# O con las credenciales de producción
npm run workers:prod
```

### Monitorear Colas

```bash
# Ver estado de las colas
npm run queue:status

# Procesar colas manualmente
npm run queue:process
```

## 🌐 Producción (Vercel + GitHub Actions)

### Opción 1: GitHub Actions Cron (Recomendado)

**Configuración automática** - Se ejecuta cada minuto:

1. **Configura el secreto en GitHub:**

   ```
   Repository Settings > Secrets and variables > Actions > Secrets

   Nombre: VERCEL_DEPLOYMENT_URL
   Valor: https://tu-app.vercel.app
   ```

2. **El archivo `.github/workflows/process-queue.yml` ya está configurado** ✅

3. **Activa GitHub Actions:**
   - Push cualquier cambio al repositorio
   - Ve a la pestaña "Actions" en GitHub
   - Verifica que el workflow se ejecute cada minuto

### Opción 2: API Manual

Puedes procesar la cola manualmente llamando al endpoint:

```bash
# Procesar trabajos (POST)
curl -X POST https://tu-app.vercel.app/api/admin/process-queue

# Ver estado (GET)
curl https://tu-app.vercel.app/api/admin/process-queue
```

## 📊 Monitoreo

### API Endpoints

- **GET** `/api/admin/process-queue` - Estado de las colas
- **POST** `/api/admin/process-queue` - Procesar trabajos manualmente

### Logs

**Desarrollo:**

```bash
npm run workers:dev
# Verás logs en tiempo real
```

**Producción:**

- **Vercel Functions Logs**: Dashboard > Functions > Logs
- **GitHub Actions Logs**: Repository > Actions > Workflow runs

### Estados de los Trabajos

```json
{
  "submission": {
    "waiting": 5, // Trabajos esperando
    "active": 1, // Trabajos procesándose
    "completed": 50, // Trabajos completados
    "failed": 2 // Trabajos fallidos
  }
}
```

## ⚠️ Troubleshooting

### "Redis connection failed"

```bash
# Verificar variables de entorno
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
echo $UPSTASH_REDIS_URL
```

**Soluciones:**

1. Verifica que las URLs de Upstash sean correctas
2. Asegúrate de que el token tenga permisos
3. Chequea que la base de datos Redis esté activa

### "No jobs in queue"

Esto es normal si no hay trabajos pendientes.

### "GitHub Actions no se ejecuta"

1. Verifica que el secreto `VERCEL_DEPLOYMENT_URL` esté configurado
2. Asegúrate de que GitHub Actions esté habilitado en el repositorio
3. Chequea los logs en la pestaña "Actions"

### "Workers se cuelgan"

Los workers temporales se ejecutan máximo 30 segundos y luego se cierran automáticamente.

## 🔧 Scripts Útiles

```bash
# Desarrollo
npm run workers:dev          # Workers en modo desarrollo
npm run queue:status         # Ver estado de colas
npm run queue:process        # Procesar colas manualmente

# Producción
npm run workers:prod         # Workers en modo producción
```

## 📈 Optimización

### Configuración de Workers

**Concurrencia:**

- Submissions: 3 trabajos simultáneos
- Emails: 1 trabajo simultáneo

**Reintentos:**

- 3 intentos con backoff exponencial
- Delay inicial: 2-5 segundos

### Limpieza Automática

- **Completados**: Se mantienen 50 trabajos
- **Fallidos**: Se mantienen 100 trabajos

## 🚨 Consideraciones de Seguridad

1. **No expongas las credenciales de Redis** en el código
2. **Usa HTTPS** para todas las llamadas a la API
3. **Limita el acceso** al endpoint de procesamiento manual
4. **Monitorea los logs** regularmente

---

## 📞 ¿Necesitas Ayuda?

1. **Logs del Sistema**: Busca mensajes con `[QUEUE]` en los logs
2. **Estado de Redis**: Usa el endpoint `/api/admin/process-queue`
3. **GitHub Actions**: Revisa la pestaña "Actions" del repositorio

**¡El sistema está configurado para funcionar automáticamente una vez que tengas las credenciales de Upstash!** 🚀
