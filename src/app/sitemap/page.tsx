import Link from "next/link";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import prisma from "@/modules/prisma/lib/prisma";
import { BlogPostStatus } from "@prisma/client";
import {
  getMainSiteBaseUrl,
  PUBLIC_STATIC_ROUTES,
} from "@/lib/seo/sitemap-config";

export const metadata = {
  title: "Sitemap | EthicVoice",
  description: "Mapa del sitio de EthicVoice con enlaces del dominio principal y del blog.",
  alternates: {
    canonical: "/sitemap",
  },
};

export default async function SitemapPage() {
  const mainBase = getMainSiteBaseUrl();
  const now = new Date();

  const posts = await prisma.blogPost.findMany({
    where: {
      status: BlogPostStatus.PUBLISHED,
      publishedAt: { not: null, lte: now },
      noIndex: false,
    },
    select: { slug: true, title: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  return (
    <MarketingPageShell showFooter={false} showStickyCta={false}>
    <div className="mx-auto max-w-5xl px-[var(--ev-gutter)] py-14">
      <div className="rounded-[1.5rem] border border-ev-line bg-white p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ev-moss">
          SEO técnico
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ev-night sm:text-4xl">
          Sitemap de EthicVoice
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ev-mute sm:text-base">
          Este mapa conecta las páginas públicas del dominio principal y las
          páginas del subdominio de blog.
        </p>

        <div className="mt-6 rounded-xl border border-ev-line bg-ev-paper p-4">
          <p className="text-sm font-semibold text-ev-night">
            XML para buscadores
          </p>
          <ul className="mt-2 space-y-1">
            {[
              `${mainBase}/sitemap.xml`,
              `${mainBase}/sitemap-main.xml`,
              `${mainBase}/sitemap-blog.xml`,
            ].map((url) => (
              <li key={url}>
                <a
                  href={url}
                  className="inline-flex text-sm font-medium text-ev-moss underline underline-offset-2 hover:text-ev-night"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ev-night">Dominio principal</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PUBLIC_STATIC_ROUTES.map((route) => {
            const href = `${mainBase}${route.path}`;
            return (
              <li key={route.path}>
                <Link
                  href={route.path}
                  className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-ev-moss"
                >
                  {href}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ev-night">Blog</h2>
        <p className="mt-2 text-sm text-ev-mute">
          Posts publicados en{" "}
          <span className="font-semibold">{mainBase}/blog</span>.
        </p>
        <ul className="mt-4 space-y-2">
          {posts.map((post) => (
            <li key={post.slug} className="flex flex-col gap-0.5">
              <a
                href={`${mainBase}/blog/${post.slug}`}
                className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-ev-moss"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${mainBase}/blog/${post.slug}`}
              </a>
              <span className="text-xs text-slate-500">{post.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
    </MarketingPageShell>
  );
}
