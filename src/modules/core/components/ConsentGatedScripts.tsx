"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCookieConsentOptional } from "@/modules/core/providers/CookieConsentContext";
import {
  effectiveMarketingAllowed,
  type ConsentRecord,
} from "@/lib/cookie-consent/types";
import { updateGA4Consent } from "@/lib/google-analytics";
import { updateClarityConsent } from "@/lib/clarity";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function applyGtagConsent(c: ConsentRecord): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const marketingOn = effectiveMarketingAllowed(c);
  updateGA4Consent({
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: marketingOn ? "granted" : "denied",
    ad_user_data: marketingOn ? "granted" : "denied",
    ad_personalization: marketingOn ? "granted" : "denied",
    functionality_storage: c.functional ? "granted" : "denied",
    personalization_storage: c.functional ? "granted" : "denied",
    security_storage: "granted",
  });
}

/**
 * Carga FB Pixel, Clarity y GA4 solo tras consentimiento explícito (RGPD / ePrivacy).
 * GA4 se usa si analytics o marketing (medición de campañas).
 */
export function ConsentGatedScripts() {
  const ctx = useCookieConsentOptional();
  const consent = ctx?.consent;
  const [gaLibLoaded, setGaLibLoaded] = useState(false);

  const loadGa = useMemo(() => {
    if (!consent || !GA_MEASUREMENT_ID) return false;
    return consent.analytics || effectiveMarketingAllowed(consent);
  }, [consent]);

  const loadFb = useMemo(() => {
    if (!consent || !FB_PIXEL_ID) return false;
    return effectiveMarketingAllowed(consent);
  }, [consent]);

  const loadClarity = useMemo(() => {
    if (!consent || !CLARITY_ID) return false;
    return consent.analytics;
  }, [consent]);

  const onGaLibLoad = useCallback(() => {
    setGaLibLoaded(true);
  }, []);

  useEffect(() => {
    if (!loadGa) setGaLibLoaded(false);
  }, [loadGa]);

  useEffect(() => {
    if (!gaLibLoaded || !consent || !GA_MEASUREMENT_ID) return;
    applyGtagConsent(consent);
    try {
      window.gtag?.("config", GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        send_page_view: true,
      });
    } catch {
      /* noop */
    }
  }, [gaLibLoaded, consent]);

  useEffect(() => {
    if (!consent) return;
    try {
      updateClarityConsent(consent.analytics ? "granted" : "denied");
    } catch {
      /* noop */
    }
  }, [consent, loadClarity]);

  useEffect(() => {
    if (!consent || !GA_MEASUREMENT_ID) return;
    if (typeof window.gtag === "function") {
      applyGtagConsent(consent);
    }
  }, [consent]);

  if (!ctx) return null;

  return (
    <>
      {loadFb && (
        <>
          <Script id="facebook-pixel-consent" strategy="afterInteractive">
            {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}

      {loadClarity && (
        <Script id="microsoft-clarity-consent" strategy="afterInteractive">
          {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
        </Script>
      )}

      {loadGa && GA_MEASUREMENT_ID && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
          onLoad={onGaLibLoad}
        />
      )}
    </>
  );
}
