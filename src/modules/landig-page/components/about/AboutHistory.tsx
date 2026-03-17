export const AboutHistory = () => {
  return (
    <section className="py-20 px-6 bg-green-800 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-green-700/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-emerald-600/30 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-5xl relative text-white text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
          Nuestra historia
        </h2>
        <p className="text-lg md:text-xl text-green-100 leading-relaxed max-w-4xl mx-auto">
          Desde 2017, EthicVoice y Valor Estratégico Consultores ha acompañado a organizaciones a construir culturas
          de integridad. Nacimos para darle voz a las personas y simplificar el
          cumplimiento con tecnología segura, clara y efectiva.
        </p>
        <p className="mt-6 text-lg md:text-xl text-green-100 leading-relaxed max-w-4xl mx-auto">
          Hoy contamos con más de 30 contribuidores y colaboramos con grandes
          compañías del sector y firmas de consultoría en Colombia y Latinoamérica,
          fortaleciendo programas de ética y cumplimiento adaptados a cada
          realidad organizacional.
        </p>
      </div>
    </section>
  );
};
