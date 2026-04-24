import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";

/** Franja decorativa al estilo bloque “solución” de la home, sin CTA duplicada. */
export function BlogIndexDecor() {
  return (
    <MarketingSectionV2
      className="!border-t-0 !py-12 md:!py-16"
      surface
      guides={[25, 50, 75]}
    >
      <div className="relative overflow-hidden rounded-[28px] border border-emerald-700/25 bg-gradient-to-br from-[#06251f] via-[#05382f] to-[#052b24] p-8 shadow-[0_24px_70px_-28px_rgba(6,37,31,0.75)] md:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(94,210,156,0.22), transparent 40%), radial-gradient(circle at 90% 10%, rgba(45,212,191,0.18), transparent 32%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 grid gap-6 md:grid-cols-12 md:items-center">
          <div className="md:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
              Recursos
            </p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-white md:text-3xl">
              Contenido pensado para equipos de ética y cumplimiento
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
              Artículos prácticos sobre canal de denuncias, cultura de integridad
              y operación segura de casos, con el mismo enfoque que nuestra
              plataforma.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:col-span-5">
            {[
              {
                icon: "icon-[lucide--shield-check]",
                t: "Cumplimiento y normativa",
                d: "Contexto útil sin sustituir asesoría legal.",
              },
              {
                icon: "icon-[lucide--scale]",
                t: "Buenas prácticas",
                d: "Ideas accionables para comité y liderazgo.",
              },
            ].map((item) => (
              <div
                key={item.t}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
              >
                <i className={`${item.icon} h-6 w-6 text-emerald-300`} aria-hidden />
                <p className="mt-2 text-sm font-bold text-white">{item.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/75">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingSectionV2>
  );
}
