import Image from "next/image";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

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
    <MarketingSectionV2
      surface
      eyebrow="Cultura"
      title="Nuestro entorno de trabajo"
      subtitle="Colaboración, transparencia e impacto: así vive el día a día en EthicVoice."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {gallery.map((g, idx) => (
          <div
            key={idx}
            className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <Image
              src={g.src}
              alt={g.alt}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#051a24]/30 via-transparent to-transparent"
              aria-hidden
            />
          </div>
        ))}
      </div>
    </MarketingSectionV2>
  );
};
