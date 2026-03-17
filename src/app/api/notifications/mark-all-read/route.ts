import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { notificationsService } from '@/modules/app/services/notifications.service';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await notificationsService.markAllAsRead(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Error al marcar todas las notificaciones como leídas' },
      { status: 500 }
    );
  }
} 