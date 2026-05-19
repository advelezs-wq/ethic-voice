import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize";
import { ensureUniqueBlogSlug } from "@/lib/blog/ensureUniqueSlug";
import { notifySitemapUpdated } from "@/lib/seo/sitemap-ping";
import { BlogPostStatus, Prisma } from "@prisma/client";

const secureUrl = z
  .string()
  .url()
  .max(2048)
  .refine((v) => v.startsWith("https://"), "URL inválida");

const createBody = z.object({
  title: z.string().min(1).max(300),
  excerpt: z.string().max(4000).optional().nullable(),
  contentHtml: z.string().max(300000),
  coverImageUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
  status: z.nativeEnum(BlogPostStatus),
  slug: z
    .string()
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug inválido")
    .optional()
    .nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(160).optional().nullable(),
  metaDescription: z.string().max(320).optional().nullable(),
  canonicalUrl: z.union([secureUrl, z.literal(""), z.null()]).optional(),
  ogImageUrl: z.union([secureUrl, z.literal(""), z.null()]).optional(),
  noIndex: z.boolean().optional(),
});

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

const listQuery = z.object({
  status: z.enum(["ALL", "DRAFT", "PUBLISHED"]).default("ALL"),
  q: z
    .string()
    .max(200)
    .optional()
    .transform((s) => {
      const t = s?.trim();
      return t && t.length > 0 ? t : undefined;
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const sp = req.nextUrl.searchParams;
  const parsed = listQuery.safeParse({
    status: sp.get("status") ?? "ALL",
    q: sp.get("q") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status, q, page, pageSize } = parsed.data;
  const where: Prisma.BlogPostWhereInput = {};

  if (status !== "ALL") {
    where.status = status as BlogPostStatus;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const [total, posts] = await prisma.$transaction([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    posts,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validación fallida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    title,
    excerpt,
    contentHtml,
    coverImageUrl,
    status,
    slug,
    publishedAt,
    metaTitle,
    metaDescription,
    canonicalUrl,
    ogImageUrl,
    noIndex,
  } = parsed.data;

  const cleanHtml = sanitizeBlogHtml(contentHtml);
  const slugFinal = await ensureUniqueBlogSlug(title, slug);

  let pubAt: Date | null = null;
  if (status === BlogPostStatus.PUBLISHED) {
    pubAt = publishedAt ? new Date(publishedAt) : new Date();
  } else {
    pubAt = null;
  }

  const cover =
    coverImageUrl === "" ||
    coverImageUrl === null ||
    coverImageUrl === undefined
      ? null
      : coverImageUrl;

  const post = await prisma.blogPost.create({
    data: {
      title: title.trim(),
      excerpt: excerpt?.trim() || null,
      contentHtml: cleanHtml,
      coverImageUrl: cover,
      status,
      slug: slugFinal,
      publishedAt: pubAt,
      metaTitle: metaTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
      canonicalUrl: canonicalUrl?.trim() || null,
      ogImageUrl: ogImageUrl?.trim() || null,
      noIndex: noIndex ?? false,
      authorId: gate.userId,
      authorEmail: gate.email,
    },
  });

  if (post.status === BlogPostStatus.PUBLISHED && !post.noIndex) {
    void notifySitemapUpdated();
  }

  return NextResponse.json({ post });
}
