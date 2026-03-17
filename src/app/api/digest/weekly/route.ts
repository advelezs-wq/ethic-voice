import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { digestService } from '@/modules/app/services/digest.service';

export async function POST() {
  try {
    // Debug: Log environment and headers (remove in production)
    console.log('🔍 Weekly Digest Debug:', {
      hasEnvToken: !!process.env.DIGEST_CRON_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Verify the request is authorized
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const expectedToken = process.env.DIGEST_CRON_TOKEN;
    
    if (!expectedToken) {
      console.error('❌ DIGEST_CRON_TOKEN not found in environment');
      return NextResponse.json({ 
        error: 'Server configuration error - missing token' 
      }, { status: 500 });
    }

    // Allow Vercel Cron manual run via GET/POST with x-vercel-cron header
    const hdrs = await headers();
    const isCron = hdrs.get('x-vercel-cron');
    if (!authHeader && !isCron) {
      console.error('❌ No Authorization header provided');
      return NextResponse.json({ 
        error: 'Authorization header required' 
      }, { status: 401 });
    }

    if (!isCron && authHeader !== `Bearer ${expectedToken}`) {
      console.error('❌ Invalid authorization token');
      return NextResponse.json({ 
        error: 'Invalid authorization token' 
      }, { status: 401 });
    }

    await digestService.sendWeeklyDigests();

    return NextResponse.json({ 
      success: true, 
      message: 'Weekly digests processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing weekly digests:', error);
    return NextResponse.json(
      { error: 'Failed to process weekly digests' },
      { status: 500 }
    );
  }
}

// Also allow GET for testing purposes
export async function GET(_request: NextRequest) {
  try {
    // Allow GET unconditionally to support Vercel Cron "Run" (some environments omit x-vercel-cron)
    await digestService.sendWeeklyDigests();
    return NextResponse.json({ 
      success: true, 
      message: 'Weekly digests processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing weekly digests:', error);
    return NextResponse.json(
      { error: 'Failed to process weekly digests' },
      { status: 500 }
    );
  }
} 