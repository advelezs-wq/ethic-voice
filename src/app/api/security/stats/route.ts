import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isSuperAdmin } from '@/modules/core/utils/permissions';
import { securityManager } from '@/modules/app/lib/security/rate-limiter';

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check if super admin
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;
    
    if (!userEmail || !isSuperAdmin(userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get security statistics from SecurityManager (all async now)
    const [
      blockedIPs,
      suspiciousIPs,
      recentAttacks,
      recentActivities,
      rateLimitStats,
      ipRequestStats,
      quarantineFiles,
      idempotencyStats,
    ] = await Promise.all([
      securityManager.getBlockedIPs(),
      securityManager.getSuspiciousIPs(),
      securityManager.getRecentAttacks(),
      securityManager.getRecentActivities(),
      securityManager.getRateLimitStats(),
      securityManager.getIPRequestStats(),
      securityManager.getQuarantineFiles(100),
      securityManager.getIdempotencyStats(),
    ]);

    const stats = {
      blockedIPs,
      suspiciousIPs,
      recentAttacks,
      recentActivities,
      rateLimitStats,
      ipRequestStats,
      quarantineFiles,
      idempotencyStats,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('[SECURITY] Error fetching security stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 