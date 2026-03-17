import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { digestService } from '@/modules/app/services/digest.service';

export async function POST() {
  try {
    // Debug: Log environment and headers (remove in production)
    console.log('🔍 Daily Digest Debug:', {
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

    await digestService.sendDailyDigests();

    return NextResponse.json({ 
      success: true, 
      message: 'Daily digests processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing daily digests:', error);
    return NextResponse.json(
      { error: 'Failed to process daily digests' },
      { status: 500 }
    );
  }
}

// Also allow GET for testing purposes
export async function GET() {
  try {
    // Allow GET from Vercel Cron (no auth header) and internal daily-runner
    const headersList = await headers();
    const isCron = headersList.get('x-vercel-cron');
    if (isCron) {
      await digestService.sendDailyDigests();
      return NextResponse.json({ 
        success: true, 
        message: 'Daily digests processed successfully (cron)',
        timestamp: new Date().toISOString()
      });
    }
    return NextResponse.json({ error: 'GET not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Error processing daily digests:', error);
    return NextResponse.json(
      { error: 'Failed to process daily digests' },
      { status: 500 }
    );
  }
} 