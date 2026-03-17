import { motion } from "framer-motion";

export const HowItWorks = () => {
  const steps = [
    {
      icon: (
        <i
          className="icon-[lucide--message-square] text-green-700 size-10"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Cuéntanos sobre ti",
      description:
        "Te contactaremos en 24 horas para entender completamente tus necesidades",
    },
    {
      icon: (
        <i
          className="icon-[lucide--monitor] text-green-700 size-10"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Solución personalizada",
      description:
        "Programaremos una llamada corta y te mostraremos las opciones adaptadas a tu organización",
    },
    {
      icon: (
        <i
          className="icon-[lucide--rocket] text-green-700 size-10"
          role="img"
          aria-hidden="true"
        />
      ),
      title: "Implementación rápida",
      description:
        "Te apoyamos de manera oportuna con todo lo necesario para comenzar",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Cómo funciona?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
