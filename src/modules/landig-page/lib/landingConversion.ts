"use client";

import { useEffect, useMemo, useState } from "react";
import { trackGA4Event } from "@/lib/google-analytics";

const VARIANT_KEY = "ev_lp_variant";
const UTM_KEY = "ev_lp_utm";

export type LandingVariant = "control" | "trust";

export function useLandingVariant(): LandingVariant {
  const [variant, setVariant] = useState<LandingVariant>("control");

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("lp_variant");
      if (q === "control" || q === "trust") {
        localStorage.setItem(VARIANT_KEY, q);
        setVariant(q);
        return;
      }
      const stored = localStorage.getItem(VARIANT_KEY);
      if (stored === "control" || stored === "trust") {
        setVariant(stored);
        return;
      }
      const random: LandingVariant = Math.random() > 0.5 ? "control" : "trust";
      localStorage.setItem(VARIANT_KEY, random);
      setVariant(random);
    } catch {
      setVariant("control");
    }
  }, []);

  return variant;
}

export function useUtmCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const utm = {
        source: url.searchParams.get("utm_source"),
        medium: url.searchParams.get("utm_medium"),
        campaign: url.searchParams.get("utm_campaign"),
        term: url.searchParams.get("utm_term"),
        content: url.searchParams.get("utm_content"),
      };
      const hasAny = Object.values(utm).some(Boolean);
      if (!hasAny) return;
      localStorage.setItem(UTM_KEY, JSON.stringify(utm));
      trackGA4Event("landing_utm_capture", utm);
    } catch {
      // noop
    }
  }, []);
}

export function useLandingViewEvent(variant: LandingVariant) {
  const payload = useMemo(() => ({ variant }), [variant]);

  useEffect(() => {
    trackGA4Event("landing_view", payload);
  }, [payload]);
}
