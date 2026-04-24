import { NextRequest, NextResponse } from 'next/server';
import { securityManager, getClientIP } from '@/modules/app/lib/security/rate-limiter';
import { submitEthicLineReport } from '@/actions/submission.actions';
import { verifyHcaptchaToken } from '@/lib/security/verify-hcaptcha';

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const contentLength = parseInt(request.headers.get('content-length') || '0');

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

            // Verify required fields
        if (!organizationId) {
          return NextResponse.json(
            { error: 'Organization ID is required' },
            { status: 400 }
          );
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
      /script/i,
      /javascript/i,
      /onload/i,
      /onerror/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
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
    const result = await submitEthicLineReport({ 
      organizationId,
      formData 
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

  } catch (error) {
    const clientIP = getClientIP(request);
    console.error(`[SECURITY] Error processing submission from IP: ${clientIP}:`, error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 