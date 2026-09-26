import type { ReactNode } from "react";
import { Container, Eyebrow, RevealHeading, reveal } from "./primitives";

/**
 * Patrones de página reutilizables. Todas las secciones del sitio siguen la
 * misma retícula: índice a 3 columnas, titular a 9 (ver BRAND.md § Layout).
 */

const SURFACES = {
  paper: "bg-ev-paper text-ev-night",
  white: "bg-white text-ev-night",
  bone: "bg-ev-bone text-ev-night",
  night: "ev-grain ev-grain-dark bg-ev-night text-white",
} as const;

export type Surface = keyof typeof SURFACES;

export function PageHero({
  index = "EV",
  kicker,
  title,
  lead,
  actions,
  aside,
  surface = "paper",
}: {
  index?: string;
  kicker: string;
  title: ReactNode[];
  lead?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  surface?: Surface;
}) {
  const dark = surface === "night";
  return (
    <section className={`relative overflow-hidden ${SURFACES[surface]}`}>
      <Container className="pb-20 pt-10 sm:pt-14 lg:pb-28">
        <div
          {...reveal(0)}
          className={`ev-label flex items-center justify-between border-b pb-4 ${
            dark ? "border-white/10 text-white/50" : "border-ev-line text-ev-mute"
          }`}
        >
          <span>
            <span className={dark ? "text-ev-signal" : "text-ev-moss"}>({index})</span>{" "}
            {kicker}
          </span>
          <span className="hidden sm:inline">EthicVoice</span>
        </div>
        <div className={`mt-12 grid gap-12 sm:mt-16 ${aside ? "lg:grid-cols-12 lg:items-end lg:gap-8" : ""}`}>
          <div className={aside ? "lg:col-span-7" : ""}>
            <RevealHeading as="h1" className="ev-display max-w-5xl" lines={title} delay={60} />
            {lead ? (
              <p
                {...reveal(250)}
                className={`ev-lead mt-8 max-w-xl ${dark ? "!text-white/65" : ""}`}
              >
                {lead}
              </p>
            ) : null}
            {actions ? (
              <div {...reveal(350)} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                {actions}
              </div>
            ) : null}
          </div>
          {aside ? (
            <div {...reveal(300)} className="lg:col-span-5">
              {aside}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export function Section({
  id,
  index,
  kicker,
  title,
  intro,
  children,
  surface = "white",
  className = "",
}: {
  id?: string;
  index?: string;
  kicker?: string;
  title?: ReactNode[];
  intro?: ReactNode;
  children?: ReactNode;
  surface?: Surface;
  className?: string;
}) {
  const dark = surface === "night";
  return (
    <section
      id={id}
      className={`relative scroll-mt-20 overflow-hidden py-24 sm:py-32 ${SURFACES[surface]} ${className}`}
    >
      <Container>
        {kicker || title ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-3">
              {kicker ? (
                <Eyebrow index={index} tone={dark ? "dark" : "light"}>
                  {kicker}
                </Eyebrow>
              ) : null}
            </div>
            <div className="lg:col-span-9">
              {title ? <RevealHeading className="ev-h2" lines={title} /> : null}
              {intro ? (
                <p
                  {...reveal(150)}
                  className={`ev-lead mt-6 max-w-2xl ${dark ? "!text-white/60" : ""}`}
                >
                  {intro}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        {children ? <div className={kicker || title ? "mt-16 sm:mt-20" : ""}>{children}</div> : null}
      </Container>
    </section>
  );
}

/** Lista de registro: filas numeradas con título y descripción. */
export function IndexList({
  items,
  dark = false,
  columns = 1,
}: {
  items: ReadonlyArray<{ title: ReactNode; body?: ReactNode }>;
  dark?: boolean;
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 3 ? "md:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : "";
  return (
    <ol className={`grid gap-x-8 ${cols}`}>
      {items.map((it, i) => (
        <li
          key={i}
          {...reveal(i * 70)}
          className={`grid grid-cols-[3rem_1fr] gap-4 border-t py-7 ${
            dark ? "border-white/10" : "border-ev-line"
          }`}
        >
          <span className={`ev-label pt-1.5 ${dark ? "text-ev-signal" : "text-ev-moss"}`}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>
            <span className="block text-[1.3125rem] font-medium leading-snug tracking-[-0.025em]">
              {it.title}
            </span>
            {it.body ? (
              <span
                className={`mt-2 block text-[0.975rem] leading-relaxed ${
                  dark ? "text-white/55" : "text-ev-mute"
                }`}
              >
                {it.body}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Marco de navegador para mostrar UI del producto. */
export function BrowserFrame({
  url = "ethicvoice.co/app",
  children,
  dark = false,
}: {
  url?: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[1.25rem] border shadow-[0_50px_100px_-40px_rgba(11,29,33,0.4)] ${
        dark ? "border-white/10 bg-[#10252A]" : "border-ev-night/10 bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-2 border-b px-4 py-3 ${
          dark ? "border-white/10" : "border-ev-line bg-ev-paper/70"
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${dark ? "bg-white/15" : "bg-ev-line"}`} />
        <span className={`h-2.5 w-2.5 rounded-full ${dark ? "bg-white/15" : "bg-ev-line"}`} />
        <span
          className={`ev-label ml-3 rounded-full px-3 py-1 ${
            dark ? "bg-white/[0.06] text-white/45" : "bg-white text-ev-mute"
          }`}
        >
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}
