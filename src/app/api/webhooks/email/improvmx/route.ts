import { NextRequest, NextResponse } from "next/server";
import {
  securityManager,
  getClientIP,
} from "@/modules/app/lib/security/rate-limiter";
import { EmailWebhookService } from "@/modules/app/services/email-account.service";
import { normalizeImprovMxPayload } from "@/lib/security/email-webhook-normalize";
import { timingSafeEqual } from "crypto";

// Prefer /api/webhooks/email/secure as the ImprovMX forwarding target — it
// does everything this route does plus spam scoring and per-sender rate
// limiting. This route is kept for direct/manual testing.
export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get("user-agent") || "";
    const expectedWebhookSecret =
      process.env.IMPROVMX_WEBHOOK_SECRET ||
      process.env.EMAIL_WEBHOOK_SHARED_SECRET;
    const providedWebhookSecret =
      req.headers.get("x-improvmx-webhook-secret") ||
      req.headers.get("x-webhook-secret") ||
      req.nextUrl.searchParams.get("secret");

    if (expectedWebhookSecret) {
      const expected = Buffer.from(expectedWebhookSecret);
      const provided = Buffer.from(providedWebhookSecret || "");
      const valid =
        expected.length === provided.length &&
        timingSafeEqual(expected, provided);
      if (!valid) {
        securityManager.logAttack(
          clientIP,
          "Invalid Signature",
          "Invalid ImprovMX webhook secret"
        );
        return NextResponse.json(
          { error: "Unauthorized webhook" },
          { status: 401 }
        );
      }
    } else {
      securityManager.logAttack(
        clientIP,
        "Misconfigured Secret",
        "Missing ImprovMX webhook secret"
      );
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Apply security checks
    const rateLimitResult = await securityManager.checkRateLimit({
      type: "email",
      identifier: clientIP,
      additionalChecks: {
        userAgent,
      },
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const payload = await req.json();
    const normalizedPayload = normalizeImprovMxPayload(payload);

    const webhookService = new EmailWebhookService();
    const result = await webhookService.processInboundEmail(
      normalizedPayload,
      "improvmx"
    );

    return NextResponse.json({
      success: Boolean(result?.success),
      submissionId: result?.submissionId,
      queued: result?.queued,
      skipped: result?.skipped,
      duplicate: result?.duplicate,
      reason: result?.reason,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      service: "ImprovMX Email Webhook",
      status: "active",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

