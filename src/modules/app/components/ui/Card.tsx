"use client";

import { forwardRef } from "react";
import { Card as HeroCard, cn, type CardProps as HeroCardProps } from "@heroui/react";

export interface AppCardProps extends HeroCardProps {
  /** Superficie de marca: blanco sobre papel, borde de línea, sin sombra (por defecto true). */
  surface?: boolean;
}

/**
 * Card de marca — blanco sobre el papel del dashboard, borde `ev-line` y
 * radio de 16px. Úsala con CardHeader/CardBody/CardFooter de HeroUI.
 */
export const Card = forwardRef<HTMLDivElement, AppCardProps>(
  ({ surface = true, className, radius = "lg", shadow = "none", ...props }, ref) => {
    return (
      <HeroCard
        ref={ref}
        radius={radius}
        shadow={shadow}
        className={cn(surface && "rounded-2xl border border-ev-line bg-white", className)}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
