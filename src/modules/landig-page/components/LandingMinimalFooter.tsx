import Link from "next/link";

const LINKS = [
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terms", label: "Términos" },
  { href: "/about", label: "Empresa" },
  { href: "/blog", label: "Blog" },
] as const;

/**
 * Pie compacto alineado con la home V2 (no el pie extendido de {@link FooterCTA}).
 */
export function LandingMinimalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 text-sm text-slate-500 md:flex-row md:px-8">
        <span className="text-sm font-black tracking-[0.18em] text-[#0d212c]">
          ETHICVOICE
        </span>
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
        <span>
          Copyright © {year} EthicVoice
        </span>
      </div>
    </footer>
  );
}
