import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize";
import { ensureUniqueBlogSlug } from "@/lib/blog/ensureUniqueSlug";
import { BlogPostStatus } from "@prisma/client";

const patchBody = z.object({
  title: z.string().min(1).max(300).optional(),
  excerpt: z.string().max(4000).optional().nullable(),
  contentHtml: z.string().optional(),
  coverImageUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
  status: z.nativeEnum(BlogPostStatus).optional(),
  slug: z.string().max(200).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

async function requireSuperAdmin() {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const me = await currentUser();
  const email = me?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId, email };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validación fallida", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const titleNext = data.title?.trim() ?? existing.title;

  let slugExplicit: string | null | undefined;
  if (data.slug === undefined) {
    slugExplicit = existing.slug;
  } else {
    const s = data.slug?.trim();
    slugExplicit = s || null;
  }

  const slugNext = await ensureUniqueBlogSlug(
    titleNext,
    slugExplicit,
    existing.id
  );

  const statusNext = data.status ?? existing.status;
  let publishedAt = existing.publishedAt;

  if (data.publishedAt !== undefined) {
    publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
  }

  if (data.status !== undefined) {
    if (statusNext === BlogPostStatus.DRAFT) {
      publishedAt = null;
    } else if (statusNext === BlogPostStatus.PUBLISHED && !publishedAt) {
      publishedAt = new Date();
    }
  }

  let cover = existing.coverImageUrl;
  if (data.coverImageUrl !== undefined) {
    cover =
      data.coverImageUrl === "" || data.coverImageUrl === null
        ? null
        : data.coverImageUrl;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: titleNext,
      excerpt:
        data.excerpt !== undefined
          ? data.excerpt?.trim() || null
          : existing.excerpt,
      contentHtml:
        data.contentHtml !== undefined
          ? sanitizeBlogHtml(data.contentHtml)
          : existing.contentHtml,
      coverImageUrl: cover,
      status: statusNext,
      slug: slugNext,
      publishedAt,
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  try {
    await prisma.blogPost.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
