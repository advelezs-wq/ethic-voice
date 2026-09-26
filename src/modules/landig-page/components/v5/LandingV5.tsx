"use client";

import Script from "next/script";
import { SiteShell } from "@/modules/brand/components/SiteShell";
import {
  useLandingVariant,
  useLandingViewEvent,
  useUtmCapture,
} from "@/modules/landig-page/lib/landingConversion";
import { BeforeAfter } from "./BeforeAfter";
import { Faq } from "./Faq";
import { FAQS } from "./content";
import { GuideBand } from "./GuideBand";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Industries } from "./Industries";
import { Manifesto } from "./Manifesto";
import { Pricing } from "./Pricing";
import { ProductTour } from "./ProductTour";
import { ReportPortal } from "./ReportPortal";
import { Security } from "./Security";
import { Testimonials } from "./Testimonials";

/**
 * Landing V5 — narrativa de conversión:
 * promesa → costo de no actuar → antes/después → cómo funciona → prueba
 * (video, seguridad, voces) → precio → objeciones → lead magnet → cierre.
 * La ruta del denunciante (/submit, /track) queda a un clic en todo momento.
 */
export function LandingV5() {
  const variant = useLandingVariant();
  useUtmCapture();
  useLandingViewEvent(variant);

  return (
    <SiteShell>
      <Script
        id="ethicvoice-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
      <Hero variant={variant} />
      <Manifesto />
      <BeforeAfter />
      <HowItWorks />
      <ProductTour />
      <Industries />
      <Security />
      <Testimonials />
      <ReportPortal />
      <Pricing />
      <Faq />
      <GuideBand />
    </SiteShell>
  );
}
