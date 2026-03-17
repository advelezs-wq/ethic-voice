import { Image } from "@heroui/react";

export const AboutTeam = () => {
  const team = [
    {
      name: "María González",
      position: "CEO & Fundadora",
      image: "/lovable-uploads/50d7bc89-98fd-49a5-b67f-94230c5d3ca5.png",
      bio: "Experta en cumplimiento corporativo con más de 15 años de experiencia en multinacionales.",
      linkedin: "#",
      email: "maria@ethicvoice.com",
    },
    {
      name: "Carlos Rodríguez",
      position: "CTO",
      image: "/lovable-uploads/8324ce9d-a25b-4480-beb0-990b38071d97.png",
      bio: "Ingeniero de software especializado en seguridad y privacidad de datos.",
      linkedin: "#",
      email: "carlos@ethicvoice.com",
    },
    {
      name: "Ana Martínez",
      position: "VP de Producto",
      image: "/lovable-uploads/ceb0d5d2-2d83-407f-bb1e-8f6959b93eb9.png",
      bio: "Diseñadora UX/UI con experiencia en plataformas de cumplimiento y ética corporativa.",
      linkedin: "#",
      email: "ana@ethicvoice.com",
    },
    {
      name: "Diego Silva",
      position: "Director de Ventas",
      image: "/lovable-uploads/eada8c8b-332c-4ac7-813d-42884f942368.png",
      bio: "Especialista en desarrollo de negocios B2B con enfoque en soluciones de compliance.",
      linkedin: "#",
      email: "diego@ethicvoice.com",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Nuestro Equipo
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Un equipo diverso de expertos comprometidos con hacer que el
            cumplimiento sea más accesible, seguro y efectivo para
            organizaciones de todos los tamaños.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300"
            >
              <div className="aspect-square overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-green-700 font-medium mb-3">
                  {member.position}
                </p>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {member.bio}
                </p>
                <div className="flex space-x-3">
                  <a
                    href={member.linkedin}
                    className="inline-flex items-center justify-center w-8 h-8 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                  >
                    <i
                      className="icon-[lucide--linkedin] size-4"
                      role="img"
                      aria-hidden="true"
                    />
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center justify-center w-8 h-8 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <i
                      className="icon-[lucide--mail] size-4"
                      role="img"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
