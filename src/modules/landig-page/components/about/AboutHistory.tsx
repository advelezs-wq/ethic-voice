export const AboutHistory = () => {
  return (
    <section className="relative overflow-hidden bg-[#0a1f14] px-4 py-16 md:px-6 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_30%,rgba(163,230,53,0.09)_0%,transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-10 container mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90">
          Trayectoria
        </p>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
          Nuestra <span className="text-lime-400">historia</span>
        </h2>
        <span
          className="mx-auto mt-6 block h-1 w-12 rounded-full bg-lime-400"
          aria-hidden
        />
        <p className="mt-8 text-lg leading-relaxed text-white/85 md:text-xl">
          Desde <span className="font-semibold text-lime-300">2017</span>,
          EthicVoice y Valor Estratégico Consultores acompañan a organizaciones a
          construir culturas de integridad. Nacimos para darle voz a las
          personas y simplificar el cumplimiento con tecnología segura, clara y
          efectiva.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-white/75 md:text-xl">
          Hoy contamos con más de{" "}
          <span className="font-semibold text-white">30 contribuidores</span> y
          colaboramos con grandes compañías del sector y firmas de consultoría en
          Colombia y Latinoamérica, fortaleciendo programas de ética y
          cumplimiento adaptados a cada realidad organizacional.
        </p>
      </div>
    </section>
  );
};
