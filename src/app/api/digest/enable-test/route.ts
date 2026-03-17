import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/modules/prisma/lib/prisma';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - no user found' },
        { status: 401 }
      );
    }

    // Get user's organization
    const membership = await prisma.organizationMembership.findFirst({
      where: { userId },
      include: { organization: true }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization membership found' },
        { status: 400 }
      );
    }

    // Enable both daily and weekly digest for testing
    const settings = await prisma.notificationSettings.upsert({
      where: {
        userId: userId
      },
      update: {
        enableDailyDigest: true,
        enableWeeklyDigest: true,
        digestTime: '09:00'
      },
      create: {
        userId,
        orgId: membership.orgId,
        enableDailyDigest: true,
        enableWeeklyDigest: true,
        digestTime: '09:00',
        // Default in-app settings
        inAppReportCreated: true,
        inAppReportAssigned: true,
        inAppReportStatusChanged: true,
        inAppReportComment: true,
        inAppSystemAlerts: true,
        // Default email settings
        emailReportCreated: false,
        emailReportAssigned: true,
        emailReportStatusChanged: false,
        emailReportComment: false,
        emailSystemAlerts: false,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Digest enabled for testing',
      userId,
      orgId: membership.orgId,
      settings: {
        enableDailyDigest: settings.enableDailyDigest,
        enableWeeklyDigest: settings.enableWeeklyDigest,
        digestTime: settings.digestTime
      }
    });

  } catch (error) {
    console.error('Error enabling digest:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to enable digest', message: errorMessage },
      { status: 500 }
    );
  }
} 