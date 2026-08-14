"use client";

import type { ReactNode } from "react";
import { cn } from "@heroui/react";
import { LineGridPattern } from "@/modules/landig-page/components/decor";
import { SectionReveal } from "./SectionReveal";

export interface PageHeroProps {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * Formalizes the `.ev-page-hero` dark ink band (see src/app/globals.css) into a reusable
 * component: kicker / title / description / actions, with the landing page's line-grid texture
 * behind the content. Used as the top-of-page header on every dashboard route.
 */
export function PageHero({ kicker, title, description, actions, className, children }: PageHeroProps) {
  return (
    <SectionReveal>
      <div className={cn("ev-page-hero relative overflow-hidden", className)}>
        <LineGridPattern dark />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {kicker ? <p className="ev-page-hero-kicker">{kicker}</p> : null}
            <h1 className="ev-page-hero-title">{title}</h1>
            {description ? <p className="ev-page-hero-description">{description}</p> : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        {children ? <div className="relative mt-4">{children}</div> : null}
      </div>
    </SectionReveal>
  );
}
