"use client";

import { AboutHero } from "@/modules/landig-page/components/about/AboutHero";
import { AboutHistory } from "@/modules/landig-page/components/about/AboutHistory";
import { AboutOfficeGallery } from "@/modules/landig-page/components/about/AboutOfficeGallery";
import { AboutValues } from "@/modules/landig-page/components/about/AboutValues";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

const About = () => {
  return (
    <MarketingPageShell>
      <AboutHero />
      <AboutHistory />
      <AboutOfficeGallery />
      <AboutValues />
    </MarketingPageShell>
  );
};

export default About;
