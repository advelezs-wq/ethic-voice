import prisma from "@/modules/prisma/lib/prisma";
import { slugifyTitle } from "./slugify";

export async function ensureUniqueBlogSlug(
  title: string,
  explicitSlug: string | undefined | null,
  excludePostId?: string
): Promise<string> {
  const trimmed = (explicitSlug || "").trim();
  const raw = trimmed ? slugifyTitle(trimmed) : slugifyTitle(title);
  let slug = raw;
  let n = 1;
  for (;;) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludePostId) return slug;
    n += 1;
    slug = `${raw}-${n}`;
  }
}
