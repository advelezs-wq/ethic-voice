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
import {
  FloatingBlob,
  LineGridPattern,
  SectionEyebrow,
} from "@/modules/landig-page/components/decor";

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
    openGraph: ogImage
      ? {
          images: [{ url: ogImage }],
          title: finalTitle,
          description: finalDescription,
        }
      : undefined,
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
      {/* Cabecera del artículo — lenguaje V4 */}
      <section className="relative overflow-hidden bg-[#f7faf9]">
        <LineGridPattern />
        <FloatingBlob
          className="-top-20 left-[12%] h-56 w-56 opacity-45"
          color="radial-gradient(closest-side, rgba(163,230,53,0.32), transparent)"
          duration={9}
        />
        <FloatingBlob
          className="right-[8%] top-10 h-64 w-64 opacity-35"
          color="radial-gradient(closest-side, rgba(16,185,129,0.26), transparent)"
          duration={12}
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-12 pt-12 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800"
          >
            <i
              className="icon-[lucide--arrow-left] h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            Volver al blog
          </Link>

          <div className="mt-8">
            <SectionEyebrow>Blog · Artículo</SectionEyebrow>
          </div>

          <h1 className="mt-4 text-balance text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0a1e14] md:text-[2.75rem] md:leading-[1.08]">
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {post.publishedAt ? (
              <time
                dateTime={post.publishedAt.toISOString()}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                <i className="icon-[lucide--calendar] h-3.5 w-3.5" aria-hidden />
                {format(post.publishedAt, "d MMMM yyyy", { locale: es })}
              </time>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <i className="icon-[lucide--clock] h-3.5 w-3.5" aria-hidden />
              {minutes} min de lectura
            </span>
          </div>

          {post.excerpt ? (
            <p className="mt-6 text-pretty text-lg leading-relaxed text-slate-600">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </section>

      {/* Cuerpo */}
      <section className="relative bg-white py-10 sm:py-12">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
          aria-hidden
        />
        <div className="mx-auto max-w-3xl space-y-10 px-5 sm:px-6 lg:px-8">
          {post.coverImageUrl ? (
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(163,230,53,0.18), rgba(16,185,129,0.10), transparent 70%)",
                }}
                aria-hidden
              />
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-[0_24px_60px_rgba(10,30,20,0.12)]">
                <Image
                  src={post.coverImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-[0_16px_44px_rgba(10,30,20,0.07)] md:px-10 md:py-11">
            <BlogArticleBody html={safeHtml} />
          </div>

          {/* CTA de cierre — contenedor verde de marca */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0a1e14] px-6 py-8 sm:px-8 sm:py-9">
            <LineGridPattern dark />
            <div
              className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-25 blur-3xl"
              style={{ background: "rgba(163,230,53,0.4)" }}
              aria-hidden
            />
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-balance text-xl font-extrabold text-white">
                  ¿Listo para llevar esto a tu organización?
                </h3>
                <p className="mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-white/60">
                  Descarga la guía de implementación o conoce la plataforma.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/guia-canal-denuncias"
                  className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-5 py-2.5 text-sm font-bold text-[#052b24] shadow-[0_6px_20px_rgba(163,230,53,0.3)] transition hover:bg-lime-300"
                >
                  <i className="icon-[lucide--download] h-4 w-4" aria-hidden />
                  Guía gratis
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
                >
                  Conocer EthicVoice
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicBlogLayout>
  );
}
