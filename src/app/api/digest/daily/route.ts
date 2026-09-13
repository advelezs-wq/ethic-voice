import { NextRequest, NextResponse } from 'next/server';
import { digestService } from '@/modules/app/services/digest.service';
import { verifyCronOrAdminRequest } from '@/lib/security/cron-auth';

export async function POST(request: NextRequest) {
  try {
    // Debug: Log environment and headers (remove in production)
    console.log('🔍 Daily Digest Debug:', {
      hasEnvToken: !!process.env.DIGEST_CRON_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // CRITICAL: this used to let the x-vercel-cron header alone bypass the
    // DIGEST_CRON_TOKEN check entirely — that header isn't verified/stripped
    // by Vercel's edge on inbound requests, so anyone could set it and skip
    // the real token check. Accept either a genuine cron/admin secret
    // (verifyCronOrAdminRequest) or the DIGEST_CRON_TOKEN bearer token.
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.DIGEST_CRON_TOKEN;

    const hasCronOrAdminAuth = verifyCronOrAdminRequest(request);
    const hasDigestToken =
      !!expectedToken && authHeader === `Bearer ${expectedToken}`;

    if (!hasCronOrAdminAuth && !hasDigestToken) {
      console.error('❌ No valid authorization provided');
      return NextResponse.json({
        error: 'Authorization required'
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
export async function GET(request: NextRequest) {
  try {
    if (verifyCronOrAdminRequest(request)) {
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