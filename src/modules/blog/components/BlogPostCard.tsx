import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LogoMark } from "@/modules/brand/components/Logo";

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

/** Tarjeta editorial: imagen, fecha en mono y titular — sin adornos. */
export function BlogPostCard({ post, featured }: Props) {
  const dateLabel =
    post.publishedAt != null
      ? format(post.publishedAt, "d MMM yyyy", { locale: es })
      : null;

  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className={`grid gap-6 ${featured ? "lg:grid-cols-12 lg:items-end lg:gap-8" : ""}`}
      >
        <div
          className={`relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-ev-bone ${
            featured ? "lg:col-span-7" : ""
          }`}
        >
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-700 ease-ev-out group-hover:scale-[1.03]"
              sizes={featured ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 768px) 100vw, 33vw"}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-ev-night">
              <LogoMark tone="dark" className="h-16 w-auto opacity-60" />
            </div>
          )}
        </div>

        <div className={featured ? "lg:col-span-5" : ""}>
          <p className="ev-label flex items-center gap-3 text-ev-mute">
            {featured ? <span className="text-ev-moss">Destacado</span> : null}
            {dateLabel ? <span>{dateLabel}</span> : null}
          </p>
          <h2
            className={`mt-3 font-semibold text-ev-night underline decoration-transparent decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-300 group-hover:decoration-ev-night/30 ${
              featured
                ? "text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.05] tracking-[-0.045em]"
                : "text-[1.375rem] leading-tight tracking-[-0.03em]"
            }`}
          >
            {post.title}
          </h2>
          {post.excerpt ? (
            <p
              className={`mt-3 leading-relaxed text-ev-mute ${
                featured ? "line-clamp-3 text-[1.0625rem]" : "line-clamp-2 text-[0.9375rem]"
              }`}
            >
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
