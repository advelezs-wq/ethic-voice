"use client";

import { useState } from "react";
import { HowItWorks } from "@/modules/landig-page/components/pricing/HowItWorks";
import { PricingCTA } from "@/modules/landig-page/components/pricing/PricingCTA";
import { PricingFAQ } from "@/modules/landig-page/components/pricing/PricingFAQ";
import { PricingHero } from "@/modules/landig-page/components/pricing/PricingHero";
import PricingPlans from "@/modules/landig-page/components/pricing/PricingPlans";
import { BillingCycle } from "@/types/subscription.types";
import Script from "next/script";
import React from "react";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

export const dynamic = "force-dynamic";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    BillingCycle.MONTHLY
  );

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
  };

  return (
    <MarketingPageShell>
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
      <PricingHero
        billingCycle={billingCycle}
        onBillingCycleChange={handleBillingCycleChange}
      />
      <PricingPlans billingCycle={billingCycle} />
      <HowItWorks />
      <PricingFAQ />
      <PricingCTA />
    </MarketingPageShell>
  );
};

export default Pricing;
