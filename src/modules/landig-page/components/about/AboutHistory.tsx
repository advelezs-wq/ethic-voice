import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

export const AboutHistory = () => {
  return (
    <MarketingSectionV2
      eyebrow="Trayectoria"
      title="Nuestra historia"
      subtitle="Un camino compartido con organizaciones que apuestan por la integridad."
    >
      <div className="relative overflow-hidden rounded-[28px] border border-emerald-700/30 bg-gradient-to-br from-[#06251f] via-[#07352b] to-[#052b24] p-8 text-center shadow-[0_28px_80px_-36px_rgba(6,37,31,0.85)] md:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(94,210,156,0.2), transparent 42%), radial-gradient(circle at 85% 80%, rgba(45,212,191,0.12), transparent 40%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span
            className="mx-auto mb-6 block h-1 w-12 rounded-full bg-lime-400"
            aria-hidden
          />
          <p className="text-lg leading-relaxed text-white/90 md:text-xl">
            Desde <span className="font-semibold text-lime-300">2017</span>,
            EthicVoice y Valor Estratégico Consultores acompañan a organizaciones
            a construir culturas de integridad. Nacimos para darle voz a las
            personas y simplificar el cumplimiento con tecnología segura, clara
            y efectiva.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-white/80 md:text-xl">
            Hoy contamos con más de{" "}
            <span className="font-semibold text-white">30 contribuidores</span>{" "}
            y colaboramos con grandes compañías del sector y firmas de consultoría
            en Colombia y Latinoamérica, fortaleciendo programas de ética y
            cumplimiento adaptados a cada realidad organizacional.
          </p>
        </div>
      </div>
    </MarketingSectionV2>
  );
};
