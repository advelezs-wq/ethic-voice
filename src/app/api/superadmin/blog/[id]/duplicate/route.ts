import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { ensureUniqueBlogSlug } from "@/lib/blog/ensureUniqueSlug";
import { BlogPostStatus } from "@prisma/client";

async function requireSuperAdmin() {
  const { userId } = await auth();
  if (!userId)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const me = await currentUser();
  const email = me?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { userId, email };
}

const MAX_TITLE = 300;
const SUFFIX = " (copia)";

function duplicateTitle(original: string): string {
  const maxBase = MAX_TITLE - SUFFIX.length;
  if (original.length <= maxBase) return `${original}${SUFFIX}`;
  const truncated = `${original.slice(0, maxBase - 1).trimEnd()}…`;
  return `${truncated}${SUFFIX}`;
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const title = duplicateTitle(existing.title);
  const slug = await ensureUniqueBlogSlug(title, null);

  const post = await prisma.blogPost.create({
    data: {
      title,
      excerpt: existing.excerpt,
      contentHtml: existing.contentHtml,
      coverImageUrl: existing.coverImageUrl,
      metaTitle: existing.metaTitle,
      metaDescription: existing.metaDescription,
      canonicalUrl: existing.canonicalUrl,
      ogImageUrl: existing.ogImageUrl,
      noIndex: existing.noIndex,
      status: BlogPostStatus.DRAFT,
      slug,
      publishedAt: null,
      authorId: gate.userId,
      authorEmail: gate.email,
    },
  });

  return NextResponse.json({ post });
}
