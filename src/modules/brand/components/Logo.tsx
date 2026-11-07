import type { SVGProps } from "react";

/**
 * Isotipo EthicVoice en vector: burbuja de conversación con tres líneas de
 * texto; la última termina en dos puntos (la voz que sigue hablando). La cola
 * baja recta a la izquierda, calcada del logotipo original.
 * Colores exactos del logotipo original: slate #244850, signal #98D050.
 */
export function LogoMark({
  tone = "light",
  className,
  ...props
}: SVGProps<SVGSVGElement> & { tone?: "light" | "dark" }) {
  return (
    <svg
      viewBox="0 0 48 54"
      fill="none"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M10 0H38A10 10 0 0 1 48 10V35A10 10 0 0 1 38 45H19C17.6 45 16.6 46 16.6 47.4V51.3C16.6 53.1 14.9 54.3 13.2 53.7C5.6 51 0 44.6 0 36.2V10A10 10 0 0 1 10 0Z"
        fill="#244850"
        stroke={tone === "dark" ? "rgba(255,255,255,0.14)" : "none"}
      />
      <path
        d="M10 13H38M10 22.2H38M10 31.4H23"
        stroke="#98D050"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <circle cx="30" cy="31.4" r="2.25" fill="#98D050" />
      <circle cx="36.4" cy="31.4" r="2.25" fill="#98D050" />
    </svg>
  );
}

export function Logo({
  tone = "light",
  className = "",
  markClassName = "h-8 w-auto",
}: {
  tone?: "light" | "dark";
  className?: string;
  markClassName?: string;
}) {
  return (
    <span
      translate="no"
      className={`notranslate inline-flex items-center gap-2.5 ${className}`}
      aria-label="EthicVoice"
    >
      <LogoMark tone={tone} className={markClassName} />
      <span
        className="font-wordmark text-[1.3rem] font-semibold leading-none tracking-[-0.03em]"
        aria-hidden
      >
        <span className={tone === "dark" ? "text-white" : "text-ev-slate"}>
          Ethic
        </span>
        <span className="text-ev-signal">Voice</span>
      </span>
    </span>
  );
}
