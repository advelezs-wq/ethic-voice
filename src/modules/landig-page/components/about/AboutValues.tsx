import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

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
    <MarketingSectionV2
      id="valores"
      eyebrow="Principios"
      title="Nuestros valores"
      subtitle="Guían nuestras decisiones diarias y definen cómo interactuamos con clientes, socios y comunidad."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {values.map((value) => (
          <article
            key={value.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.12)] md:p-7"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lime-100">
              <i className={`${value.icon} h-6 w-6 text-lime-800`} aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-[#0d212c]">{value.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#273c46] md:text-[0.9375rem]">
              {value.description}
            </p>
          </article>
        ))}
      </div>

      <div className="relative mt-12 overflow-hidden rounded-[28px] border border-emerald-400/35 bg-gradient-to-br from-[#051a24] via-[#0d212c] to-[#052b24] px-6 py-12 text-center shadow-[0_24px_60px_-28px_rgba(5,43,36,0.5)] md:mt-14 md:px-12 md:py-14">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
          aria-hidden
        />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Propósito
          </p>
          <h3 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Nuestra misión
          </h3>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/85 md:text-lg">
            Empoderar a las organizaciones para crear culturas de integridad y
            transparencia mediante tecnología innovadora que hace que reportar
            irregularidades sea seguro, accesible y efectivo para todos.
          </p>
        </div>
      </div>
    </MarketingSectionV2>
  );
};
