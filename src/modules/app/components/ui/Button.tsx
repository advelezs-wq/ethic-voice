"use client";

import { forwardRef } from "react";
import { Button as HeroButton, cn, type ButtonProps as HeroButtonProps } from "@heroui/react";

export type AppButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export interface AppButtonProps extends Omit<HeroButtonProps, "color" | "variant"> {
  appVariant?: AppButtonVariant;
}

const VARIANT_CLASSNAMES: Record<AppButtonVariant, string> = {
  // Tinta — la acción principal, como los CTAs sobrios del sitio.
  primary:
    "bg-ev-night text-white font-medium data-[hover=true]:bg-ev-slate data-[pressed=true]:scale-[0.97]",
  // Lima del logo — énfasis puntual (activar, confirmar algo positivo).
  secondary:
    "bg-ev-signal text-ev-night font-medium data-[hover=true]:bg-[#a9dc66] data-[pressed=true]:scale-[0.97]",
  outline:
    "bg-white text-ev-night font-medium border border-ev-night/15 data-[hover=true]:border-ev-night/40 data-[pressed=true]:scale-[0.97]",
  ghost:
    "bg-transparent text-ev-night font-medium data-[hover=true]:bg-ev-night/[0.05]",
  danger:
    "bg-ev-coral text-white font-medium data-[hover=true]:bg-[#B23A28] data-[pressed=true]:scale-[0.97]",
};

/**
 * Botón de marca (BRAND.md § Componentes) — píldora, respuesta al presionar.
 * Thin wrapper over HeroUI's Button; pass any other HeroUI Button prop through as usual.
 */
export const Button = forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ appVariant = "primary", className, radius = "full", ...props }, ref) => {
    return (
      <HeroButton
        ref={ref}
        radius={radius}
        className={cn(VARIANT_CLASSNAMES[appVariant], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
