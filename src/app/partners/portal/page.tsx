import { Header } from "@/modules/landig-page/components/layout/Header";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
import Link from "next/link";

export default function PartnersPortalPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Portal de Partners</h1>
          <p className="mt-4 text-gray-700 max-w-2xl mx-auto">
            Accede al portal exclusivo para socios de EthicVoice. Si aún no tienes acceso, contáctanos en
            <a href="mailto:partners@ethicvoice.co" className="underline ml-1">partners@ethicvoice.co</a>.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/auth/sign-in" className="inline-flex items-center px-6 py-3 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800">
              Iniciar sesión
              <i className="icon-[mdi--login] ml-2 size-5" />
            </Link>
            <a href="mailto:partners@ethicvoice.co" className="inline-flex items-center px-6 py-3 rounded-full border-2 border-green-700 text-green-700 font-semibold hover:bg-green-50">
              Solicitar acceso
              <i className="icon-[mdi--email] ml-2 size-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}


