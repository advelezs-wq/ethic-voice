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
  sanitizeEmail,
  sanitizePhone,
  sanitizePlainLeadField,
  sanitizeSourcePath,
} from "@/lib/security/ebook-lead-sanitize";
import { parseLeadMagnetFormFields } from "@/lib/lead-magnets";

const MAX_BODY_BYTES = 65536;

/**
 * Captura de leads para recursos descargables dinámicos (lead magnets).
 * Registra un EbookLead con la campaña del recurso y devuelve la URL del
 * archivo + la thank-you page para medición.
 */
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
    const contentLength = parseInt(
      request.headers.get("content-length") || "0",
      10
    );
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Formato de datos no válido." }, { status: 400 });
    }

    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug) {
      return NextResponse.json({ error: "Recurso no especificado." }, { status: 400 });
    }

    const magnet = await prisma.leadMagnet.findUnique({ where: { slug } });
    if (!magnet || !magnet.isActive) {
      return NextResponse.json(
        { error: "Este recurso no está disponible." },
        { status: 404 }
      );
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

    const fields = parseLeadMagnetFormFields(magnet.formFields);

    const fullName =
      typeof body.fullName === "string"
        ? sanitizePlainLeadField(body.fullName, 200, 2)
        : null;
    const email = typeof body.email === "string" ? sanitizeEmail(body.email) : null;
    const phone = typeof body.phone === "string" ? sanitizePhone(body.phone) : null;
    const company =
      typeof body.company === "string"
        ? sanitizePlainLeadField(body.company, 200, 2)
        : null;
    const role =
      typeof body.role === "string"
        ? sanitizePlainLeadField(body.role, 200, 2)
        : null;

    // Nombre y correo siempre obligatorios; el resto según configuración
    if (
      !fullName ||
      !email ||
      (fields.phone && !phone) ||
      (fields.company && !company) ||
      (fields.role && !role)
    ) {
      return NextResponse.json(
        { error: "Completa todos los campos correctamente." },
        { status: 400 }
      );
    }

    const sourcePath = sanitizeSourcePath(body.sourcePath);

    await prisma.$transaction([
      prisma.ebookLead.create({
        data: {
          fullName,
          phone: phone || "",
          email,
          company: company || "",
          role: role || "",
          campaign: magnet.campaign,
          sourcePath: sourcePath ?? `/recursos/${magnet.slug}`,
          utmSource: parseOptionalUtm(body.utmSource, 120),
          utmMedium: parseOptionalUtm(body.utmMedium, 120),
          utmCampaign: parseOptionalUtm(body.utmCampaign, 120),
          utmContent: parseOptionalUtm(body.utmContent, 120),
          utmTerm: parseOptionalUtm(body.utmTerm, 120),
          userAgent: userAgent.slice(0, 2000) || undefined,
        },
      }),
      prisma.leadMagnet.update({
        where: { id: magnet.id },
        data: { downloads: { increment: 1 } },
      }),
    ]);

    securityManager.updateStats("form");
    securityManager.trackIPRequest(clientIP, "form");

    return NextResponse.json({
      success: true,
      fileUrl: magnet.fileUrl,
      thankYouUrl: `/recursos/${magnet.slug}/gracias`,
    });
  } catch (e) {
    console.error("[resource-lead]", e);
    return NextResponse.json(
      { error: "No pudimos registrar tu solicitud. Inténtalo más tarde." },
      { status: 500 }
    );
  }
}
