import prisma from "@/modules/prisma/lib/prisma";
import { PublicBlogLayout } from "@/modules/blog/components/PublicBlogLayout";
import { BlogPostStatus } from "@prisma/client";
import type { Metadata } from "next";
import { BlogPostCard } from "@/modules/blog/components/BlogPostCard";
import { BlogIndexDecor } from "@/modules/blog/components/BlogIndexDecor";
import {
  FloatingBlob,
  LineGridPattern,
  SectionEyebrow,
} from "@/modules/landig-page/components/decor";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | EthicVoice",
  description:
    "Artículos, novedades y recursos sobre línea ética, cumplimiento y cultura de integridad.",
};

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: BlogPostStatus.PUBLISHED,
      publishedAt: { not: null, lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
    },
  });

  const [featured, ...rest] = posts;

  return (
    <PublicBlogLayout>
      {/* Hero del blog — mismo lenguaje que la home V4 */}
      <section className="relative overflow-hidden bg-[#f7faf9]">
        <LineGridPattern />
        <FloatingBlob
          className="-top-20 left-[10%] h-64 w-64 opacity-50"
          color="radial-gradient(closest-side, rgba(163,230,53,0.35), transparent)"
          duration={9}
        />
        <FloatingBlob
          className="right-[6%] top-16 h-72 w-72 opacity-40"
          color="radial-gradient(closest-side, rgba(16,185,129,0.28), transparent)"
          duration={12}
        />
        <div className="relative mx-auto max-w-4xl px-5 pb-14 pt-14 text-center sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
          <SectionEyebrow>Blog EthicVoice</SectionEyebrow>
          <h1 className="mx-auto mt-5 max-w-2xl text-balance text-4xl font-extrabold leading-[1.06] tracking-[-0.025em] text-[#0a1e14] sm:text-5xl">
            Ideas que fortalecen{" "}
            <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 bg-clip-text text-transparent">
              tu cultura ética
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            Guías prácticas sobre canal de denuncias, cumplimiento y cultura de
            integridad. Corto, claro y accionable.
          </p>
        </div>
      </section>

      {/* Artículos */}
      <section
        id="articulos"
        className="relative scroll-mt-24 bg-white py-14 sm:py-16"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
          aria-hidden
        />
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="mx-auto max-w-3xl">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#f7faf9] p-10 text-center md:p-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a1e14]">
                  <i
                    className="icon-[lucide--pen-line] h-8 w-8 text-lime-300"
                    aria-hidden
                  />
                </div>
                <h3 className="mt-6 text-xl font-extrabold text-[#0a1e14]">
                  Pronto publicaremos el primer artículo
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                  Vuelve en unos días o conoce la plataforma mientras tanto.
                </p>
                <Link
                  href="/"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-[#052b24] shadow-[0_8px_24px_rgba(163,230,53,0.35)] transition hover:bg-lime-300"
                >
                  Volver al inicio
                  <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-7xl space-y-8">
              {featured ? <BlogPostCard post={featured} featured /> : null}
              {rest.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <BlogPostCard key={post.slug} post={post} />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <BlogIndexDecor />
    </PublicBlogLayout>
  );
}
