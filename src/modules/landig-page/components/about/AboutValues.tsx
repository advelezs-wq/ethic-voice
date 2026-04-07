export const AboutValues = () => {
  const values = [
    {
      icon: "icon-[lucide--shield]",
      title: "Confidencialidad",
      description:
        "Protegemos la identidad y la información de nuestros usuarios con los más altos estándares de seguridad.",
    },
    {
      icon: "icon-[lucide--heart]",
      title: "Integridad",
      description:
        "Actuamos con transparencia y honestidad en todas nuestras interacciones y decisiones comerciales.",
    },
    {
      icon: "icon-[lucide--lightbulb]",
      title: "Innovación",
      description:
        "Desarrollamos continuamente nuevas soluciones para hacer que el cumplimiento sea más eficiente y accesible.",
    },
    {
      icon: "icon-[lucide--users]",
      title: "Inclusión",
      description:
        "Creamos un entorno donde todas las voces son escuchadas y valoradas, sin importar su origen o posición.",
    },
    {
      icon: "icon-[lucide--target]",
      title: "Excelencia",
      description:
        "Nos esforzamos por superar las expectativas en cada aspecto de nuestro servicio y producto.",
    },
    {
      icon: "icon-[lucide--globe]",
      title: "Impacto global",
      description:
        "Trabajamos para crear un impacto positivo en organizaciones y comunidades alrededor del mundo.",
    },
  ];

  return (
    <section
      id="valores"
      className="relative overflow-hidden bg-gradient-to-b from-[#f5f3ee] via-[#faf9f6] to-[#f5f3ee] px-4 py-16 md:px-6 md:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_100%,rgba(20,83,45,0.05)_0%,transparent_45%)]"
        aria-hidden
      />
      <div className="relative z-10 container mx-auto max-w-7xl">
        <div className="mb-12 text-center md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/65">
            Principios
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[#0a1f14] md:text-4xl">
            Nuestros <span className="text-lime-600">valores</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600">
            Guían nuestras decisiones diarias y definen cómo interactuamos con
            clientes, socios y comunidad.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {values.map((value) => (
            <div
              key={value.title}
              className="group rounded-3xl border border-[#0a1f14]/10 bg-white/95 p-7 shadow-md shadow-gray-200/50 ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-0.5 hover:border-lime-400/25 hover:shadow-lg"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/15 ring-1 ring-lime-400/30 transition group-hover:bg-lime-400/20">
                <i
                  className={`${value.icon} size-7 text-lime-600`}
                  aria-hidden
                />
              </div>
              <h3 className="text-xl font-bold text-[#0a1f14]">{value.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-[0.9375rem]">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-16 overflow-hidden rounded-3xl border border-lime-400/20 bg-[#0a1f14] px-6 py-12 text-center shadow-[0_0_48px_rgba(10,31,20,0.35)] md:mt-20 md:px-12 md:py-14">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,rgba(163,230,53,0.12)_0%,transparent_55%)]"
            aria-hidden
          />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/90">
              Propósito
            </p>
            <h3 className="mt-3 text-2xl font-bold text-white md:text-3xl">
              Nuestra misión
            </h3>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
              Empoderar a las organizaciones para crear culturas de integridad y
              transparencia mediante tecnología innovadora que hace que reportar
              irregularidades sea seguro, accesible y efectivo para todos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
