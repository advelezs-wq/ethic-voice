type Props = { html: string };

/** HTML ya saneado en el servidor (p. ej. con `sanitizeBlogHtml`). */
export function BlogArticleBody({ html }: Props) {
  return (
    <div
      className="max-w-none text-[1.125rem] leading-[1.7] tracking-[-0.01em] text-ev-ink/85 [&_h1]:mt-12 [&_h1]:text-[2.25rem] [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:tracking-[-0.04em] [&_h1]:text-ev-night [&_h2]:mt-14 [&_h2]:text-[1.875rem] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-[-0.035em] [&_h2]:text-ev-night [&_h3]:mt-10 [&_h3]:text-[1.375rem] [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_h3]:text-ev-night [&_p]:my-5 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5 [&_li]:marker:text-ev-moss [&_a]:text-ev-night [&_a]:underline [&_a]:decoration-ev-signal [&_a]:decoration-2 [&_a]:underline-offset-4 hover:[&_a]:decoration-ev-night [&_blockquote]:my-10 [&_blockquote]:border-l-2 [&_blockquote]:border-ev-signal [&_blockquote]:pl-6 [&_blockquote]:font-serif [&_blockquote]:text-[1.625rem] [&_blockquote]:italic [&_blockquote]:leading-snug [&_blockquote]:text-ev-night [&_code]:rounded [&_code]:bg-ev-bone [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.875em] [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-ev-night [&_pre]:p-5 [&_pre]:text-white [&_img]:my-10 [&_img]:w-full [&_img]:rounded-[1.25rem] [&_hr]:my-12 [&_hr]:border-ev-line [&_strong]:font-semibold [&_strong]:text-ev-night"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
