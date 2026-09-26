import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/modules/prisma/lib/prisma";
import { PublicBlogLayout } from "@/modules/blog/components/PublicBlogLayout";
import { BlogArticleBody } from "@/modules/blog/components/BlogArticleBody";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize";
import { BlogPostStatus } from "@prisma/client";
import type { Metadata } from "next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Container } from "@/modules/brand/components/primitives";
import { GuideBand } from "@/modules/landig-page/components/v5/GuideBand";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: BlogPostStatus.PUBLISHED,
      publishedAt: { not: null, lte: new Date() },
    },
    select: {
      title: true,
      excerpt: true,
      coverImageUrl: true,
      metaTitle: true,
      metaDescription: true,
      canonicalUrl: true,
      ogImageUrl: true,
      noIndex: true,
      slug: true,
    },
  });
  if (!post) return { title: "Artículo | EthicVoice" };
  const finalTitle = post.metaTitle?.trim() || post.title;
  const finalDescription =
    post.metaDescription?.trim() || post.excerpt || post.title;
  const finalCanonical = post.canonicalUrl?.trim() || `/blog/${post.slug}`;
  const ogImage = post.ogImageUrl?.trim() || post.coverImageUrl || undefined;

  return {
    title: `${finalTitle} | Blog EthicVoice`,
    description: finalDescription,
    alternates: {
      canonical: finalCanonical,
    },
    robots: post.noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
    // Per-route openGraph replaces the root layout's wholesale rather than
    // merging — always define it with a real image (the post's own, or the
    // brand default) so a post without a cover never ships with no
    // og:image at all. See src/app/page.tsx for the full explanation.
    openGraph: {
      images: [{ url: ogImage || "/brand/ethicvoice.jpeg" }],
      title: finalTitle,
      description: finalDescription,
    },
  };
}

/** Minutos de lectura estimados a partir del HTML (~200 palabras/min). */
function readingTimeMinutes(html: string) {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: BlogPostStatus.PUBLISHED,
      publishedAt: { not: null, lte: new Date() },
    },
  });

  if (!post) notFound();

  const safeHtml = sanitizeBlogHtml(post.contentHtml);
  const minutes = readingTimeMinutes(safeHtml);

  return (
    <PublicBlogLayout>
      <article>
        <header className="bg-ev-paper">
          <Container className="pb-16 pt-10 sm:pt-14">
            <div className="ev-label flex items-center justify-between border-b border-ev-line pb-4 text-ev-mute">
              <Link href="/blog" className="transition-colors hover:text-ev-night">
                ← Blog
              </Link>
              <span className="flex gap-4">
                {post.publishedAt ? (
                  <time dateTime={post.publishedAt.toISOString()}>
                    {format(post.publishedAt, "d MMMM yyyy", { locale: es })}
                  </time>
                ) : null}
                <span>{minutes} min de lectura</span>
              </span>
            </div>
            <div className="mx-auto mt-14 max-w-4xl sm:mt-20">
              <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-ev-night">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="ev-lead mt-8 max-w-2xl">{post.excerpt}</p>
              ) : null}
            </div>
          </Container>
        </header>

        {post.coverImageUrl ? (
          <div className="bg-gradient-to-b from-ev-paper from-50% to-white to-50%">
            <Container>
              <div className="relative mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-[1.5rem] bg-ev-bone">
                <Image
                  src={post.coverImageUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                />
              </div>
            </Container>
          </div>
        ) : null}

        <div className="bg-white py-16 sm:py-24">
          <Container>
            <div className="mx-auto max-w-[42rem]">
              <BlogArticleBody html={safeHtml} />
            </div>
          </Container>
        </div>
      </article>

      <GuideBand />
    </PublicBlogLayout>
  );
}
