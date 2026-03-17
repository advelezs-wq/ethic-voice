# 📎 Sistema de Archivos Multimedia - Configuración

Este documento describe la implementación completa del sistema de archivos multimedia para las denuncias en EthicLine.

## 🚀 Características Implementadas

### ✅ **Subida de Archivos en Formulario Web**
- Interfaz drag & drop con vista previa
- Validación de tipos de archivo y tamaño
- Barra de progreso en tiempo real
- Soporte para múltiples archivos (hasta 10)

### ✅ **Procesamiento de Archivos de Email**
- Descarga automática de adjuntos de Gmail
- Validación y filtrado de archivos
- Subida a Cloudinary desde emails

### ✅ **Visualización en Detalle del Reporte**
- Componente plegable con categorización
- Vista previa de imágenes
- Reproductor de audio/video integrado
- Descarga individual y gestión de archivos

### ✅ **Almacenamiento con Cloudinary**
- Proveedor más económico con plan gratuito generoso
- Optimización automática de imágenes
- CDN global para carga rápida
- Organización por carpetas (temp/permanente)

## 📋 Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```bash
# Cloudinary Configuration (Requerido)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Ya existentes (asegúrate de tener estas)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 🔧 Configuración de Cloudinary

### 1. **Crear Cuenta en Cloudinary**
```bash
# Visita: https://cloudinary.com/
# Regístrate para obtener cuenta gratuita
# Plan gratuito incluye:
# - 25GB de almacenamiento
# - 25GB de ancho de banda mensual
# - Hasta 2GB de archivos de video
```

### 2. **Obtener Credenciales**
```bash
# En tu dashboard de Cloudinary encontrarás:
# - Cloud Name
# - API Key  
# - API Secret
```

### 3. **Configurar Carpetas**
El sistema organizará automáticamente los archivos en:
```
reports/
├── {orgId}/
│   ├── temp-attachments/     # Archivos temporales del formulario
│   ├── attachments/          # Archivos permanentes de reportes
│   └── email-attachments/    # Archivos de emails procesados
```

## 📝 Tipos de Archivos Soportados

### 🖼️ **Imágenes**
- JPG, PNG, GIF, WebP
- Máximo: 50MB por archivo
- Vista previa automática

### 📄 **Documentos**
- PDF, Word (.doc, .docx)
- Excel (.xls, .xlsx)
- Texto plano (.txt)

### 🎵 **Audio**
- MP3, WAV, M4A
- Reproductor integrado

### 🎬 **Video**
- MP4, AVI, MOV, WebM
- Reproductor integrado
- Máximo recomendado: 50MB

## 🔄 Flujo de Procesamiento

### **Formulario Web**
1. Usuario selecciona archivos → `AttachmentUploader`
2. Validación cliente (tipo/tamaño) → JavaScript
3. Subida a `/api/upload/attachments` → Cloudinary temp
4. Envío del formulario → `submitEthicLineReport`
5. Procesamiento → `SubmissionProcessorService`
6. Movimiento temp → permanent → Cloudinary
7. Creación registros DB → `ReportAttachment`

### **Canal de Email**
1. Email recibido → `EmailProcessorService`
2. Descarga adjuntos → Gmail API
3. Validación archivos → Filtros tipo/tamaño
4. Subida directa → Cloudinary permanent
5. Procesamiento submission → Con attachments
6. Creación registros DB → `ReportAttachment`

## 🗃️ Estructura de Base de Datos

### **Tabla: ReportAttachment**
```sql
- id: INTEGER (PK)
- submissionId: INTEGER (FK)
- filename: STRING
- fileUrl: STRING (Cloudinary URL)
- fileSize: INTEGER (bytes)
- mimeType: STRING
- uploadedAt: DATETIME
- uploadedById: STRING
- uploadedByName: STRING
```

### **Metadatos en ReportActivity**
```json
{
  "filename": "evidence.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf", 
  "cloudinaryPublicId": "reports/org123/attachments/file_id",
  "source": "form_submission" | "email_attachment"
}
```

## 🎨 Componentes Implementados

### **AttachmentUploader** (`src/modules/submit/components/`)
- Upload drag & drop
- Vista previa archivos
- Validación en tiempo real
- Progreso de subida

### **ReportAttachments** (`src/modules/app/components/report/`)
- Visualización categorizada
- Reproductor multimedia
- Descarga individual
- Interfaz plegable

### **APIs**
- `POST /api/upload/attachments` - Subida temporal
- `GET /api/reports/[id]/attachments` - Listar archivos
- `POST /api/reports/[id]/attachments` - Subir directo al reporte

## 🔐 Seguridad y Validaciones

### **Validaciones de Archivos**
```typescript
// Tamaño máximo: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Tipos permitidos
const ALLOWED_TYPES = [
  'image/*', 'application/pdf', 
  'audio/*', 'video/*',
  'application/msword', 'text/plain'
];
```

### **Organización de Archivos**
- Separación por organización
- Carpetas temporales vs permanentes
- Limpieza automática de archivos huérfanos

### **Control de Acceso**
- Solo usuarios autenticados pueden subir
- Validación de pertenencia a organización
- URLs firmadas para descarga segura

## 🧪 Testing

### **Probar Subida en Formulario**
1. Ve a `/submit/[orgSlug]`
2. Completa el formulario hasta Step 4
3. Arrastra archivos o haz clic para seleccionar
4. Verifica vista previa y progreso
5. Envía formulario y verifica en detalle del reporte

### **Probar Procesamiento de Email**
1. Envía email con adjuntos a la dirección configurada
2. Ejecuta procesamiento de emails
3. Verifica que archivos aparezcan en el reporte
4. Confirma descarga y visualización

### **API de Test**
```bash
# Probar subida directa
curl -X POST http://localhost:3000/api/upload/attachments \
  -H "Authorization: Bearer your_token" \
  -F "file=@test.pdf" \
  -F "orgId=org123"
```

## 📊 Monitoreo y Métricas

### **Logs de Cloudinary**
```bash
✅ Processed attachment: evidence.pdf (2.4 MB)
📎 Processed 3/3 attachments for submission 123
❌ Error processing attachment: file too large
```

### **Métricas a Monitorear**
- Tasa de éxito de subidas
- Tamaño promedio de archivos
- Tipos de archivo más comunes
- Uso de almacenamiento Cloudinary

## ⚠️ Troubleshooting

### **Error: "File too large"**
```bash
# Verificar límites
CLOUDINARY_MAX_FILE_SIZE=50000000  # 50MB
```

### **Error: "Unsupported file type"**
```bash
# Verificar lista de tipos permitidos en:
# - AttachmentUploader.tsx
# - /api/upload/attachments/route.ts
# - submission-processor.service.ts
```

### **Error: "Cloudinary upload failed"**
```bash
# Verificar variables de entorno
# Verificar cuotas de Cloudinary
# Revisar logs de la consola
```

## 🚀 Próximas Mejoras

### **Funcionalidades Adicionales**
- [ ] Compresión automática de imágenes
- [ ] Generación de thumbnails
- [ ] Descarga masiva como ZIP
- [ ] Integración con otros proveedores (S3, etc.)
- [ ] Cifrado de archivos sensibles
- [ ] Watermarking para evidencias

### **Optimizaciones**
- [ ] Lazy loading de archivos grandes
- [ ] Cache de URLs de Cloudinary
- [ ] Limpieza automática de archivos temporales
- [ ] Análisis de contenido con IA

---

## 💰 Costos Estimados

### **Cloudinary (Plan Gratuito)**
- ✅ **Gratis hasta**: 25GB almacenamiento + 25GB bandwidth
- ✅ **Suficiente para**: ~5,000-10,000 archivos promedio
- ✅ **Escalabilidad**: Plans pagos desde $89/mes

### **Comparación con Alternativas**
- **AWS S3**: ~$0.023/GB + $0.09/GB transferencia
- **Google Cloud**: ~$0.020/GB + $0.12/GB transferencia  
- **Cloudinary**: Mejor para casos de uso con multimedia + CDN

---

¡El sistema de archivos multimedia está listo para usar! 🎉 