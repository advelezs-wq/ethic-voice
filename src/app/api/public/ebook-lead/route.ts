import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import {
  getClientIP,
  securityManager,
} from "@/modules/app/lib/security/rate-limiter";
import { verifyHcaptchaToken } from "@/lib/security/verify-hcaptcha";
import {
  parseHcaptchaToken,
  parseOptionalUtm,
  sanitizeCampaignSlug,
  sanitizeEmail,
  sanitizePhone,
  sanitizePlainLeadField,
  sanitizeSourcePath,
} from "@/lib/security/ebook-lead-sanitize";
import { resolvePublicEbookPdfUrl } from "@/lib/ebook-public-pdf";

const MAX_BODY_BYTES = 65536;

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";

    const rate = await securityManager.checkRateLimit({
      type: "form",
      identifier: clientIP,
      additionalChecks: { userAgent },
    });

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un momento e inténtalo de nuevo." },
        { status: 429 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Solicitud no válida." }, { status: 415 });
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Formato de datos no válido." }, { status: 400 });
    }

    if (process.env.HCAPTCHA_SECRET_KEY) {
      const token = parseHcaptchaToken(body.hcaptchaToken);
      if (!token) {
        return NextResponse.json(
          { error: "Completa la verificación de seguridad." },
          { status: 400 }
        );
      }
      const captchaOk = await verifyHcaptchaToken(token, clientIP);
      if (!captchaOk) {
        return NextResponse.json(
          { error: "Verificación de seguridad no válida. Inténtalo de nuevo." },
          { status: 400 }
        );
      }
    }

    const fullName =
      typeof body.fullName === "string"
        ? sanitizePlainLeadField(body.fullName, 200, 2)
        : null;
    const phone = typeof body.phone === "string" ? sanitizePhone(body.phone) : null;
    const email = typeof body.email === "string" ? sanitizeEmail(body.email) : null;
    const company =
      typeof body.company === "string"
        ? sanitizePlainLeadField(body.company, 200, 2)
        : null;
    const role =
      typeof body.role === "string" ? sanitizePlainLeadField(body.role, 200, 2) : null;

    if (!fullName || !phone || !email || !company || !role) {
      return NextResponse.json(
        { error: "Completa todos los campos correctamente." },
        { status: 400 }
      );
    }

    const campaign = sanitizeCampaignSlug(body.campaign);
    const sourcePath = sanitizeSourcePath(body.sourcePath);
    const utmSource = parseOptionalUtm(body.utmSource, 120);
    const utmMedium = parseOptionalUtm(body.utmMedium, 120);
    const utmCampaign = parseOptionalUtm(body.utmCampaign, 120);
    const utmContent = parseOptionalUtm(body.utmContent, 120);
    const utmTerm = parseOptionalUtm(body.utmTerm, 120);

    await prisma.ebookLead.create({
      data: {
        fullName,
        phone,
        email,
        company,
        role,
        campaign,
        sourcePath: sourcePath ?? undefined,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        userAgent: userAgent.slice(0, 2000) || undefined,
      },
    });

    securityManager.updateStats("form");
    securityManager.trackIPRequest(clientIP, "form");

    const pdfUrl = resolvePublicEbookPdfUrl();
    return NextResponse.json({ success: true, pdfUrl });
  } catch (e) {
    console.error("[ebook-lead]", e);
    return NextResponse.json(
      { error: "No pudimos registrar tu solicitud. Inténtalo más tarde." },
      { status: 500 }
    );
  }
}
