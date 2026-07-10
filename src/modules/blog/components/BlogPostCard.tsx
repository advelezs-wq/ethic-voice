import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type BlogCardPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
};

type Props = {
  post: BlogCardPost;
  featured?: boolean;
};

export function BlogPostCard({ post, featured }: Props) {
  const dateLabel =
    post.publishedAt != null
      ? format(post.publishedAt, "d MMM yyyy", { locale: es })
      : null;

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_24px_60px_rgba(10,30,20,0.12)] ${
        featured ? "lg:col-span-12" : ""
      }`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={`flex h-full flex-col ${featured ? "lg:flex-row" : ""}`}
      >
        <div
          className={`relative shrink-0 overflow-hidden bg-slate-100 ${
            featured
              ? "aspect-[16/10] w-full lg:aspect-auto lg:h-auto lg:w-[46%] lg:min-h-[280px]"
              : "aspect-[16/10] w-full"
          }`}
        >
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes={
                featured
                  ? "(max-width: 1024px) 100vw, 50vw"
                  : "(max-width: 768px) 100vw, 33vw"
              }
            />
          ) : (
            <div className="relative flex h-full min-h-[200px] items-center justify-center overflow-hidden bg-[#0a1e14]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
                style={{ background: "rgba(163,230,53,0.5)" }}
                aria-hidden
              />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-300/[0.12]">
                <i
                  className="icon-[lucide--newspaper] size-8 text-lime-300"
                  aria-hidden
                />
              </span>
            </div>
          )}
          {featured ? (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-lime-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#052b24] shadow-lg">
              <i className="icon-[lucide--flame] h-3 w-3" aria-hidden />
              Destacado
            </span>
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1e14]/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <div
          className={`flex flex-1 flex-col justify-center p-6 md:p-8 ${
            featured ? "lg:py-10 lg:pl-10 lg:pr-12" : ""
          }`}
        >
          {dateLabel ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              <i className="icon-[lucide--calendar] h-3 w-3" aria-hidden />
              {dateLabel}
            </span>
          ) : null}
          <h2
            className={`mt-3 font-extrabold tracking-tight text-[#0a1e14] ${
              featured
                ? "text-2xl md:text-3xl lg:text-[2rem] lg:leading-tight"
                : "text-lg md:text-xl"
            }`}
          >
            {post.title}
            <span className="ml-2 inline-block text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
              <i className="icon-[lucide--arrow-up-right] size-5 align-middle" aria-hidden />
            </span>
          </h2>
          {post.excerpt ? (
            <p
              className={`mt-3 leading-relaxed text-slate-600 ${
                featured ? "text-base line-clamp-3 md:line-clamp-4" : "line-clamp-3 text-sm"
              }`}
            >
              {post.excerpt}
            </p>
          ) : null}
          <span className="mt-5 inline-flex items-center text-sm font-bold text-emerald-700">
            Leer artículo
            <i className="icon-[lucide--arrow-right] ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}
