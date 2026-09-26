import prisma from "@/modules/prisma/lib/prisma";
import { PublicBlogLayout } from "@/modules/blog/components/PublicBlogLayout";
import { BlogPostStatus } from "@prisma/client";
import type { Metadata } from "next";
import { BlogPostCard } from "@/modules/blog/components/BlogPostCard";
import { PageHero } from "@/modules/brand/components/sections";
import { ButtonLink, Container, Voice } from "@/modules/brand/components/primitives";
import { GuideBand } from "@/modules/landig-page/components/v5/GuideBand";

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
      <PageHero
        kicker="Blog y recursos"
        title={["Ideas que fortalecen", <>tu cultura <Voice>ética.</Voice></>]}
        lead="Guías prácticas sobre canal de denuncias, cumplimiento e integridad. Corto, claro y accionable."
      />

      <section id="articulos" className="scroll-mt-20 bg-white py-20 sm:py-28">
        <Container>
          {posts.length === 0 ? (
            <div className="border-t border-ev-night py-16">
              <p className="ev-h3 text-ev-night">Pronto publicaremos el primer artículo.</p>
              <p className="mt-3 text-ev-mute">Mientras tanto, descarga la guía o conoce la plataforma.</p>
              <ButtonLink href="/" variant="ink" arrow className="mt-8">
                Volver al inicio
              </ButtonLink>
            </div>
          ) : (
            <div className="space-y-20">
              {featured ? <BlogPostCard post={featured} featured /> : null}
              {rest.length > 0 ? (
                <div className="grid gap-x-8 gap-y-16 border-t border-ev-line pt-16 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <BlogPostCard key={post.slug} post={post} />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </Container>
      </section>

      <GuideBand />
    </PublicBlogLayout>
  );
}
