"use client";

import { useState } from 'react';
import { Button, Card, Image, Chip } from '@heroui/react';
import { addToast } from '@/modules/core/utils/safe-toast';
import { formatFileSize } from '../../utils/reports';
import { ReportAttachment } from '@/types/reports';

interface ReportAttachmentsProps {
  attachments: ReportAttachment[];
}

export function ReportAttachments({ attachments }: ReportAttachmentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('video/')) return '🎬';
    return '📎';
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Imagen';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word')) return 'Documento';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Hoja de cálculo';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.startsWith('video/')) return 'Video';
    return 'Archivo';
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');
  const isAudio = (mimeType: string) => mimeType.startsWith('audio/');

  const downloadFile = async (attachment: ReportAttachment) => {
    try {
      const response = await fetch(attachment.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab
      window.open(attachment.fileUrl, '_blank');
    }
  };

  const imageAttachments = attachments.filter(att => isImage(att.mimeType));
  const documentAttachments = attachments.filter(att => !isImage(att.mimeType) && !isVideo(att.mimeType) && !isAudio(att.mimeType));
  const mediaAttachments = attachments.filter(att => isVideo(att.mimeType) || isAudio(att.mimeType));

  return (
    <Card className="w-full">
      {/* Header - Always visible */}
      <div className="p-4 border-b border-gray-200">
        <Button
          variant="light"
          className="w-full justify-between p-0 h-auto"
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📎</span>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">
                Archivos Adjuntos ({attachments.length})
              </h3>
              <p className="text-sm text-gray-500">
                {imageAttachments.length > 0 && `${imageAttachments.length} imagen${imageAttachments.length > 1 ? 'es' : ''}`}
                {imageAttachments.length > 0 && (documentAttachments.length > 0 || mediaAttachments.length > 0) && ', '}
                {documentAttachments.length > 0 && `${documentAttachments.length} documento${documentAttachments.length > 1 ? 's' : ''}`}
                {documentAttachments.length > 0 && mediaAttachments.length > 0 && ', '}
                {mediaAttachments.length > 0 && `${mediaAttachments.length} multimedia`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" color="primary">
              {formatFileSize(attachments.reduce((sum, att) => sum + att.fileSize, 0))}
            </Chip>
            <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </Button>
      </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Images Section */}
          {imageAttachments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span>🖼️</span>
                Imágenes ({imageAttachments.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageAttachments.map((attachment) => (
                  <div key={attachment.id} className="space-y-2">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => window.open(attachment.fileUrl, '_blank')}
                    >
                      <Image
                        src={attachment.fileUrl}
                        alt={attachment.filename}
                        className="w-full h-32 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-2xl">🔍</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700 truncate" title={attachment.filename}>
                        {attachment.filename}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(attachment.fileSize)}
                        </span>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => downloadFile(attachment)}
                          className="text-xs h-6 px-2"
                        >
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Section (Audio/Video) */}
          {mediaAttachments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span>🎬</span>
                Multimedia ({mediaAttachments.length})
              </h4>
              <div className="space-y-3">
                {mediaAttachments.map((attachment) => (
                  <Card key={attachment.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-1">
                            {getFileIcon(attachment.mimeType)}
                          </span>
                          <div>
                            <h5 className="font-medium text-gray-900">{attachment.filename}</h5>
                            <p className="text-sm text-gray-500">
                              {getFileTypeLabel(attachment.mimeType)} • {formatFileSize(attachment.fileSize)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Subido por {attachment.uploadedByName} • {new Date(attachment.uploadedAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => window.open(attachment.fileUrl, '_blank')}
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => downloadFile(attachment)}
                          >
                            Descargar
                          </Button>
                        </div>
                      </div>
                      
                      {/* Media Preview */}
                      {isVideo(attachment.mimeType) && (
                        <video 
                          controls 
                          className="w-full max-h-64 rounded-lg"
                          preload="metadata"
                        >
                          <source src={attachment.fileUrl} type={attachment.mimeType} />
                          Tu navegador no soporta la reproducción de video.
                        </video>
                      )}
                      
                      {isAudio(attachment.mimeType) && (
                        <audio 
                          controls 
                          className="w-full"
                          preload="metadata"
                        >
                          <source src={attachment.fileUrl} type={attachment.mimeType} />
                          Tu navegador no soporta la reproducción de audio.
                        </audio>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {documentAttachments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span>📄</span>
                Documentos ({documentAttachments.length})
              </h4>
              <div className="space-y-2">
                {documentAttachments.map((attachment) => (
                  <Card key={attachment.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getFileIcon(attachment.mimeType)}
                        </span>
                        <div>
                          <h5 className="font-medium text-gray-900">{attachment.filename}</h5>
                          <p className="text-sm text-gray-500">
                            {getFileTypeLabel(attachment.mimeType)} • {formatFileSize(attachment.fileSize)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Subido por {attachment.uploadedByName} • {new Date(attachment.uploadedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => window.open(attachment.fileUrl, '_blank')}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => downloadFile(attachment)}
                        >
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                💡 Haz clic en los archivos para ver o descargar
              </p>
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  // Download all as ZIP would be nice, but for now just show info
                  addToast({
                    title: "Función en desarrollo",
                    description: "Para descargar múltiples archivos, descarga cada uno individualmente",
                    color: "primary"
                  });
                }}
              >
                Descargar todos
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 