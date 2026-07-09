import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

// Archivos descargables permitidos para lead magnets
const FILE_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await currentUser();
  const email = me?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json(
      { error: "Cloudinary no configurado" },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const kind = (formData.get("kind") as string) || "cover"; // "cover" | "file"
    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const isCover = kind === "cover";
    const allowed = isCover ? IMAGE_TYPES : FILE_TYPES;
    if (!allowed.has(file.type)) {
      return NextResponse.json(
        {
          error: isCover
            ? "Tipo de imagen no permitido (JPG, PNG, WebP, AVIF o GIF)"
            : "Tipo de archivo no permitido (PDF, ZIP, Word, Excel o PowerPoint)",
        },
        { status: 400 }
      );
    }

    const maxBytes = (isCover ? 12 : 50) * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Máximo ${isCover ? 12 : 50}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    const fileExt = (file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "").toLowerCase();
    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 64);

    // Los descargables (salvo PDF) van como "raw" con extensión en el public_id
    const isRaw = !isCover && file.type !== "application/pdf";
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: "ethicvoice/lead-magnets",
      resource_type: isCover ? "image" : isRaw ? "raw" : "auto",
      ...(isRaw
        ? {
            public_id: `${Date.now()}_${safeBaseName}${fileExt ? `.${fileExt}` : ""}`,
          }
        : {}),
    });

    return NextResponse.json({
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    });
  } catch (e) {
    console.error("[lead-magnets upload]", e);
    return NextResponse.json({ error: "Error al subir" }, { status: 500 });
  }
}
