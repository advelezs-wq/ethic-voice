export const AboutValues = () => {
  const values = [
    {
      icon: (
        <i
          className="icon-[lucide--shield] text-green-700 size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Confidencialidad",
      description:
        "Protegemos la identidad y la información de nuestros usuarios con los más altos estándares de seguridad.",
    },
    {
      icon: (
        <i
          className="icon-[lucide--heart] text-green-700 size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Integridad",
      description:
        "Actuamos con transparencia y honestidad en todas nuestras interacciones y decisiones comerciales.",
    },
    {
      icon: (
        <i
          className="icon-[lucide--lightbulb] text-green-700 size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Innovación",
      description:
        "Desarrollamos continuamente nuevas soluciones para hacer que el cumplimiento sea más eficiente y accesible.",
    },
    {
      icon: (
        <i
          className="icon-[lucide--users] text-green-700 size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Inclusión",
      description:
        "Creamos un entorno donde todas las voces son escuchadas y valoradas, sin importar su origen o posición.",
    },
    {
      icon: (
        <i
          className="icon-[lucide--target] text-green-700 size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Excelencia",
      description:
        "Nos esforzamos por superar las expectativas en cada aspecto de nuestro servicio y producto.",
    },
    {
      icon: (
        <i
          className="icon-[lucide--globe] text-green-700 size-8"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Impacto Global",
      description:
        "Trabajamos para crear un impacto positivo en organizaciones y comunidades alrededor del mundo.",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Nuestros Valores
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Estos valores fundamentales guían nuestras decisiones diarias y
            definen la forma en que interactuamos con nuestros clientes, socios
            y comunidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => {
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl mb-6 group-hover:bg-green-200 transition-colors">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mission Statement */}
        <div className="mt-20 bg-gradient-to-r from-green-800 to-green-700 rounded-2xl p-12 text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-6">
            Nuestra Misión
          </h3>
          <p className="text-xl text-green-100 leading-relaxed max-w-4xl mx-auto">
            Empoderar a las organizaciones para crear culturas de integridad y
            transparencia mediante tecnología innovadora que hace que reportar
            irregularidades sea seguro, accesible y efectivo para todos.
          </p>
        </div>
      </div>
    </section>
  );
};
