import Link from "next/link";
import {
  LineGridPattern,
  SectionEyebrow,
} from "@/modules/landig-page/components/decor";

/** Cierre del índice: contenedor flotante verde de marca, estilo V4. */
export function BlogIndexDecor() {
  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#0a1e14] px-6 py-12 sm:px-10 sm:py-14 md:px-14">
        <LineGridPattern dark />
        <div
          className="pointer-events-none absolute -right-28 -top-28 h-[360px] w-[360px] rounded-full border border-lime-300/[0.08] motion-safe:animate-slowSpin"
          style={{ animationDuration: "60s" }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-lime-300/40" />
        </div>
        <div
          className="pointer-events-none absolute right-0 top-0 h-[300px] w-[300px] opacity-20 blur-[100px]"
          style={{ background: "rgba(163,230,53,0.3)" }}
          aria-hidden
        />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <SectionEyebrow dark>Recursos</SectionEyebrow>
            <h3 className="mt-4 text-balance text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              De la lectura a la acción
            </h3>
            <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-white/60 sm:text-base">
              Descarga la guía para implementar un canal de denuncias exitoso:
              pasos, errores comunes y checklist de lanzamiento.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/guia-canal-denuncias"
                className="group inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-[#052b24] shadow-[0_8px_24px_rgba(163,230,53,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lime-300"
              >
                <i className="icon-[lucide--download] h-4 w-4" aria-hidden />
                Descargar guía gratis
              </Link>
              <Link
                href="/#planes"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
              >
                Ver planes
                <i className="icon-[lucide--arrow-right] h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/[0.12]">
                  <i
                    className={`${item.icon} h-5 w-5 text-lime-300`}
                    aria-hidden
                  />
                </div>
                <p className="mt-2.5 text-sm font-bold text-white">{item.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  {item.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
