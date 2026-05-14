import { NextRequest, NextResponse } from 'next/server';
import { securityManager, getClientIP } from '@/modules/app/lib/security/rate-limiter';
import { submitEthicLineReport } from '@/actions/submission.actions';
import { verifyHcaptchaToken } from '@/lib/security/verify-hcaptcha';
import { normalizeIdempotencyKey } from '@/lib/security/submission-security';
import { upstashRedis } from '@/modules/app/lib/queue/redis-config';

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';

    // Basic request-size hard limit (JSON)
    if (contentLength > 1_500_000) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      );
    }

    // Origin/Host consistency check (defense in depth against cross-site abuse)
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          securityManager.logAttack(clientIP, 'Origin Mismatch', `origin=${originHost}, host=${host}`);
          return NextResponse.json(
            { error: 'Invalid request origin' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid origin header' },
          { status: 400 }
        );
      }
    }

    // Check rate limiting and security
    const rateLimitResult = await securityManager.checkRateLimit({
      type: 'form',
      identifier: clientIP,
      additionalChecks: {
        userAgent,
        referrer,
        contentLength,
      },
    });

            if (!rateLimitResult.allowed) {
          securityManager.logAttack(clientIP, 'Rate Limit', rateLimitResult.reason || 'Form submission rate limit exceeded');
          return NextResponse.json(
            { 
              error: 'Too many requests. Please wait before trying again.',
              details: rateLimitResult.reason,
              resetTime: rateLimitResult.resetTime,
            },
            { status: 429 }
          );
        }

        // Update form submission stats
        securityManager.updateStats('form');
        securityManager.trackIPRequest(clientIP, 'form');

    // Parse request body
    const body = await request.json();
    const { formData, captchaToken, organizationId } = body;
    const idempotencyKey =
      normalizeIdempotencyKey(body?.idempotencyKey) ||
      normalizeIdempotencyKey(request.headers.get('x-idempotency-key'));

    if ((body?.idempotencyKey || request.headers.get('x-idempotency-key')) && !idempotencyKey) {
      await securityManager.updateIdempotencyStats('invalid');
      return NextResponse.json(
        { error: 'Invalid idempotency key format' },
        { status: 400 }
      );
    }

    // Verify required fields
    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let lockKey: string | null = null;
    let lockAcquired = false;
    if (idempotencyKey) {
      await securityManager.updateIdempotencyStats('attempts');
      lockKey = `submit:idempotency:lock:${organizationId}:${idempotencyKey}`;
      const lockResult = await upstashRedis.set(lockKey, "1", {
        nx: true,
        ex: 60,
      });
      lockAcquired = lockResult === "OK";

      if (!lockAcquired) {
        await securityManager.updateIdempotencyStats('collisions');
        return NextResponse.json(
          { error: 'Duplicate submission in progress. Please wait a moment.' },
          { status: 409 }
        );
      }
      await securityManager.updateIdempotencyStats('acquired');
    }

            // Verify captcha if required or if suspicious behavior detected
        if (rateLimitResult.requiresCaptcha) {
          securityManager.updateStats('captcha_required');
          
          if (!captchaToken) {
            securityManager.logAttack(clientIP, 'Captcha Required', 'Security verification required but not provided');
            return NextResponse.json(
              { 
                error: 'Security verification required. Please complete the captcha.',
                requiresCaptcha: true,
              },
              { status: 400 }
            );
          }

          const captchaValid = await verifyHcaptchaToken(captchaToken, clientIP);
          if (!captchaValid) {
            securityManager.logAttack(clientIP, 'Captcha Failed', 'Invalid captcha verification');
            
            // Increase suspicion for failed captcha
            securityManager.blockIP(clientIP, 300000); // 5 minutes
            
            return NextResponse.json(
              { 
                error: 'Captcha verification failed. Please try again.',
                requiresCaptcha: true,
              },
              { status: 400 }
            );
          }
          
          // Update successful captcha stats
          securityManager.updateStats('captcha_passed');
        }

            // Additional security checks
        if (!formData || typeof formData !== 'object') {
          return NextResponse.json(
            { error: 'Invalid form data' },
            { status: 400 }
          );
        }

    // Check for suspicious patterns in form data
    const suspiciousPatterns = [
      /<script\b/i,
      /\bon\w+\s*=/i,
      /<iframe\b/i,
      /<object\b/i,
      /<embed\b/i,
      /javascript:\s*/i,
    ];

    const formDataString = JSON.stringify(formData).toLowerCase();
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(formDataString));

            if (hasSuspiciousContent) {
          securityManager.blockIP(clientIP, 1800000); // 30 minutes
          
          return NextResponse.json(
            { error: 'Submission contains invalid content' },
            { status: 400 }
          );
        }

        // Process the submission using the existing action
    try {
      const result = await submitEthicLineReport({ 
        organizationId,
        formData,
        idempotencyKey: idempotencyKey || undefined,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Submission failed' },
          { status: 400 }
        );
      }

      // Log successful submission activity
      securityManager.logActivity(
        clientIP, 
        'Form Submission', 
        `Report submitted successfully: ${result.trackingCode}`
      );

      return NextResponse.json({
        success: true,
        trackingCode: result.trackingCode,
        message: 'Report submitted successfully',
      });
    } finally {
      if (lockAcquired && lockKey) {
        await upstashRedis.del(lockKey);
      }
    }

  } catch (error) {
    const clientIP = getClientIP(request);
    console.error(`[SECURITY] Error processing submission from IP: ${clientIP}:`, error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 