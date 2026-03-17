import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { notificationsService } from '@/modules/app/services/notifications.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const notificationId = (await params).id;

    await notificationsService.markAsRead(notificationId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Error al marcar notificación como leída' },
      { status: 500 }
    );
  }
} 