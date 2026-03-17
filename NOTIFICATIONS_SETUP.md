# Sistema de Notificaciones - Configuración

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env` para configurar el sistema de notificaciones:

```env
# Email Notifications con Resend
RESEND_API_KEY="tu_resend_api_key_aqui"
RESEND_FROM_EMAIL="noreply@ethicvoice.co"

# URL base de la aplicación (usar la variable existente)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Configuración de Resend

1. **Crear cuenta en Resend**:
   - Ve a [resend.com](https://resend.com)
   - Crea una cuenta gratuita
   - Verifica tu dominio (o usa el dominio de testing)

2. **Obtener API Key**:
   - En el dashboard de Resend, ve a "API Keys"
   - Crea una nueva API key
   - Cópiala y agrégala a tu `.env` como `RESEND_API_KEY`

3. **Configurar dominio**:
   - Si tienes un dominio propio, agrégalo en Resend
   - Configura los registros DNS necesarios
   - Si no, puedes usar el dominio de testing de Resend

## Funcionalidades Implementadas

### ✅ Notificaciones por Email
- **Confirmación de reporte recibido**: Se envía automáticamente al reportante con código de seguimiento
- **Nuevo reporte creado**: Notifica a administradores de la organización
- **Reporte asignado**: Notifica al miembro asignado
- **Reporte urgente**: Notificación inmediata para casos críticos

### ✅ Notificaciones Internas
- **Bandeja de notificaciones**: Icono de campana en el header
- **Contador de no leídas**: Badge con número de notificaciones pendientes
- **Diferentes tipos**: Iconos y colores según el tipo de notificación
- **Marca como leídas**: Individual o todas a la vez

### ✅ Configuración de Usuario
- **Preferencias por email**: El usuario puede activar/desactivar emails por tipo
- **Preferencias in-app**: Control de notificaciones internas
- **Configuraciones por organización**: Diferentes ajustes por organización

## Estructura de Base de Datos

### Nuevas Tablas Creadas

1. **`Notification`**:
   - Almacena todas las notificaciones del sistema
   - Relacionada con usuarios, organizaciones y reportes
   - Estados: PENDING, SENT, FAILED, READ

2. **`NotificationSettings`**:
   - Preferencias de notificación por usuario
   - Control granular por tipo de notificación
   - Configuración de email e in-app por separado

### Enums Agregados

- `NotificationType`: Tipos de notificación disponibles
- `NotificationChannel`: IN_APP, EMAIL, BOTH
- `NotificationStatus`: Estados de las notificaciones

## Integración en el Código

### Servicios
- **`NotificationsService`**: Servicio principal que maneja toda la lógica
- **Plantillas de email**: Templates responsivos para diferentes eventos
- **Configuración de preferencias**: Manejo inteligente de configuraciones

### Hooks de React
- **`useNotificationEvents`**: Eventos para disparar notificaciones
- **`useNotifications`**: Hook para consumir notificaciones en el frontend

### APIs Creadas
- `GET /api/notifications`: Obtener notificaciones del usuario
- `POST /api/notifications/[id]/read`: Marcar como leída
- `POST /api/notifications/mark-all-read`: Marcar todas como leídas

## Flujos de Notificación

### 1. Creación de Reporte
```
Reporte creado → AI procesa → Notificaciones:
├── Email de confirmación al reportante (si no es anónimo)
├── Notificación a administradores (email + in-app)
└── Si es urgente → Notificación crítica adicional
```

### 2. Asignación de Reporte
```
Admin asigna reporte → Notificación:
├── Email al miembro asignado
└── Notificación in-app
```

### 3. Cambios de Estado
```
Estado cambia → Notificación in-app:
└── A todos los miembros asignados
```

### 4. Comentarios
```
Nuevo comentario → Notificación in-app:
└── A todos los miembros asignados
```

## Ejemplos de Uso

### Enviar Notificación Personalizada
```typescript
await notificationsService.createNotification({
  userId: 'user_123',
  orgId: 'org_456',
  type: 'SYSTEM_ALERT',
  title: 'Mantenimiento Programado',
  message: 'El sistema estará en mantenimiento el domingo',
  channel: 'BOTH', // Email + In-app
  actionUrl: '/maintenance-info'
});
```

### Usar Hook de Eventos
```typescript
const { onReportCreated } = useNotificationEvents();

// Después de crear un reporte
await onReportCreated(reportId, orgId, reporterEmail);
```

## Testing

### Probar Emails Localmente
1. Configura Resend con dominio de testing
2. Crea un reporte desde el formulario
3. Verifica que lleguen los emails

### Probar Notificaciones In-App

#### Método 1: API de Prueba
Puedes crear notificaciones de prueba usando la API:
```bash
curl -X POST http://localhost:3000/api/notifications/test
```
Esto creará 4 notificaciones de prueba de diferentes tipos.

#### Método 2: Acciones Reales
1. **Crear reporte**: Ve a `/submit` y crea un nuevo reporte
2. **Asignar reporte**: En el dashboard de admin, asigna un reporte a un miembro
3. **Cambiar estado**: Cambia el estado de un reporte desde el sidebar
4. **Agregar comentario**: Agrega un comentario en el chat de un reporte

#### Verificar Funcionamiento
1. Ve al header y verifica que aparezca el contador en la campana
2. Haz clic en la campana para ver las notificaciones
3. Haz clic en una notificación para navegar al reporte
4. Marca notificaciones como leídas
5. Verifica que el contador se actualice

## Troubleshooting

### Emails no llegan
1. Verifica `RESEND_API_KEY` en `.env`
2. Verifica que el dominio esté configurado en Resend
3. Revisa los logs en el dashboard de Resend

### Notificaciones no aparecen
1. Verifica que el usuario esté autenticado
2. Revisa la consola del navegador por errores
3. Verifica que las APIs respondan correctamente

### Performance
- Las notificaciones se procesan en background para no afectar la UX
- Si falla una notificación, no afecta el flujo principal
- Las preferencias se cachean para mejor rendimiento

## Próximas Mejoras

- [ ] Notificaciones push en el navegador
- [ ] Integración con WhatsApp/SMS
- [ ] Digest diario/semanal de notificaciones
- [ ] Templates personalizables por organización
- [ ] Analytics de notificaciones 