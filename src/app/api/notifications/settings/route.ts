import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import prisma from '@/modules/prisma/lib/prisma';

const NotificationSettingsSchema = z.object({
  emailReportCreated: z.boolean().optional(),
  emailReportAssigned: z.boolean().optional(),
  emailReportStatusChanged: z.boolean().optional(),
  emailReportComment: z.boolean().optional(),
  emailSystemAlerts: z.boolean().optional(),
  inAppReportCreated: z.boolean().optional(),
  inAppReportAssigned: z.boolean().optional(),
  inAppReportStatusChanged: z.boolean().optional(),
  inAppReportComment: z.boolean().optional(),
  inAppSystemAlerts: z.boolean().optional(),
  enableDailyDigest: z.boolean().optional(),
  enableWeeklyDigest: z.boolean().optional(),
  digestTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get or create notification settings
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          orgId: orgId || undefined,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración de notificaciones' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = NotificationSettingsSchema.parse(body);

    // Update or create notification settings
    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        orgId: orgId || undefined,
        ...validatedData,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración de notificaciones' },
      { status: 500 }
    );
  }
} 