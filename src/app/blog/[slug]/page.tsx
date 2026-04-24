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
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

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
    select: { title: true, excerpt: true, coverImageUrl: true },
  });
  if (!post) return { title: "Artículo | EthicVoice" };
  return {
    title: `${post.title} | Blog EthicVoice`,
    description: post.excerpt || post.title,
    openGraph: post.coverImageUrl
      ? { images: [{ url: post.coverImageUrl }] }
      : undefined,
  };
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

  return (
    <PublicBlogLayout>
      <MarketingSectionV2
        surface
        className="!pb-10 md:!pb-12"
        guides={[25, 50, 75]}
      >
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-semibold text-lime-800 transition-colors hover:text-lime-950"
          >
            <i className="icon-[lucide--arrow-left] mr-2 h-4 w-4" aria-hidden />
            Volver al blog
          </Link>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-lime-700">
            Blog · Artículo
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0d212c] md:text-[2.75rem] md:leading-[1.12]">
            {post.title}
          </h1>
          {post.publishedAt ? (
            <time
              dateTime={post.publishedAt.toISOString()}
              className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#273c46]"
            >
              {format(post.publishedAt, "d MMMM yyyy", { locale: es })}
            </time>
          ) : null}
          {post.excerpt ? (
            <p className="mt-6 text-lg leading-relaxed text-[#273c46]">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </MarketingSectionV2>

      <MarketingSectionV2 className="!border-t-0 !pt-0 md:!pt-2" guides={[25, 50, 75]}>
        <div className="mx-auto max-w-3xl space-y-10">
          {post.coverImageUrl ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_8px_22px_rgba(0,0,0,0.06)]">
              <Image
                src={post.coverImageUrl}
                alt=""
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-[0_8px_22px_rgba(0,0,0,0.06)] md:px-10 md:py-11">
            <BlogArticleBody html={safeHtml} />
          </div>
        </div>
      </MarketingSectionV2>
    </PublicBlogLayout>
  );
}
