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

    // Get comprehensive debug information (all async now)
    const [
      blockedIPs,
      suspiciousIPs,
      whitelistedIPs,
      ipRequestStats,
      recentAttacks,
      rateLimitStats
    ] = await Promise.all([
      securityManager.getBlockedIPs(),
      securityManager.getSuspiciousIPs(),
      securityManager.getWhitelistedIPs(),
      securityManager.getIPRequestStats(),
      securityManager.getRecentAttacks(),
      securityManager.getRateLimitStats()
    ]);

    const debugInfo = {
      // Basic stats
      blockedIPs,
      suspiciousIPs,
      whitelistedIPs,
      
      // Request tracking
      ipRequestStats,
      
      // Recent activity
      recentAttacks,
      
      // Rate limit stats
      rateLimitStats,
      
      // System info
      systemInfo: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        totalTrackedIPs: ipRequestStats.length,
        totalBlockedIPs: blockedIPs.length,
        totalWhitelistedIPs: whitelistedIPs.length,
      },
      
      // Help for debugging
      debugging: {
        localhostInWhitelist: whitelistedIPs.includes('127.0.0.1'),
        message: "If localhost is in whitelist, it won't be tracked. Remove it to see local activity.",
        howToRemoveLocalhost: "Use DELETE /api/security/whitelist with { ip: '127.0.0.1' }",
        howToAddLocalhost: "Use POST /api/security/whitelist with { ip: '127.0.0.1' }"
      }
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('[SECURITY] Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 