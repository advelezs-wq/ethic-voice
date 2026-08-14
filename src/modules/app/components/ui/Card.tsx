"use client";

import { forwardRef } from "react";
import { Card as HeroCard, cn, type CardProps as HeroCardProps } from "@heroui/react";

export interface AppCardProps extends HeroCardProps {
  /** Adds the dashboard's soft emerald border + shadow treatment (default true). */
  surface?: boolean;
}

/**
 * Brand-styled Card — rounded-2xl, soft emerald border and shadow matching the landing page's
 * card language. Use HeroUI's CardHeader/CardBody/CardFooter as children like any other Card.
 */
export const Card = forwardRef<HTMLDivElement, AppCardProps>(
  ({ surface = true, className, radius = "lg", shadow = "sm", ...props }, ref) => {
    return (
      <HeroCard
        ref={ref}
        radius={radius}
        shadow={shadow}
        className={cn(
          "rounded-2xl",
          surface &&
            "border border-emerald-100 bg-white/95 shadow-[0_16px_40px_-30px_rgba(5,26,36,0.45)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
