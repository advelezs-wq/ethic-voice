import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { notificationsService } from '@/modules/app/services/notifications.service';

export async function POST() {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Create some test notifications
    const testNotifications = [
      {
        type: 'REPORT_CREATED' as const,
        title: '📝 Nuevo Reporte Creado',
        message: 'Se ha creado un nuevo reporte que requiere revisión',
        actionUrl: '/app/reports',
      },
      {
        type: 'REPORT_ASSIGNED' as const,
        title: '🎯 Reporte Asignado',
        message: 'Se te ha asignado un nuevo reporte para investigación',
        actionUrl: '/app/reports',
      },
      {
        type: 'REPORT_URGENT' as const,
        title: '🚨 Reporte Crítico',
        message: 'Se ha detectado un reporte de alta prioridad que requiere atención inmediata',
        actionUrl: '/app/reports',
      },
      {
        type: 'SYSTEM_ALERT' as const,
        title: '⚠️ Alerta del Sistema',
        message: 'Mantenimiento programado para el domingo a las 2:00 AM',
        actionUrl: '/app',
      },
    ];

    for (const notification of testNotifications) {
      await notificationsService.createNotification({
        userId,
        orgId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        channel: 'IN_APP',
        metadata: {
          isTest: true,
          createdBy: 'test-api',
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notificaciones de prueba creadas exitosamente',
      count: testNotifications.length,
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      { error: 'Error al crear notificaciones de prueba' },
      { status: 500 }
    );
  }
} 