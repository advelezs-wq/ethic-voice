"use client";

import { forwardRef } from "react";
import { Button as HeroButton, cn, type ButtonProps as HeroButtonProps } from "@heroui/react";

export type AppButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export interface AppButtonProps extends Omit<HeroButtonProps, "color" | "variant"> {
  appVariant?: AppButtonVariant;
}

const VARIANT_CLASSNAMES: Record<AppButtonVariant, string> = {
  // Filled lime pill — the landing page's primary CTA look.
  primary:
    "bg-lime-400 text-[#0d212c] font-semibold shadow-[0_10px_24px_-12px_rgba(163,230,53,0.65)] hover:bg-lime-300 data-[hover=true]:bg-lime-300",
  // Filled emerald pill — secondary action.
  secondary:
    "bg-emerald-600 text-white font-semibold hover:bg-emerald-500 data-[hover=true]:bg-emerald-500",
  // White pill with dark border — the landing page's "Ver la plataforma" style.
  outline:
    "bg-white text-[#0d212c] font-semibold border-2 border-[#0d212c]/90 hover:bg-[#0d212c]/5 data-[hover=true]:bg-[#0d212c]/5",
  ghost:
    "bg-transparent text-[#0d212c] font-medium hover:bg-emerald-50 data-[hover=true]:bg-emerald-50",
  danger:
    "bg-red-600 text-white font-semibold hover:bg-red-500 data-[hover=true]:bg-red-500",
};

/**
 * Brand-styled Button — same rounded-full pill treatment as the landing page's CTAs.
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
