import type { ReactNode } from "react";

/**
 * Primitivas decorativas del lenguaje visual V4 (rediseño premium).
 * Server-safe: sin hooks ni estado — usables desde Server y Client Components.
 */

/** Rejilla fina de líneas con desvanecido radial — textura tipo blueprint. */
export function LineGridPattern({ dark = false }: { dark?: boolean }) {
  const line = dark ? "rgba(255,255,255,0.045)" : "rgba(10,30,20,0.05)";
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
        maskImage:
          "radial-gradient(ellipse 90% 80% at 50% 0%, black 40%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 90% 80% at 50% 0%, black 40%, transparent 100%)",
      }}
      aria-hidden
    />
  );
}

/** Trama de puntos suave para secciones claras. */
export function DotPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(10,30,20,0.10) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
        maskImage:
          "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)",
      }}
      aria-hidden
    />
  );
}

/** Blob de gradiente flotante — da vida al fondo sin robar foco. */
export function FloatingBlob({
  className,
  color,
  duration = 9,
}: {
  className: string;
  color: string;
  duration?: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[90px] motion-safe:animate-float ${className}`}
      style={{ background: color, animationDuration: `${duration}s` }}
      aria-hidden
    />
  );
}

/** Eyebrow unificado — píldora con punto vivo, misma voz en todo el sitio. */
export function SectionEyebrow({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${
        dark
          ? "border-lime-300/25 bg-lime-300/[0.08] text-lime-300"
          : "border-emerald-600/20 bg-emerald-50/80 text-emerald-800"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${
            dark ? "bg-lime-300" : "bg-emerald-500"
          }`}
        />
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            dark ? "bg-lime-300" : "bg-emerald-600"
          }`}
        />
      </span>
      {children}
    </span>
  );
}
