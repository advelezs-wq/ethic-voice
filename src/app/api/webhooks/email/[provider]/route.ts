import { EmailWebhookService } from "@/modules/app/services/email-account.service";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const provider = (await params).provider;
    const rawBody = await req.text();
    const data = rawBody ? JSON.parse(rawBody) : {};

    // Verificar firma del webhook según el proveedor
    const isValid = await verifyWebhookSignature(req, provider, data);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const webhookService = new EmailWebhookService();
    const result = await webhookService.processInboundEmail(data, provider);

    return NextResponse.json({
      success: true,
      submissionId: result?.submissionId,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }
}

async function verifyWebhookSignature(
  req: NextRequest,
  provider: string,
  parsedBody: Record<string, unknown>
): Promise<boolean> {
  const sharedSecret = process.env.EMAIL_WEBHOOK_SHARED_SECRET;
  const receivedSharedSecret =
    req.headers.get("x-webhook-secret") ||
    req.headers.get("x-email-webhook-secret");

  const equals = (a: string, b: string) => {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  };

  const verifySharedSecret = (secret?: string | null) =>
    Boolean(
      secret &&
        receivedSharedSecret &&
        equals(secret, receivedSharedSecret)
    );

  switch (provider) {
    case "sendgrid":
      return verifySharedSecret(
        process.env.SENDGRID_WEBHOOK_SECRET || sharedSecret
      );
    case "mailgun":
      {
        const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
        const timestamp = String(parsedBody.timestamp || "");
        const token = String(parsedBody.token || "");
        const signature = String(parsedBody.signature || "");

        if (signingKey && timestamp && token && signature) {
          const expected = createHmac("sha256", signingKey)
            .update(`${timestamp}${token}`)
            .digest("hex");
          return equals(expected, signature);
        }

        // Fallback seguro: secreto compartido obligatorio
        return verifySharedSecret(sharedSecret);
      }
    case "improvmx":
      return verifySharedSecret(
        process.env.IMPROVMX_WEBHOOK_SECRET || sharedSecret
      );
    default:
      return false;
  }
}
