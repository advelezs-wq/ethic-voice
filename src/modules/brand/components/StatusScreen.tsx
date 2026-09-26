import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "./Logo";

/**
 * Pantalla de estado de marca (404, error). Server-safe: las acciones se
 * pasan como nodos para que las páginas cliente inyecten sus handlers.
 */
export function StatusScreen({
  code,
  title,
  body,
  actions,
  footnote,
}: {
  code: string;
  title: ReactNode;
  body: ReactNode;
  actions: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className="ev-site relative flex min-h-[100dvh] flex-col overflow-hidden">
      <header className="mx-auto flex h-16 w-full max-w-[var(--ev-max)] items-center px-[var(--ev-gutter)]">
        <Link href="/" aria-label="EthicVoice — inicio">
          <Logo markClassName="h-7 w-auto" />
        </Link>
      </header>

      <LogoMark
        className="pointer-events-none absolute -bottom-[10%] -right-[12%] h-auto w-[70vw] max-w-[56rem] opacity-[0.06]"
      />

      <main className="relative mx-auto flex w-full max-w-[var(--ev-max)] flex-1 flex-col justify-center px-[var(--ev-gutter)] py-16">
        <p className="ev-label text-ev-moss">({code})</p>
        <h1 className="mt-6 max-w-4xl text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-ev-night">
          {title}
        </h1>
        <p className="ev-lead mt-8 max-w-lg">{body}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">{actions}</div>
        {footnote ? <div className="mt-16 border-t border-ev-line pt-6 text-sm text-ev-mute">{footnote}</div> : null}
      </main>
    </div>
  );
}
