"use client";

import { useState } from "react";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
import { Header } from "@/modules/landig-page/components/layout/Header";
import { HowItWorks } from "@/modules/landig-page/components/pricing/HowItWorks";
import { PricingCTA } from "@/modules/landig-page/components/pricing/PricingCTA";
import { PricingFAQ } from "@/modules/landig-page/components/pricing/PricingFAQ";
import { PricingHero } from "@/modules/landig-page/components/pricing/PricingHero";
import PricingPlans from "@/modules/landig-page/components/pricing/PricingPlans";
import { BillingCycle } from "@/types/subscription.types";
import Script from "next/script";
import React from "react";
import { BackgroundCurves } from "@/modules/landig-page/components/layout/BackgroundCurves";

// Force dynamic rendering since this uses client-side features
export const dynamic = "force-dynamic";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    BillingCycle.MONTHLY
  );

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
  };

  return (
    <div className="min-h-screen bg-white bg-curves relative">
      <div className="absolute inset-0 -z-[1]">
        <BackgroundCurves />
      </div>
      {/* Calendly Widget CSS */}
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
      />
      {/* Calendly Widget Script */}
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
      <Header />
      <main className="pt-20">
        <PricingHero
          billingCycle={billingCycle}
          onBillingCycleChange={handleBillingCycleChange}
        />
        <PricingPlans billingCycle={billingCycle} />
        <HowItWorks />
        <PricingFAQ />
        <PricingCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
