export const AboutHero = () => {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nosotros
          </h1>
          <p className="text-base text-gray-500">Conoce quiénes somos y qué nos impulsa.</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 md:p-12">
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              EthicVoice es una plataforma avanzada de gestión de denuncias y cumplimiento
              normativo, diseñada para facilitar la creación de canales éticos seguros,
              transparentes y eficientes en cualquier organización. Con un enfoque integral,
              EthicVoice permite a las empresas gestionar, rastrear y resolver denuncias de
              forma anónima, cumpliendo con los estándares internacionales más rigurosos en
              compliance, prevención de lavado de activos, anticorrupción y protección de datos
              personales. Su interfaz intuitiva y flexible hace que la implementación y uso sean
              simples y eficaces, promoviendo una cultura organizacional ética y responsable.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              EthicVoice es administrada y operada por Valor Estratégico Consultores, una firma
              de consultoría con más de 10 años de experiencia en el campo del cumplimiento
              normativo y la gestión de riesgos. A lo largo de nuestra trayectoria, hemos
              trabajado con empresas de diversos sectores, ayudándolas a cumplir con
              regulaciones locales e internacionales, optimizando sus procesos y fortaleciendo
              sus sistemas de control interno.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Con el respaldo de Valor Estratégico Consultores, EthicVoice no solo ofrece
              tecnología de vanguardia, sino también un equipo de expertos comprometidos con la
              excelencia y el cumplimiento en todos los aspectos de la gestión de riesgos y la
              ética empresarial.
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6">
            <img
              src="/brand/logo-nobg.png"
              alt="EthicVoice"
              className="h-8 w-auto opacity-90"
            />
            <span className="text-gray-400">×</span>
            <img
              src="/ethic-brands/valor_estrategico.webp"
              alt="Valor Estratégico Consultores"
              className="h-8 w-auto opacity-90"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
