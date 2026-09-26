import type { SVGProps } from "react";

/**
 * Isotipo EthicVoice en vector: burbuja de conversación con tres líneas de
 * texto; la última termina en dos puntos (la voz que sigue hablando).
 * Colores exactos del logotipo original: slate #244850, signal #98D050.
 */
export function LogoMark({
  tone = "light",
  className,
  ...props
}: SVGProps<SVGSVGElement> & { tone?: "light" | "dark" }) {
  return (
    <svg
      viewBox="0 0 48 51"
      fill="none"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M11 0H37C43.075 0 48 4.925 48 11V29C48 35.075 43.075 40 37 40H17.5C14.2 40 11.6 42.2 9.6 45.6L8.1 48.2C6.9 50.3 3.9 49.8 3.4 47.4C3 45.4 1.9 42.6 1 40.4C0.35 38.8 0 37 0 35.2V11C0 4.925 4.925 0 11 0Z"
        fill="#244850"
        stroke={tone === "dark" ? "rgba(255,255,255,0.14)" : "none"}
      />
      <path
        d="M10.5 12H37.5M10.5 20.5H37.5M10.5 29H23"
        stroke="#98D050"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <circle cx="30.6" cy="29" r="2.5" fill="#98D050" />
      <circle cx="37.4" cy="29" r="2.5" fill="#98D050" />
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
      className={`inline-flex items-center gap-2.5 ${className}`}
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
