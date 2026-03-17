import { NextResponse } from 'next/server';
import prisma from '@/modules/prisma/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    console.log('🔍 Starting digest debug analysis...');

    // 1. Check users with daily digest enabled
    const dailyUsers = await prisma.notificationSettings.findMany({
      where: { enableDailyDigest: true },
      include: {
        organization: {
          select: { name: true, id: true }
        }
      }
    });

    // 2. Check users with weekly digest enabled
    const weeklyUsers = await prisma.notificationSettings.findMany({
      where: { enableWeeklyDigest: true },
      include: {
        organization: {
          select: { name: true, id: true }
        }
      }
    });

    // 3. Get sample user emails from Clerk
    const sampleUserEmails = [];
    for (const userSetting of dailyUsers.slice(0, 3)) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userSetting.userId);
        sampleUserEmails.push({
          userId: userSetting.userId,
          email: user.emailAddresses[0]?.emailAddress || 'No email',
          firstName: user.firstName,
          lastName: user.lastName
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sampleUserEmails.push({
          userId: userSetting.userId,
          email: `Error: ${errorMessage}`,
          firstName: 'Unknown',
          lastName: 'Unknown'
        });
      }
    }

    // 4. Check recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReports = await prisma.formSubmission.count({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    });

    const recentNotifications = await prisma.notification.count({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    });

    // 5. Environment check
    const envCheck = {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
      hasCronToken: !!process.env.DIGEST_CRON_TOKEN,
      clerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
    };

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      digestUsers: {
        dailyEnabled: dailyUsers.length,
        weeklyEnabled: weeklyUsers.length,
        dailyUserIds: dailyUsers.map(u => u.userId),
        weeklyUserIds: weeklyUsers.map(u => u.userId),
      },
      sampleUserEmails,
      recentActivity: {
        reportsLast24h: recentReports,
        notificationsLast24h: recentNotifications
      },
      dailyUsersDetail: dailyUsers.map(u => ({
        userId: u.userId,
        orgId: u.orgId,
        orgName: u.organization?.name || 'No org',
        digestTime: u.digestTime
      })),
      weeklyUsersDetail: weeklyUsers.map(u => ({
        userId: u.userId,
        orgId: u.orgId,
        orgName: u.organization?.name || 'No org',
        digestTime: u.digestTime
      }))
    };

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    console.error('❌ Error in digest debug:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Debug failed',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Simple auth test endpoint
export async function POST() {
  try {
    const expectedToken = process.env.DIGEST_CRON_TOKEN;
    
    if (!expectedToken) {
      return NextResponse.json({ 
        error: 'DIGEST_CRON_TOKEN not configured',
        suggestion: 'Add DIGEST_CRON_TOKEN to your environment variables'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Auth test endpoint ready',
      instructions: 'Send POST request with Authorization: Bearer YOUR_TOKEN'
    });
  } catch (err) {
    console.error('Auth test error:', err);
    return NextResponse.json(
      { error: 'Auth test failed' },
      { status: 500 }
    );
  }
} 