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
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-lime-200/80 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] ${
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
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes={
                featured
                  ? "(max-width: 1024px) 100vw, 50vw"
                  : "(max-width: 768px) 100vw, 33vw"
              }
            />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center bg-gradient-to-br from-[#f7faf9] to-slate-100">
              <i
                className="icon-[lucide--newspaper] size-14 text-lime-600/40"
                aria-hidden
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:from-black/35" />
        </div>

        <div
          className={`flex flex-1 flex-col justify-center p-6 md:p-8 ${
            featured ? "lg:py-10 lg:pl-10 lg:pr-12" : ""
          }`}
        >
          {dateLabel ? (
            <span className="inline-flex w-fit items-center rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-lime-800">
              {dateLabel}
            </span>
          ) : null}
          <h2
            className={`mt-3 font-bold tracking-tight text-[#0d212c] ${
              featured
                ? "text-2xl md:text-3xl lg:text-[2rem] lg:leading-tight"
                : "text-lg md:text-xl"
            }`}
          >
            {post.title}
            <span className="ml-2 inline-block text-lime-600 opacity-0 transition-opacity group-hover:opacity-100">
              <i className="icon-[lucide--arrow-up-right] size-5 align-middle" aria-hidden />
            </span>
          </h2>
          {post.excerpt ? (
            <p
              className={`mt-3 leading-relaxed text-[#273c46] ${
                featured ? "text-base line-clamp-3 md:line-clamp-4" : "line-clamp-3 text-sm"
              }`}
            >
              {post.excerpt}
            </p>
          ) : null}
          <span className="mt-5 inline-flex items-center text-sm font-semibold text-lime-800">
            Leer artículo
            <i className="icon-[lucide--arrow-right] ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}
