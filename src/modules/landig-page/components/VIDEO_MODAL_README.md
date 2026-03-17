# VideoModal Component

## Descripción

Componente interactivo para mostrar videos de demostración en el hero de la landing page. Incluye una vista previa con botón de reproducción animado y un modal con el video a pantalla completa.

## Características

### Vista Previa

- **Thumbnail del video**: Muestra un poster del video (imagen de vista previa)
- **Botón de play animado**: Botón circular verde con efecto de "ping" pulsante
- **Hover effects**: Efecto de escala suave al pasar el mouse
- **Card informativa**: Texto descriptivo en la parte inferior con información sobre el video

### Modal de Video

- **Reproducción automática**: El video se reproduce automáticamente al abrir el modal
- **Backdrop blur**: Fondo difuminado para enfocar la atención en el video
- **Controles nativos**: Usa los controles nativos del navegador (play, pause, volumen, pantalla completa)
- **Botón de cerrar**: Botón personalizado con animación de rotación
- **Responsive**: Se adapta a diferentes tamaños de pantalla (size="5xl")

## Uso

```tsx
import { VideoModal } from "./VideoModal";

<VideoModal
  videoSrc="/demo-video.mp4"
  posterSrc="/platform/ethicvoice-hero.jpeg"
/>;
```

## Props

| Prop        | Tipo   | Descripción                       | Requerido |
| ----------- | ------ | --------------------------------- | --------- |
| `videoSrc`  | string | Ruta del archivo de video (MP4)   | Sí        |
| `posterSrc` | string | Ruta de la imagen de vista previa | No        |

## Colores de Ethic Voice

El componente utiliza la paleta de colores de Ethic Voice:

- **Verde principal**: `green-600`, `green-700` (#98D24C aproximado)
- **Texto**: `gray-900`, `gray-600`
- **Fondos**: Gradientes de verde y transparencias

## Animaciones

- **Framer Motion**: Para animaciones suaves de hover y transiciones
- **Tailwind animate-ping**: Para el efecto pulsante del botón de play
- **Transiciones CSS**: Para efectos de hover y estados

## Dependencias

- `@heroui/react`: Modal component
- `framer-motion`: Animaciones
- `iconify`: Iconos (mdi--play, mdi--play-circle, mdi--close)

## Notas Técnicas

- El video se pausa y reinicia al cerrar el modal
- Usa `playsInline` para compatibilidad con iOS
- `controlsList="nodownload"` previene la descarga del video
- El modal usa `backdrop="blur"` para un efecto visual premium
