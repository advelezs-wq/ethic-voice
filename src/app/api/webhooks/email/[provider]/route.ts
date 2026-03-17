import { EmailWebhookService } from "@/modules/app/services/email-account.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const provider = (await params).provider;

    // Verificar firma del webhook según el proveedor
    const isValid = await verifyWebhookSignature(req, provider);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = await req.json();

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
  provider: string
): Promise<boolean> {
  // Implementar verificación según el proveedor
  switch (provider) {
    case "sendgrid":
      // Verificar con SendGrid webhook signature
      return true;
    case "mailgun":
      // Verificar con Mailgun signature
      return true;
    case "improvmx":
      // ImprovMX no usa firma, verificar por IP
      return true;
    default:
      return false;
  }
}
