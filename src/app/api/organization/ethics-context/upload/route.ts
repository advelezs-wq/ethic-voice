import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { scanUploadedFile } from "@/lib/security/submission-security";
import { ethicalDocumentUploadSchema } from "@/modules/app/lib/schemas/ethics-context";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Documents inserted directly into the AI prompt are truncated to this many
// characters to keep the per-case token cost bounded (see proposal: "short
// documents inserted directly into the prompt", no vector search yet).
const MAX_EXTRACTED_TEXT_CHARS = 8000;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result.text || "";
    }
    if (
      mimeType === "application/msword" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    }
    if (mimeType === "text/plain") {
      return buffer.toString("utf-8");
    }
    return "";
  } catch (error) {
    console.error("[ethics-context/upload] Text extraction failed:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orgId = formData.get("orgId") as string | null;
    const documentTypeRaw = formData.get("documentType") as string | null;
    const versionRaw = formData.get("version") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!orgId || orgId.length < 2 || orgId.length > 100) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }

    // Defense in depth: this route is also gated by plan-restrictions
    // middleware, but Server Actions/route handlers should never trust the
    // middleware alone (same discipline as ethics-context.actions.ts).
    const [membership, user, planInfo] = await Promise.all([
      prisma.organizationMembership.findUnique({
        where: { userId_orgId: { userId, orgId } },
      }),
      currentUser(),
      getOrganizationPlanInfo(orgId),
    ]);
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const isSuper = Boolean(userEmail && isSuperAdmin(userEmail));

    if (!isSuper) {
      if (!membership || membership.role !== "ADMIN") {
        return NextResponse.json(
          { error: "No tienes permisos para esta acción" },
          { status: 403 }
        );
      }
      if (!planInfo || planInfo.planType !== "PREMIUM") {
        return NextResponse.json(
          {
            error: "El Contexto Ético Organizacional es exclusivo del Plan Premium",
            code: "FEATURE_RESTRICTED",
          },
          { status: 403 }
        );
      }
    }

    const parsed = ethicalDocumentUploadSchema.safeParse({
      documentType: documentTypeRaw,
      version: versionRaw || "1.0",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Tipo de documento o versión inválidos" },
        { status: 400 }
      );
    }

    if (!file.name || file.name.length > 255 || /[<>:"/\\|?*\x00-\x1F]/.test(file.name)) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    // Short internal policy documents only — 15MB cap, well above any
    // reasonable "código de ética" or single policy PDF/Word file.
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Archivo demasiado grande. Máximo 15MB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa PDF, Word o texto plano" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const scanResult = await scanUploadedFile(buffer, file.name, file.type);
    if (!scanResult.safe) {
      return NextResponse.json(
        { error: "Archivo rechazado por el scanner de seguridad" },
        { status: 400 }
      );
    }

    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 64);
    const fileExt = (file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "").toLowerCase();
    const isPdf = file.type === "application/pdf";

    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: `ethics-context/${orgId}`,
      public_id: isPdf
        ? `${Date.now()}_${safeBaseName}`
        : `${Date.now()}_${safeBaseName}${fileExt ? `.${fileExt}` : ""}`,
      resource_type: isPdf ? "auto" : "raw",
      max_file_size: 15000000,
    });

    const extractedTextRaw = await extractText(buffer, file.type);
    const extractedText = extractedTextRaw
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_EXTRACTED_TEXT_CHARS);

    const document = await prisma.ethicalContextDocument.create({
      data: {
        organizationId: orgId,
        filename: file.name,
        fileUrl: uploadResponse.secure_url,
        fileSize: file.size,
        mimeType: file.type,
        documentType: parsed.data.documentType,
        version: parsed.data.version,
        extractedText: extractedText || null,
        uploadedById: userId,
        uploadedByName:
          `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
          userEmail ||
          userId,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("[ethics-context/upload] Error:", error);
    return NextResponse.json(
      { error: "No se pudo subir el documento. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
