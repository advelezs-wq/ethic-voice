import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terms", label: "Términos" },
  { href: "/about", label: "Empresa" },
  { href: "/blog", label: "Blog" },
  { href: "/sitemap", label: "Sitemap" },
  { href: "/sitemap.xml", label: "Sitemap XML" },
] as const;

/**
 * Pie compacto alineado con la home V2 (no el pie extendido de {@link FooterCTA}).
 */
export function LandingMinimalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white pt-10 pb-[max(11.5rem,calc(9.5rem+env(safe-area-inset-bottom,0px)))] sm:pb-36 md:pb-32 lg:pb-28">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 text-sm text-slate-500 md:flex-row md:px-8">
        <Link href="/" className="inline-flex shrink-0 items-center">
          <Image
            src="/brand/logo-nobg.png"
            alt="EthicVoice"
            width={170}
            height={40}
            className="h-9 w-auto object-contain"
          />
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-lime-700"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <span>Copyright © {year} EthicVoice</span>
      </div>
    </footer>
  );
}
