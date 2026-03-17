import { NextRequest, NextResponse } from 'next/server';
import { securityManager, getClientIP } from '@/modules/app/lib/security/rate-limiter';

// Email rate limiting - more restrictive for emails
const emailRateLimits = {
  perIP: 20, // Max 20 emails per hour per IP
  perEmail: 10, // Max 10 emails per hour per sender email
  perSubject: 5, // Max 5 emails with similar subject per hour
};

// Spam detection patterns
const spamPatterns = {
  subjects: [
    /test/i,
    /spam/i,
    /free/i,
    /urgent/i,
    /click here/i,
    /limited time/i,
    /act now/i,
    /congratulations/i,
    /winner/i,
    /prize/i,
  ],
  senders: [
    /noreply/i,
    /no-reply/i,
    /donotreply/i,
    /automated/i,
    /newsletter/i,
    /marketing/i,
  ],
  content: [
    /http:\/\//gi, // Excessive HTTP links
    /https:\/\//gi, // Excessive HTTPS links
    /buy now/i,
    /discount/i,
    /offer/i,
    /sale/i,
  ],
};

// Email tracking for rate limiting
const emailCounts = new Map<string, { count: number; lastReset: number; subjects: string[] }>();

interface EmailData {
  from: { email: string; name: string };
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; size: number }>;
}

function calculateSpamScore(emailData: EmailData): number {
  let score = 0;
  const { from, subject, text = '', html = '', attachments = [] } = emailData;

  // Check sender patterns
  if (spamPatterns.senders.some(pattern => pattern.test(from.email))) {
    score += 30;
  }

  // Check subject patterns
  const subjectScore = spamPatterns.subjects.filter(pattern => pattern.test(subject)).length * 10;
  score += Math.min(subjectScore, 40);

  // Check content patterns
  const content = `${text} ${html}`.toLowerCase();
  const contentScore = spamPatterns.content.filter(pattern => pattern.test(content)).length * 5;
  score += Math.min(contentScore, 30);

  // Check for excessive links
  const linkCount = (content.match(/http/gi) || []).length;
  if (linkCount > 5) {
    score += 20;
  }

  // Check for suspicious attachments
  if (attachments.length > 10) {
    score += 15;
  }

  // Check for empty or very short content
  if (content.trim().length < 20) {
    score += 25;
  }

  // Check for suspicious sender name patterns
  if (from.name.length < 2 || /[0-9]{5,}/.test(from.name)) {
    score += 15;
  }

  return Math.min(score, 100);
}

function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function trackEmailSubmission(senderEmail: string, subject: string): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  
  // Clean old entries
  for (const [email, data] of emailCounts.entries()) {
    if (now - data.lastReset > hourInMs) {
      emailCounts.delete(email);
    }
  }

  const existing = emailCounts.get(senderEmail);
  
  if (!existing) {
    emailCounts.set(senderEmail, {
      count: 1,
      lastReset: now,
      subjects: [subject],
    });
    return true;
  }

  // Check if within rate limits
  if (existing.count >= emailRateLimits.perEmail) {
    return false;
  }

  // Check for similar subjects (possible spam)
  const similarSubjects = existing.subjects.filter(s => 
    s.toLowerCase().includes(subject.toLowerCase()) || 
    subject.toLowerCase().includes(s.toLowerCase())
  ).length;

      if (similarSubjects >= emailRateLimits.perSubject) {
      return false;
    }

  existing.count++;
  existing.subjects.push(subject);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Rate limiting for webhook endpoint
    const rateLimitResult = await securityManager.checkRateLimit({
      type: 'email',
      identifier: clientIP,
      additionalChecks: {
        userAgent,
      },
    });

    if (!rateLimitResult.allowed) {
      securityManager.logAttack(clientIP, 'Rate Limit', 'Email webhook rate limit exceeded');
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Update email attempt stats
    securityManager.updateStats('email');
    securityManager.trackIPRequest(clientIP, 'email');

    // Parse email data
    const emailData: EmailData = await request.json();
    
    // Validate required fields
    if (!emailData.from?.email || !emailData.subject || !emailData.to) {
      return NextResponse.json(
        { error: 'Invalid email data' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmailFormat(emailData.from.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Calculate spam score
    const spamScore = calculateSpamScore(emailData);
    
    if (spamScore >= 70) {
      securityManager.logAttack(clientIP, 'Spam Detection', `High spam score (${spamScore}) from ${emailData.from.email}`);
      
      // Block the IP for repeated spam attempts
      securityManager.blockIP(clientIP, 3600000); // 1 hour
      
      return NextResponse.json(
        { error: 'Email rejected due to spam indicators' },
        { status: 400 }
      );
    }

    // Track email submissions for rate limiting
    const withinLimits = trackEmailSubmission(emailData.from.email, emailData.subject);
    
    if (!withinLimits) {
      return NextResponse.json(
        { error: 'Too many emails from this sender' },
        { status: 429 }
      );
    }

    // Log successful email processing activity
    securityManager.logActivity(
      clientIP, 
      'Email Received', 
      `Email from ${emailData.from.email}: "${emailData.subject}"`
    );

    // Here you would process the email using your existing email processing logic
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      processed: true,
      spamScore,
      message: 'Email processed successfully',
    });

  } catch (error) {
    const clientIP = getClientIP(request);
    console.error(`[SECURITY] Error processing email webhook from IP: ${clientIP}:`, error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint for health checks
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
} 