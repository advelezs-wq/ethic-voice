import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { sanitizeLeadMagnetSlug as sanitizeSlug } from "@/lib/lead-magnets";

async function assertSuperAdmin() {
  const { userId } = await auth();
  if (!userId)
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true as const, userId };
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await assertSuperAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const existing = await prisma.leadMagnet.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (typeof body.description === "string") {
      data.description = body.description.trim() || null;
    }
    if (typeof body.coverImageUrl === "string") {
      data.coverImageUrl = body.coverImageUrl.trim() || null;
    }
    if (typeof body.fileUrl === "string" && body.fileUrl.trim()) {
      data.fileUrl = body.fileUrl.trim();
    }
    if (typeof body.ctaLabel === "string") {
      data.ctaLabel = body.ctaLabel.trim() || null;
    }
    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive;
    }
    if (body.formFields && typeof body.formFields === "object") {
      data.formFields = {
        phone: body.formFields.phone !== false,
        company: body.formFields.company !== false,
        role: body.formFields.role !== false,
      };
    }
    if (typeof body.slug === "string" && body.slug.trim()) {
      const slug = sanitizeSlug(body.slug);
      if (slug && slug !== existing.slug) {
        const clash = await prisma.leadMagnet.findUnique({ where: { slug } });
        if (clash) {
          return NextResponse.json(
            { error: `La URL /recursos/${slug} ya está en uso.` },
            { status: 409 }
          );
        }
        data.slug = slug;
      }
    }
    if (typeof body.campaign === "string" && body.campaign.trim()) {
      data.campaign = sanitizeSlug(body.campaign).replace(/-/g, "_");
    }

    const magnet = await prisma.leadMagnet.update({ where: { id }, data });
    return NextResponse.json({ magnet });
  } catch (e) {
    console.error("[lead-magnets] update failed:", e);
    return NextResponse.json(
      { error: "No se pudo actualizar el recurso" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await assertSuperAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    await prisma.leadMagnet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[lead-magnets] delete failed:", e);
    return NextResponse.json(
      { error: "No se pudo eliminar el recurso" },
      { status: 500 }
    );
  }
}
