import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="text-black py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="max-w-[200px]">
              <Link href="/" className="flex items-center">
                <img
                  className="w-full object-cover"
                  src="/brand/logo-nobg.png"
                  alt="EthicVoice"
                />
              </Link>
            </div>
            <p className="text-black text-sm">
              Empoderando organizaciones en todo el mundo con soluciones de
              denuncias seguras y conformes.
            </p>
          </div>

          {/* Servicios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Servicios</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/platform"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Plataforma EthicVoice
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Servicios
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Enviar denuncia
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Rastrear caso
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Acerca de Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Únete a EthicVoice
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Partners
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Sitemap
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  className="text-black hover:text-green-700 transition-colors"
                >
                  Sitemap XML
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte y Certificaciones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Soporte</h3>
            <div className="space-y-2 text-sm text-black">
              <p>soporte@ethicvoice.com</p>
              <p>24/7 en 75+ idiomas</p>
            </div>
            {/* Cumplimiento / Marcos de referencia */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="px-2 py-1 bg-slate-100 rounded text-xs">
                ISO 37002
              </div>
              <div className="px-2 py-1 bg-slate-100 rounded text-xs">GDPR</div>
              <div className="px-2 py-1 bg-slate-100 rounded text-xs">
                SOC 2
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex space-x-6 text-sm text-black">
              <Link
                href="/privacidad"
                className="hover:text-green-700 transition-colors"
              >
                Política de Privacidad
              </Link>
              <Link
                href="/terms"
                className="hover:text-green-700 transition-colors"
              >
                Términos de Servicio
              </Link>
              <Link
                href="/partners"
                className="hover:text-green-700 transition-colors"
              >
                Partners
              </Link>
              <Link
                href="/sitemap"
                className="hover:text-green-700 transition-colors"
              >
                Sitemap
              </Link>
            </div>
            <p className="text-sm text-black">
              © 2025 EthicVoice. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
