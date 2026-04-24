import prisma from "@/modules/prisma/lib/prisma";
import { PublicBlogLayout } from "@/modules/blog/components/PublicBlogLayout";
import { BlogPostStatus } from "@prisma/client";
import type { Metadata } from "next";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";
import { BlogPostCard } from "@/modules/blog/components/BlogPostCard";
import { BlogIndexDecor } from "@/modules/blog/components/BlogIndexDecor";
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
      <MarketingSectionV2
        className="!pt-8 !pb-14 md:!pt-10 md:!pb-16"
        guides={[25, 50, 75]}
        eyebrow="Blog"
        title="Ideas y novedades"
        subtitle="Contenido sobre línea ética, cumplimiento normativo y mejores prácticas para tu organización — con la misma claridad visual que nuestra propuesta de valor."
      >
        <div className="sr-only">Introducción al blog EthicVoice</div>
      </MarketingSectionV2>

      <BlogIndexDecor />

      <MarketingSectionV2
        id="articulos"
        className="!border-t-0 !pt-4 md:!pt-6"
        eyebrow="Artículos"
        title="Lo más reciente"
        subtitle="Guías y reflexiones para fortalecer tu canal de integridad y la confianza interna."
        guides={[25, 50, 75]}
      >
        {posts.length === 0 ? (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-[0_8px_22px_rgba(0,0,0,0.06)] md:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-200 bg-lime-50">
                <i
                  className="icon-[lucide--pen-line] h-8 w-8 text-lime-700"
                  aria-hidden
                />
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#0d212c]">
                Pronto publicaremos el primer artículo
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#273c46]">
                Vuelve a visitarnos en unos días o agenda una demo para conocer la
                plataforma mientras tanto.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-[#0d212c] transition-colors hover:border-lime-300 hover:text-lime-800"
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
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <BlogPostCard key={post.slug} post={post} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </MarketingSectionV2>
    </PublicBlogLayout>
  );
}
