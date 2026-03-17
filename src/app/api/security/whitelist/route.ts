import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isSuperAdmin } from '@/modules/core/utils/permissions';
import { securityManager } from '@/modules/app/lib/security/rate-limiter';

// GET - Get whitelisted IPs
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

    const whitelistedIPs = securityManager.getWhitelistedIPs();

    return NextResponse.json({
      whitelistedIPs,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SECURITY] Error fetching whitelisted IPs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add IP to whitelist
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

    // Get IP from request body
    const { ip } = await request.json();
    
    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
    }

    // Add to whitelist
    securityManager.addToWhitelist(ip);
    
    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been added to whitelist successfully`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SECURITY] Error adding IP to whitelist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove IP from whitelist
export async function DELETE(request: NextRequest) {
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

    // Get IP from request body
    const { ip } = await request.json();
    
    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Remove from whitelist
    securityManager.removeFromWhitelist(ip);
    
    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been removed from whitelist successfully`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SECURITY] Error removing IP from whitelist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 