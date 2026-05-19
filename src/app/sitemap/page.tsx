import Link from "next/link";
import prisma from "@/modules/prisma/lib/prisma";
import { BlogPostStatus } from "@prisma/client";
import {
  getBlogSiteBaseUrl,
  getMainSiteBaseUrl,
  PUBLIC_STATIC_ROUTES,
} from "@/lib/seo/sitemap-config";

export const metadata = {
  title: "Sitemap | EthicVoice",
  description:
    "Mapa del sitio de EthicVoice con enlaces del dominio principal y del subdominio de blog.",
  alternates: {
    canonical: "/sitemap",
  },
};

export default async function SitemapPage() {
  const mainBase = getMainSiteBaseUrl();
  const blogBase = getBlogSiteBaseUrl();
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
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          SEO técnico
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0d212c] sm:text-4xl">
          Sitemap de EthicVoice
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Este mapa conecta las páginas públicas del dominio principal y las
          páginas del subdominio de blog.
        </p>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-sm font-semibold text-emerald-900">
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
                  className="inline-flex text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-[#0d212c]">Dominio principal</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PUBLIC_STATIC_ROUTES.map((route) => {
            const href = `${mainBase}${route.path}`;
            return (
              <li key={route.path}>
                <Link
                  href={route.path}
                  className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-emerald-700"
                >
                  {href}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-[#0d212c]">Subdominio de blog</h2>
        <p className="mt-2 text-sm text-slate-600">
          Páginas publicadas en{" "}
          <span className="font-semibold">{blogBase}</span>.
        </p>
        <ul className="mt-4 space-y-2">
          <li>
            <a
              href={`${blogBase}/`}
              className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-emerald-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              {`${blogBase}/`}
            </a>
          </li>
          {posts.map((post) => (
            <li key={post.slug} className="flex flex-col gap-0.5">
              <a
                href={`${blogBase}/${post.slug}`}
                className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-emerald-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${blogBase}/${post.slug}`}
              </a>
              <span className="text-xs text-slate-500">{post.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
