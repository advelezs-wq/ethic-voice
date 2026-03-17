import { Header } from "@/modules/landig-page/components/layout/Header";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
import { BackgroundCurves } from "@/modules/landig-page/components/layout/BackgroundCurves";

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white bg-curves relative">
      <div className="absolute inset-0 -z-[1]">
        <BackgroundCurves />
      </div>
      <Header />
      <main className="pt-24 pb-16">
        <section className="container max-w-7xl md:mx-auto">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Programa de Partners EthicVoice
            </h1>
            <p className="mt-4 text-lg text-gray-700">
              Crece con nosotros llevando la ética empresarial a otro nivel.
            </p>
            <p className="mt-4 text-gray-700">
              En EthicVoice creemos que la transparencia y la ética corporativa no son solo un requisito legal, sino una verdadera ventaja
              competitiva. Por eso, hemos creado un Programa de Partners para que consultores, firmas de auditoría, despachos legales,
              compañías de software y aliados estratégicos puedan ofrecer a sus clientes nuestra plataforma de canal de denuncias
              confidencial, anónima y segura.
            </p>
            <p className="mt-4 text-gray-700">
              Con EthicVoice, no solo vendes un software, sino que ayudas a las organizaciones a prevenir riesgos, proteger su reputación
              y fortalecer su cultura ética.
            </p>
          </div>
        </section>

        <section className="container max-w-7xl md:mx-auto mt-12">
          <div className="bg-gray-50 rounded-2xl p-6 md:p-10 border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Beneficios de ser Partner EthicVoice</h2>
            <ul className="mt-6 space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <i className="icon-[mdi--check-circle] text-green-700 size-6 mt-0.5" aria-hidden="true" />
                <span><strong>Nuevas fuentes de ingresos:</strong> Recibe comisiones atractivas por cada cliente que adquiera la plataforma a través de ti.</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="icon-[mdi--check-circle] text-green-700 size-6 mt-0.5" aria-hidden="true" />
                <span><strong>Valor agregado a tu portafolio:</strong> Amplía tu oferta con una solución tecnológica de cumplimiento y ética empresarial.</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="icon-[mdi--check-circle] text-green-700 size-6 mt-0.5" aria-hidden="true" />
                <span><strong>Soporte y acompañamiento:</strong> Material comercial, capacitaciones y asesoría directa de nuestro equipo.</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="icon-[mdi--check-circle] text-green-700 size-6 mt-0.5" aria-hidden="true" />
                <span><strong>Reconocimiento conjunto:</strong> Red oficial de aliados y visibilidad compartida en eventos, medios y campañas.</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="icon-[mdi--check-circle] text-green-700 size-6 mt-0.5" aria-hidden="true" />
                <span><strong>Modelo flexible:</strong> Recomienda, comercializa o integra EthicVoice en tus servicios.</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="container max-w-7xl md:mx-auto mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">¿A quién está dirigido?</h2>
          <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <li className="flex items-start gap-3"><i className="icon-[mdi--arrow-right] size-5 mt-1 text-green-700" /><span>Consultores en cumplimiento, ética y riesgos.</span></li>
            <li className="flex items-start gap-3"><i className="icon-[mdi--arrow-right] size-5 mt-1 text-green-700" /><span>Firmas de auditoría, legales y contables.</span></li>
            <li className="flex items-start gap-3"><i className="icon-[mdi--arrow-right] size-5 mt-1 text-green-700" /><span>Empresas de tecnología que deseen integrar EthicVoice.</span></li>
            <li className="flex items-start gap-3"><i className="icon-[mdi--arrow-right] size-5 mt-1 text-green-700" /><span>Cámaras de comercio, gremios y asociaciones empresariales.</span></li>
          </ul>
        </section>

        <section className="container max-w-7xl md:mx-auto mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Modalidades de Colaboración</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">1. Partner Referenciador</h3>
              <p className="text-gray-700">Recomiendas EthicVoice y recibes comisión por cada contrato cerrado.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">2. Partner Comercial</h3>
              <p className="text-gray-700">Incluyes EthicVoice en tu portafolio, gestionas clientes y accedes a mejores beneficios económicos.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">3. Partner Estratégico</h3>
              <p className="text-gray-700">Alianza a largo plazo con integraciones tecnológicas o proyectos conjuntos.</p>
            </div>
          </div>
        </section>

        <section className="container max-w-7xl md:mx-auto mt-12">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 md:p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Únete a nuestra red de Partners</h2>
            <p className="mt-3 text-gray-700 max-w-3xl mx-auto">
              Forma parte de la transformación hacia una cultura empresarial más ética y transparente en Colombia y Latinoamérica.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:partners@ethicvoice.co" className="inline-flex items-center px-6 py-3 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800">
                Escríbenos
                <i className="icon-[mdi--email] ml-2 size-5" />
              </a>
              <a href="/partners/portal" className="inline-flex items-center px-6 py-3 rounded-full border-2 border-green-700 text-green-700 font-semibold hover:bg-green-50">
                Ir al Portal de Partners
                <i className="icon-[mdi--arrow-right] ml-2 size-5" />
              </a>
            </div>
            <div className="mt-6 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-4">
                <span className="inline-flex items-center gap-2">
                  <i className="icon-[mdi--web]" />
                  <a href="https://www.ethicvoice.co" target="_blank" className="underline">www.ethicvoice.co</a>
                </span>
                <span className="inline-flex items-center gap-2">
                  <i className="icon-[mdi--phone]" />
                  (+57) 322 414 5120
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}


