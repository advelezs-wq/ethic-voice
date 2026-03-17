# Sistema de Páginas de Error de EthicVoice

Este documento describe el sistema de páginas de error personalizadas implementado en la plataforma EthicVoice.

## 📋 Descripción General

Se han implementado páginas de error personalizadas que proporcionan una experiencia de usuario profesional y consistente cuando ocurren errores en la plataforma. Cada página de error incluye:

- ✅ Logo de EthicVoice para mantener la identidad visual
- ✅ Mensaje de disculpa por el inconveniente
- ✅ Indicación de que el equipo ha sido notificado
- ✅ Botones de acción para navegar (Intentar nuevamente / Volver al inicio)
- ✅ Información de contacto para soporte
- ✅ Diseño responsive y moderno
- ✅ Mensajes en español

## 📁 Estructura de Archivos

### Páginas de Error Principales

```
src/app/
├── error.tsx              # Error general a nivel de sitio web
├── global-error.tsx       # Error global crítico (último recurso)
├── not-found.tsx         # Página 404 a nivel de sitio web
└── app/
    ├── error.tsx         # Error general dentro de la aplicación
    ├── not-found.tsx    # Página 404 dentro de la aplicación
    └── your-forms/
        ├── builder/[id]/error.tsx  # Error en constructor de formularios
        └── forms/[id]/error.tsx    # Error en vista de formularios
└── submit/
    └── [formUrl]/error.tsx    # Error en formulario de denuncia pública
```

## 🎨 Diseño y Características

### Elementos Visuales

Todas las páginas de error incluyen:

1. **Logo de EthicVoice**: Ubicado en la parte superior (120x120px)
2. **Icono de Estado**: 
   - ⚠️ Triángulo de advertencia rojo para errores
   - 404 para páginas no encontradas
3. **Mensaje Principal**: Título claro del tipo de error
4. **Descripción**: Explicación amigable del problema
5. **Botones de Acción**:
   - Primario: "Intentar nuevamente" (con función reset)
   - Secundario: "Volver al inicio" (navegación)
6. **Footer**: Información de contacto con email de soporte

### Estilos

- Fondo degradado: `from-gray-50 to-gray-100`
- Tarjeta central: `rounded-2xl shadow-2xl`
- Diseño responsive y centrado
- Espaciado consistente
- Tipografía clara y legible

## 🔧 Funcionalidad Técnica

### Next.js App Router

El sistema utiliza las convenciones de Next.js 13+ App Router:

- `error.tsx`: Captura errores en el segmento de ruta y sus hijos
- `global-error.tsx`: Captura errores globales (incluyendo errores en layout.tsx raíz)
- `not-found.tsx`: Maneja errores 404 (página no encontrada)

### Props de Error Component

```typescript
{
  error: Error & { digest?: string };  // Objeto del error
  reset: () => void;                   // Función para reintentar
}
```

### Logging de Errores

Todos los errores se registran en la consola con contexto específico:

```typescript
console.error("Error en [contexto]:", error);
```

**Nota**: En producción, estos logs deberían enviarse a un servicio de monitoreo como:
- Sentry
- LogRocket
- Datadog
- New Relic

## 🎯 Contextos Específicos

### 1. Error Global (`global-error.tsx`)

- **Ubicación**: Raíz de la aplicación
- **Uso**: Errores críticos que afectan toda la app
- **Características especiales**: 
  - Incluye etiquetas `<html>` y `<body>`
  - Es el último recurso de captura de errores

### 2. Error de Aplicación (`app/error.tsx`)

- **Ubicación**: Dentro de `/app/*`
- **Uso**: Errores en la aplicación autenticada
- **Navegación**: Vuelve a `/app`

### 3. Error de Formularios (`app/your-forms/*/error.tsx`)

- **Ubicación**: Secciones de formularios
- **Uso**: Errores al cargar o construir formularios
- **Navegación**: Vuelve a `/app/your-forms`

### 4. Error de Denuncias Públicas (`submit/[formUrl]/error.tsx`)

- **Ubicación**: Formulario público de denuncias
- **Uso**: Errores al cargar formularios de denuncia
- **Navegación**: Vuelve a `/submit`
- **Especial**: Para usuarios no autenticados

### 5. Páginas 404 (`not-found.tsx`)

- **Ubicación**: Raíz y `/app`
- **Uso**: Páginas no encontradas
- **Diseño**: Muestra número "404" grande
- **Navegación**: Múltiples opciones según contexto

## 🚀 Modo Desarrollo vs Producción

### Desarrollo

En modo desarrollo (`NODE_ENV === "development"`), las páginas de error muestran:
- Mensaje de error completo
- Stack trace en la consola
- Información adicional de debugging

### Producción

En modo producción:
- Solo mensaje amigable para el usuario
- Información técnica enviada a servicios de monitoreo
- No se exponen detalles técnicos

## 📧 Información de Contacto

Todas las páginas incluyen enlace de soporte:
- Email: support@ethicvoice.co
- Estilo: Enlace destacado con hover effect

## 🔄 Próximos Pasos Recomendados

### 1. Integración con Servicio de Monitoreo

Agregar integración con servicio de monitoreo de errores:

```typescript
// Ejemplo con Sentry
import * as Sentry from "@sentry/nextjs";

useEffect(() => {
  Sentry.captureException(error, {
    tags: {
      section: "form-builder",
      userId: currentUser?.id,
    },
  });
}, [error]);
```

### 2. Métricas y Analytics

Registrar errores en analytics para análisis:

```typescript
// Ejemplo con Google Analytics
gtag('event', 'exception', {
  description: error.message,
  fatal: false,
});
```

### 3. Notificaciones al Equipo

Configurar notificaciones automáticas:
- Slack webhook para errores críticos
- Email al equipo técnico
- Dashboard de monitoreo

### 4. Página de Estado

Crear página de estado del servicio:
- `/status` - Mostrar estado de servicios
- Integración con status pages (e.g., statuspage.io)

## 🧪 Testing

Para probar las páginas de error:

### Forzar Error 404
```
Navegar a: https://ethicvoice.co/pagina-inexistente
```

### Forzar Error General
```typescript
// Agregar en cualquier componente temporalmente
throw new Error("Test error");
```

### Probar Reset Function
1. Forzar un error
2. Click en "Intentar nuevamente"
3. Verificar que se recarga el componente

## 📝 Mantenimiento

### Actualizar Mensajes

Los mensajes se pueden personalizar editando los archivos correspondientes:
- Títulos: Cambiar en la etiqueta `<h1>`
- Descripciones: Actualizar en la etiqueta `<p>`
- Botones: Modificar texto y rutas en componentes `<Button>`

### Actualizar Estilos

Los estilos utilizan Tailwind CSS y pueden ajustarse:
- Colores: Modificar clases de color
- Espaciado: Ajustar clases de padding/margin
- Responsive: Agregar breakpoints si es necesario

### Cambiar Logo

Si se actualiza el logo:
1. Reemplazar archivo en `/public/brand/logo-nobg.png`
2. O actualizar la ruta `src` en todas las páginas de error

## 🔐 Seguridad

**Importante**: Las páginas de error NO deben exponer:
- ❌ Información sensible de la base de datos
- ❌ Secretos o API keys
- ❌ Stack traces completos en producción
- ❌ Información de usuarios
- ❌ Detalles de infraestructura

Solo mostrar:
- ✅ Mensajes amigables
- ✅ Opciones de navegación
- ✅ Información de contacto público

## 📚 Referencias

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Hero UI Components](https://heroui.com/)

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0  
**Responsable**: Equipo de Desarrollo EthicVoice

