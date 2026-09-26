"use client";

import Link from "next/link";
import { Container, Eyebrow, RevealHeading, Voice, reveal } from "@/modules/brand/components/primitives";
import { trackCta } from "@/modules/brand/hooks/useDemoCta";

const DOORS = [
  {
    href: "/submit",
    n: "A",
    kicker: "Canal seguro",
    title: "Hacer una denuncia",
    body: "Comparte lo que ocurrió. Tú decides si te identificas; la evidencia viaja cifrada.",
    cta: "Iniciar denuncia",
    event: "portal_report",
  },
  {
    href: "/track",
    n: "B",
    kicker: "Consulta privada",
    title: "Seguir mi caso",
    body: "Con tu clave consultas el avance y respondes al equipo sin revelar quién eres.",
    cta: "Consultar con mi clave",
    event: "portal_track",
  },
] as const;

/** Las dos puertas del denunciante: rápidas, grandes, sin fricción. */
export function ReportPortal() {
  return (
    <section id="denunciar" className="relative scroll-mt-20 bg-ev-bone py-28 sm:py-36">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="05">Para quien reporta</Eyebrow>
          </div>
          <div className="lg:col-span-9">
            <RevealHeading
              className="ev-h2 text-ev-night"
              lines={[
                "Si viniste a contar algo,",
                <>
                  estamos aquí para <Voice>escucharte.</Voice>
                </>,
              ]}
            />
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {DOORS.map((d, i) => (
            <Link
              key={d.href}
              href={d.href}
              onClick={() => trackCta(d.event, "report_portal")}
              {...reveal(i * 120)}
              className="group relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-ev-paper p-7 transition-colors duration-300 hover:bg-white sm:p-10"
            >
              <div className="flex items-start justify-between">
                <p className="ev-label text-ev-mute">{d.kicker}</p>
                <span className="font-wordmark text-[7rem] font-semibold leading-[0.7] tracking-[-0.06em] text-ev-night/[0.07] transition-colors duration-500 group-hover:text-ev-signal/40 sm:text-[9rem]">
                  {d.n}
                </span>
              </div>
              <div>
                <h3 className="text-[clamp(2rem,3.4vw,3rem)] font-semibold leading-none tracking-[-0.045em] text-ev-night">
                  {d.title}
                </h3>
                <p className="mt-4 max-w-sm text-[0.975rem] leading-relaxed text-ev-mute">
                  {d.body}
                </p>
                <span className="mt-8 inline-flex items-center gap-3 text-[0.9375rem] font-medium text-ev-night">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ev-night text-white transition-transform duration-300 ease-ev-out group-hover:translate-x-1">
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
                      <path d="M2.5 8h10M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {d.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="ev-label mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-ev-mute">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-ev-signal" />
            Privacidad desde el diseño
          </span>
          <span>Cifrado de extremo a extremo</span>
          <span>Buenas prácticas ISO 37002</span>
        </p>
      </Container>
    </section>
  );
}
