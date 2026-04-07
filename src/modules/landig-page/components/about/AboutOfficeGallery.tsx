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
    <section className="bg-white px-4 py-16 md:px-6 md:py-20">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a1f14]/65">
            Cultura
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[#0a1f14] md:text-4xl">
            Nuestro entorno de <span className="text-lime-600">trabajo</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Colaboración, transparencia e impacto: así vive el día a día en
            EthicVoice.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">
          {gallery.map((g, idx) => (
            <div
              key={idx}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-[#0a1f14]/10 shadow-lg shadow-gray-200/60 ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-0.5 hover:border-lime-400/25 hover:shadow-xl"
            >
              <Image
                src={g.src}
                alt={g.alt}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1f14]/35 via-transparent to-transparent opacity-80"
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
