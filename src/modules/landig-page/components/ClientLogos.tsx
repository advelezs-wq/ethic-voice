import React from "react";
import { motion } from "framer-motion";
import { Image } from "@heroui/react";

export const ClientLogos = () => {
  const brands = [
    {
      name: "LaBrutal",
      id: 1,
      logoImage: (
        <Image
          src="/ethic-brands/la_brutal.png"
          alt="LaBrutal"
          classNames={{
            img: "rounded-none",
            wrapper: "rounded-none",
          }}
        />
      ),
    },
    {
      name: "Progress Consulting Group",
      id: 2,
      logoImage: (
        <Image
          src="/ethic-brands/progress.png"
          alt="Progress Consulting Group"
          classNames={{
            img: "rounded-none",
            wrapper: "rounded-none",
          }}
        />
      ),
    },
    {
      name: "Valor Estratégico",
      id: 3,
      logoImage: (
        <Image
          src="/ethic-brands/valor_estrategico.webp"
          alt="Valor Estratégico"
          classNames={{
            img: "rounded-none",
            wrapper: "rounded-none",
          }}
        />
      ),
    },
    {
      name: "Norvik Tech",
      id: 4,
      logoImage: (
        <Image
          src="/ethic-brands/norvik_logo.webp"
          alt="Norvik Tech"
          classNames={{
            img: "rounded-none",
            wrapper: "rounded-none",
          }}
        />
      ),
    },
    {
      name: "LaBrutal",
      id: 5,
      logoImage: (
        <Image
          src="/ethic-brands/la_brutal.png"
          alt="LaBrutal"
          classNames={{
            img: "rounded-none",
            wrapper: "rounded-none",
          }}
        />
      ),
    },
    {
      name: "Universal Emerald",
      id: 6,
      logoImage: (
        <Image
          src="/ethic-brands/universal_emerald.png"
          alt="Universal Emerald"
          classNames={{
            img: "rounded-none",
            wrapper: "rounded-none",
          }}
        />
      ),
    },
    {
      name: "Valor Estratégico",
      id: 7,
      logoImage: (
        <Image
          src="/ethic-brands/valor_estrategico.webp"
          alt="Valor Estratégico"
          classNames={{
            img: "rounded-none",
            wrapper: "rounded-none",
          }}
        />
      ),
    },
    {
      name: "Norvik Tech",
      id: 8,
      logoImage: (
        <Image
          src="/ethic-brands/norvik_logo.webp"
          classNames={{
            img: "rounded-none",
            wrapper: "rounded-none",
          }}
          alt="Norvik Tech"
        />
      ),
    },
  ];

  return (
    <section className="py-16 px-6 bg-white">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Habilitando las marcas más éticas
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Más de 5,000 organizaciones confían en nuestra plataforma para
            mantener los más altos estándares de integridad y cumplimiento.
          </p>
        </motion.div>

        <div className="relative overflow-hidden">
          <div className="flex animate-scroll">
            {[...brands, ...brands].map((logo, index) => (
              <div
                key={`${logo.id}-${index}`}
                className="flex-shrink-0 w-48 mx-8 flex items-center justify-center"
              >
                {logo.logoImage}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
