import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const logo = formData.get("logo") as Blob | null;
    const organizationId = String(formData.get("organizationId") || "");
    if (!logo || !organizationId) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // Check permissions: user must be ADMIN of org
    const membership = await prisma.organizationMembership.findUnique({ where: { userId_orgId: { userId, orgId: organizationId } } });
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare Cloudinary signed upload
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_FOLDER_LOGOS || "ethicvoice/org-logos";
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    const arrayBuffer = await logo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = (logo as any).type || "image/png";
    const fileDataUri = `data:${mime};base64,${buffer.toString("base64")}`;

    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const cdForm = new FormData();
    cdForm.append("file", fileDataUri);
    cdForm.append("api_key", apiKey);
    cdForm.append("timestamp", String(timestamp));
    cdForm.append("folder", folder);
    cdForm.append("signature", signature);

    const cdResp = await fetch(cloudinaryUrl, { method: "POST", body: cdForm as any });
    const cdJson = await cdResp.json();
    if (!cdResp.ok) {
      return NextResponse.json({ error: cdJson?.error?.message || "Cloudinary upload failed" }, { status: 500 });
    }

    const logoUrl = cdJson.secure_url as string;

    // Persist in DB: settings and organization
    await prisma.organizationSettings.upsert({
      where: { organizationId },
      update: { logoUrl },
      create: { organizationId, logoUrl },
    });
    await prisma.organization.update({ where: { id: organizationId }, data: { logoUrl } });

    return NextResponse.json({ success: true, logoUrl });
  } catch (e) {
    console.error("/api/organization/logo/upload error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// (duplicate handler removed)
