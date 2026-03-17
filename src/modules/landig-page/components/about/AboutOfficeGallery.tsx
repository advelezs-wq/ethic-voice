import Image from "next/image";

export const AboutOfficeGallery = () => {
  const gallery = [
    {
      src: "/nosotros/nosotros-2.png",
      alt: "Personas colaborando en oficina",
    },
    {
      src: "/nosotros/nosotros-3.png",
      alt: "Reunión de equipo en sala de juntas",
    },
    {
      src: "/nosotros/nostros-1.png",
      alt: "Colaboración y trabajo en equipo en oficina",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Nuestro Entorno de Trabajo
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Creemos en la colaboración, la transparencia y el impacto. Así se vive el día a día en
            EthicVoice.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gallery.map((g, idx) => (
            <div
              key={idx}
              className="relative w-full h-56 md:h-64 rounded-xl overflow-hidden shadow-lg"
            >
              <Image src={g.src} alt={g.alt} fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


