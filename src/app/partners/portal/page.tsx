import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import Link from "next/link";

export default function PartnersPortalPage() {
  return (
    <MarketingPageShell mainClassName="pb-16">
      <section className="container mx-auto px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/60">
          Partners
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0a1f14] md:text-5xl">
          Portal de <span className="text-lime-600">Partners</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-700">
          Accede al portal exclusivo para socios de EthicVoice. Si aún no tienes
          acceso, contáctanos en{" "}
          <a href="mailto:partners@ethicvoice.co" className="underline">
            partners@ethicvoice.co
          </a>
          .
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-[0_0_24px_rgba(190,242,100,0.35)] transition hover:bg-lime-300"
          >
            Iniciar sesión
            <i className="icon-[mdi--login] ml-2 size-5" />
          </Link>
          <a
            href="mailto:partners@ethicvoice.co"
            className="inline-flex items-center rounded-full border-2 border-[#0a1f14]/20 px-6 py-3 font-semibold text-[#0a1f14] transition hover:bg-[#f5f3ee]"
          >
            Solicitar acceso
            <i className="icon-[mdi--email] ml-2 size-5" />
          </a>
        </div>
      </section>
    </MarketingPageShell>
  );
}
