import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import {
  getClientIP,
  securityManager,
} from "@/modules/app/lib/security/rate-limiter";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}

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

    const body = (await request.json()) as Record<string, unknown>;

    const fullName = str(body.fullName, 200);
    const phone = str(body.phone, 40);
    const emailRaw = str(body.email, 320);
    const company = str(body.company, 200);
    const role = str(body.role, 200);

    if (!fullName || !phone || !emailRaw || !company || !role) {
      return NextResponse.json(
        { error: "Completa todos los campos correctamente." },
        { status: 400 }
      );
    }

    const email = emailRaw.toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Introduce un correo corporativo válido." },
        { status: 400 }
      );
    }

    const campaign = str(body.campaign, 80) ?? "guia_canal_denuncias";
    const sourcePath = str(body.sourcePath, 500);
    const utmSource = str(body.utmSource, 120);
    const utmMedium = str(body.utmMedium, 120);
    const utmCampaign = str(body.utmCampaign, 120);
    const utmContent = str(body.utmContent, 120);
    const utmTerm = str(body.utmTerm, 120);

    await prisma.ebookLead.create({
      data: {
        fullName,
        phone,
        email,
        company,
        role,
        campaign,
        sourcePath: sourcePath ?? undefined,
        utmSource: utmSource ?? undefined,
        utmMedium: utmMedium ?? undefined,
        utmCampaign: utmCampaign ?? undefined,
        utmContent: utmContent ?? undefined,
        utmTerm: utmTerm ?? undefined,
        userAgent: userAgent.slice(0, 2000) || undefined,
      },
    });

    securityManager.updateStats("form");
    securityManager.trackIPRequest(clientIP, "form");

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[ebook-lead]", e);
    return NextResponse.json(
      { error: "No pudimos registrar tu solicitud. Inténtalo más tarde." },
      { status: 500 }
    );
  }
}
