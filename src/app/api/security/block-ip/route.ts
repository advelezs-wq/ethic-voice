import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isSuperAdmin } from '@/modules/core/utils/permissions';
import { securityManager } from '@/modules/app/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
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

    // Get IP and reason from request body
    const { ip, reason } = await request.json();
    
    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
    }

    // Block the IP manually
    const success = securityManager.manualBlockIP(ip, reason || `Manually blocked by ${userEmail}`);
    
    if (!success) {
      return NextResponse.json({ error: 'IP is already blocked' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been blocked successfully`,
      reason: reason || `Manually blocked by ${userEmail}`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SECURITY] Error blocking IP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 