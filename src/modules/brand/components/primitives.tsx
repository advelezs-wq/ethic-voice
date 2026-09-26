import Link from "next/link";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
} from "react";

/**
 * Primitivas del sistema de marca (ver BRAND.md). Server-safe: sin hooks,
 * usables desde Server y Client Components.
 */

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ─── Layout ──────────────────────────────────────────────────────────────

export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag
      className={cx(
        "mx-auto w-full max-w-[var(--ev-max)] px-[var(--ev-gutter)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// ─── Etiquetas ───────────────────────────────────────────────────────────

/**
 * Etiqueta de sección con índice: `(03) Seguridad`. Mono, sin píldora ni
 * punto pulsante — se lee como un registro, no como un badge.
 */
export function Eyebrow({
  index,
  children,
  tone = "light",
  className,
}: {
  index?: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cx(
        "ev-label flex items-center gap-3",
        tone === "dark" ? "text-white/55" : "text-ev-mute",
        className,
      )}
    >
      {index ? (
        <span className={tone === "dark" ? "text-ev-signal" : "text-ev-moss"}>
          ({index})
        </span>
      ) : (
        <span
          className="h-1.5 w-1.5 shrink-0 bg-ev-signal"
          aria-hidden
        />
      )}
      <span>{children}</span>
    </p>
  );
}

// ─── Botones ─────────────────────────────────────────────────────────────

type ButtonVariant = "signal" | "ink" | "outline" | "outline-dark" | "text";
type ButtonSize = "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  signal:
    "bg-ev-signal text-ev-night hover:bg-[#a9dc66] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(11,29,33,0.18)]",
  ink: "bg-ev-night text-white hover:bg-ev-slate shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
  outline:
    "border border-ev-night/15 bg-transparent text-ev-night hover:border-ev-night/40 hover:bg-white/60",
  "outline-dark":
    "border border-white/20 bg-transparent text-white hover:border-white/45 hover:bg-white/[0.06]",
  text: "text-ev-night underline decoration-ev-night/25 underline-offset-[6px] hover:decoration-ev-night",
};

const SIZES: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-14 px-7 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "signal",
  size: ButtonSize = "md",
  className?: string,
) {
  return cx(
    "ev-press group/btn relative inline-flex select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] disabled:pointer-events-none disabled:opacity-50",
    variant !== "text" && SIZES[size],
    VARIANTS[variant],
    className,
  );
}

/** Flecha que se desplaza al hover — la única micro-animación del botón. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cx(
        "h-4 w-4 shrink-0 transition-transform duration-300 ease-ev-out group-hover/btn:translate-x-0.5",
        className,
      )}
      aria-hidden
    >
      <path
        d="M2.5 8h10M8.5 3.5 13 8l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant,
  size,
  arrow,
  className,
  children,
  ...rest
}: ButtonOwnProps & Omit<ComponentPropsWithoutRef<"button">, "className">) {
  return (
    <button
      type="button"
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {children}
      {arrow ? <Arrow /> : null}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  arrow,
  className,
  children,
  href,
  ...rest
}: ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children">) {
  return (
    <Link
      href={href}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {children}
      {arrow ? <Arrow /> : null}
    </Link>
  );
}

// ─── Titulares ───────────────────────────────────────────────────────────

/**
 * Titular que se revela línea por línea (máscara + translate). Pasa cada
 * línea como un elemento del array; usa <em> dentro para la voz serif.
 */
export function RevealHeading({
  as: Tag = "h2",
  lines,
  className,
  delay = 0,
  id,
}: {
  as?: ElementType;
  lines: ReactNode[];
  className?: string;
  delay?: number;
  id?: string;
}) {
  return (
    <Tag
      id={id}
      data-reveal-lines
      className={className}
      style={{ "--d": delay } as CSSProperties}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          className="ev-line"
          style={{ "--i": i } as CSSProperties}
        >
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/** Estilo de la palabra enfatizada en serif itálica. */
export function Voice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <em className={cx("ev-serif pr-[0.06em]", className)}>{children}</em>;
}

/** Atajo para `data-reveal` con retardo en ms. */
export function reveal(delay = 0) {
  return {
    "data-reveal": "",
    style: { "--d": delay } as CSSProperties,
  };
}
