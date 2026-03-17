"use client";

import { AboutHero } from "@/modules/landig-page/components/about/AboutHero";
import { AboutHistory } from "@/modules/landig-page/components/about/AboutHistory";
import { AboutOfficeGallery } from "@/modules/landig-page/components/about/AboutOfficeGallery";
import { AboutValues } from "@/modules/landig-page/components/about/AboutValues";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
import { Header } from "@/modules/landig-page/components/layout/Header";
import { BackgroundCurves } from "@/modules/landig-page/components/layout/BackgroundCurves";

const About = () => {
  return (
    <div className="min-h-screen bg-white bg-curves relative">
      <BackgroundCurves />
      <Header />
      <main className="pt-20">
        <AboutHero />
        <AboutHistory />
        <AboutOfficeGallery />
        <AboutValues />
      </main>
      <Footer />
    </div>
  );
};

export default About;
