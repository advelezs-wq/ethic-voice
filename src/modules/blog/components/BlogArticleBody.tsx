type Props = { html: string };

/** HTML ya saneado en el servidor (p. ej. con `sanitizeBlogHtml`). */
export function BlogArticleBody({ html }: Props) {
  return (
    <div
      className="max-w-none space-y-4 text-base leading-relaxed text-slate-600 [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:text-[#0a1e14] [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-[#0a1e14] [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#0a1e14] [&_p]:my-3 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li]:marker:text-emerald-600 [&_a]:font-semibold [&_a]:text-emerald-700 [&_a]:underline [&_a]:decoration-emerald-500/40 [&_a]:underline-offset-2 hover:[&_a]:text-emerald-900 [&_blockquote]:my-6 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-emerald-50/60 [&_blockquote]:py-2 [&_blockquote]:pl-5 [&_blockquote]:pr-4 [&_blockquote]:font-medium [&_blockquote]:italic [&_blockquote]:text-[#0a1e14] [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:text-sm [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-slate-200 [&_pre]:bg-slate-50 [&_pre]:p-4 [&_img]:my-6 [&_img]:max-h-[480px] [&_img]:w-full [&_img]:rounded-2xl [&_img]:object-cover [&_img]:ring-1 [&_img]:ring-slate-200/80 [&_hr]:my-8 [&_hr]:border-slate-200 [&_strong]:font-bold [&_strong]:text-[#0a1e14]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
